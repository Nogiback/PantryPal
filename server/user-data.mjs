import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import path from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lightweight .env loader so this file can run directly with `node`
// (without adding dotenv as an extra dependency).
const loadDotEnv = () => {
  const envCandidates = [path.resolve(process.cwd(), '.env'), path.resolve(__dirname, '..', '.env')];
  const envPath = envCandidates.find((candidate) => existsSync(candidate));
  if (!envPath) return null;

  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }

  return envPath;
};

const loadedEnvPath = loadDotEnv();

const PORT = Number(process.env.USER_DATA_PORT || 8788);
const HOST = process.env.USER_DATA_HOST || '127.0.0.1';

// ---- CORS/JSON helpers ----
const sendJson = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(body));
};

const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('Payload too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });

// ---- AWS DynamoDB Backend ----
const STATE_TABLE_NAME = "pantrypal-state";
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const docClient = DynamoDBDocumentClient.from(ddbClient);

let localCache = null;

const readAuthDb = async () => {
  try {
    const data = await docClient.send(new GetCommand({
      TableName: STATE_TABLE_NAME,
      Key: { PK: "STATE", SK: "STATE" }
    }));
    if (data.Item && data.Item.db) {
       localCache = data.Item.db;
       return data.Item.db;
    }
  } catch (err) {
    if (localCache) return localCache;
    console.warn("DynamoDB Read Failed, checking for fallback...", err.message);
  }
  return { users: [], sessions: {} };
};

const writeAuthDb = async (db) => {
  localCache = db; 
  try {
    await docClient.send(new PutCommand({
      TableName: STATE_TABLE_NAME,
      Item: {
        PK: "STATE",
        SK: "STATE",
        db
      }
    }));
  } catch (err) {
    console.warn("DynamoDB Write Failed", err.message);
  }
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const hashPassword = (password) => {
  const salt = randomBytes(16);
  const hash = scryptSync(String(password), salt, 32);
  return `${salt.toString('base64')}:${hash.toString('base64')}`;
};

const verifyPassword = (password, stored) => {
  const [saltB64, hashB64] = String(stored || '').split(':');
  if (!saltB64 || !hashB64) return false;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  const actual = scryptSync(String(password), salt, expected.length);
  return timingSafeEqual(actual, expected);
};

const newToken = () => randomBytes(24).toString('base64url');

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
};

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  onboardingCompleted: (user?.onboardingCompleted ?? false) === true,
});

const getUserFromRequest = async (req) => {
  const token = getBearerToken(req);
  if (!token) return { token: '', user: null };

  const db = await readAuthDb();
  const session = db.sessions[token];
  if (!session?.userId) return { token, user: null };

  const user = db.users.find((u) => u.id === session.userId) || null;
  return { token, user };
};

const sanitizePantryPayload = (payload) => {
  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  const sanitized = [];

  for (const item of rawItems) {
    if (!item || typeof item !== 'object') continue;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name) continue;
    const quantity = typeof item.quantity === 'string' ? item.quantity.trim() : '';
    const id =
      typeof item.id === 'string' && item.id.trim() ? item.id.trim() : randomBytes(12).toString('hex');
    const obj = { id, name, quantity };
    if (typeof item.unit === 'string') obj.unit = item.unit.trim();
    if (typeof item.expiryDate === 'string') obj.expiryDate = item.expiryDate.trim();
    if (typeof item.notes === 'string') obj.notes = item.notes.trim();
    if (typeof item.category === 'string') obj.category = item.category.trim();

    sanitized.push(obj);
  }

  return sanitized;
};

const sanitizeOnboardingPayload = (payload) => {
  const toStringArray = (value) =>
    Array.isArray(value)
      ? value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
      : [];

  const spiceRaw = Number(payload?.taste?.spiceLevel ?? 0);
  const spiceLevel = Number.isFinite(spiceRaw) ? Math.max(0, Math.min(4, Math.round(spiceRaw))) : 0;

  return {
    dietaryPreference:
      typeof payload?.dietaryPreference === 'string' ? payload.dietaryPreference.trim() : 'No restrictions',
    allergies: toStringArray(payload?.allergies),
    customAvoid: toStringArray(payload?.customAvoid),
    taste: {
      flavors: toStringArray(payload?.taste?.flavors),
      spiceLevel,
    },
    goals: toStringArray(payload?.goals),
  };
};

// ---- Spoonacular proxy helpers ----
const SPOONACULAR_API_BASE_URL =
  process.env.SPOONACULAR_API_BASE_URL ||
  process.env.VITE_SPOONACULAR_API_BASE_URL ||
  'https://api.spoonacular.com';
let SPOONACULAR_API_KEYS = String(
  process.env.SPOONACULAR_API_KEY || process.env.SPOONACULAR_API_KEYS || process.env.VITE_SPOONACULAR_API_KEY || '',
)
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

if (SPOONACULAR_API_KEYS.length === 0) {
  const ssmClient = new SSMClient({ region: process.env.AWS_REGION || "us-east-1" });
  try {
    const param = await ssmClient.send(new GetParameterCommand({
      Name: "/pantrypal/SPOONACULAR_API_KEYS",
      WithDecryption: true
    }));
    if (param.Parameter && param.Parameter.Value) {
      SPOONACULAR_API_KEYS = param.Parameter.Value.split(',').map(k => k.trim()).filter(Boolean);
      console.log("[user-data] Successfully loaded Spoonacular API Keys from AWS SSM Parameter Store");
    }
  } catch (err) {
    console.warn("[user-data] Failed to load keys from AWS SSM:", err.message);
  }
}

console.log(
  `[user-data] env=${loadedEnvPath ?? 'none'} spoonacularKeys=${SPOONACULAR_API_KEYS.length} baseUrl=${SPOONACULAR_API_BASE_URL}`,
);

let spoonacularKeyIndex = 0;
const getCurrentSpoonacularKey = () => SPOONACULAR_API_KEYS[spoonacularKeyIndex] || '';
const rotateSpoonacularKey = () => {
  if (SPOONACULAR_API_KEYS.length <= 1) return false;
  spoonacularKeyIndex = (spoonacularKeyIndex + 1) % SPOONACULAR_API_KEYS.length;
  return true;
};

const buildSpoonacularUrl = (pathName, params) => {
  const url = new URL(pathName, SPOONACULAR_API_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim().length === 0) continue;
    url.searchParams.set(key, String(value));
  }
  return url;
};

const fetchSpoonacularJson = async (urlWithoutKey) => {
  if (SPOONACULAR_API_KEYS.length === 0) {
    const error = new Error(
      'Spoonacular API key is not configured. Set SPOONACULAR_API_KEY or SPOONACULAR_API_KEYS in your .env, then restart `npm run dev:user`. (Fallback also supported: VITE_SPOONACULAR_API_KEY, but that exposes the key to the browser.)',
    );
    error.code = 'NO_KEY';
    throw error;
  }

  let attempts = 0;
  while (attempts < SPOONACULAR_API_KEYS.length) {
    const apiKey = getCurrentSpoonacularKey();
    const url = new URL(urlWithoutKey.toString());
    url.searchParams.set('apiKey', apiKey);

    const response = await fetch(url);
    if (response.ok) return await response.json();

    if (response.status === 401 || response.status === 402) {
      attempts += 1;
      rotateSpoonacularKey();
      continue;
    }

    const text = await response.text().catch(() => '');
    const error = new Error(`Spoonacular error ${response.status}: ${text}`);
    error.status = response.status;
    throw error;
  }

  const error = new Error('All Spoonacular keys failed (401/402).');
  error.status = 402;
  throw error;
};

const normalizeCommaList = (items) =>
  Array.from(
    new Set(
      (Array.isArray(items) ? items : [])
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean),
    ),
  );

const normalizeLoose = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const mapAllergiesToSpoonacularIntolerances = (allergies) => {
  const normalized = normalizeCommaList(allergies).map((x) => x.toLowerCase());
  const intolerances = new Set();

  for (const item of normalized) {
    if (item === 'dairy') intolerances.add('dairy');
    if (item === 'eggs' || item === 'egg') intolerances.add('egg');
    if (item === 'gluten') intolerances.add('gluten');
    if (item === 'soy') intolerances.add('soy');
    if (item === 'shellfish') intolerances.add('shellfish');
    if (item === 'fish' || item === 'seafood') intolerances.add('seafood');
    if (item === 'sesame') intolerances.add('sesame');
    if (item === 'nuts' || item === 'nut') {
      intolerances.add('tree nut');
      intolerances.add('peanut');
    }
    if (item === 'peanut' || item === 'peanuts') intolerances.add('peanut');
  }

  return Array.from(intolerances);
};

const filterIncludeAgainstRestrictions = (includeIngredients, allergies, excludeIngredients) => {
  const normalizedExclude = new Set(normalizeCommaList(excludeIngredients).map(normalizeLoose).filter(Boolean));
  const normalizedAllergies = new Set(normalizeCommaList(allergies).map(normalizeLoose).filter(Boolean));

  const allergyKeywords = {
    dairy: ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'whey'],
    egg: ['egg', 'eggs', 'mayonnaise'],
    eggs: ['egg', 'eggs', 'mayonnaise'],
    nuts: ['nuts', 'nut', 'almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'pecan', 'peanut'],
    nut: ['nuts', 'nut', 'almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'pecan', 'peanut'],
    peanut: ['peanut', 'peanuts'],
    shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish'],
    fish: ['fish', 'salmon', 'tuna', 'cod'],
    soy: ['soy', 'tofu', 'edamame', 'soy sauce'],
    gluten: ['wheat', 'flour', 'bread', 'pasta', 'barley', 'rye', 'gluten'],
    sesame: ['sesame', 'tahini'],
  };

  const disallowedKeywords = new Set();
  for (const allergy of normalizedAllergies) {
    const keywords = allergyKeywords[allergy];
    if (!keywords) continue;
    for (const keyword of keywords) disallowedKeywords.add(keyword);
  }

  const filteredOutIngredients = [];
  const filteredIncludeIngredients = normalizeCommaList(includeIngredients).filter((raw) => {
    const ingredient = normalizeLoose(raw);
    if (!ingredient) return false;

    if (normalizedExclude.has(ingredient)) {
      filteredOutIngredients.push(raw);
      return false;
    }

    // Loose exclude match: exclude="beef" should remove "ground beef", etc.
    for (const exclude of normalizedExclude) {
      if (!exclude) continue;
      const re = new RegExp(`(^|\\s)${escapeRegex(exclude)}(\\s|$)`, 'i');
      if (re.test(ingredient)) {
        filteredOutIngredients.push(raw);
        return false;
      }
    }

    if (normalizedAllergies.has(ingredient)) {
      filteredOutIngredients.push(raw);
      return false;
    }

    for (const keyword of disallowedKeywords) {
      if (ingredient === keyword) {
        filteredOutIngredients.push(raw);
        return false;
      }
      const re = new RegExp(`(^|\\s)${escapeRegex(keyword)}(\\s|$)`, 'i');
      if (re.test(ingredient)) {
        filteredOutIngredients.push(raw);
        return false;
      }
    }

    return true;
  });

  return { filteredIncludeIngredients, filteredOutIngredients };
};

const isVegetarianDiet = (diet) => {
  const value = typeof diet === 'string' ? diet.trim().toLowerCase() : '';
  return value === 'vegetarian' || value === 'vegan';
};

const VEGETARIAN_EXCLUDE_KEYWORDS = [
  'beef',
  'pork',
  'chicken',
  'turkey',
  'lamb',
  'veal',
  'bacon',
  'ham',
  'sausage',
  'pepperoni',
  'salami',
  'prosciutto',
  'anchovy',
  'fish',
  'shrimp',
  'crab',
  'lobster',
  'shellfish',
  'tuna',
  'salmon',
  'cod',
  'gelatin',
];

// ---- Server ----
const server = createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: 'Invalid request.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  // ---- Auth ----
  if (req.method === 'POST' && req.url === '/api/auth/signup') {
    try {
      const raw = await readRequestBody(req);
      const payload = JSON.parse(raw);
      const name = typeof payload.name === 'string' ? payload.name.trim() : '';
      const email = normalizeEmail(payload.email);
      const password = typeof payload.password === 'string' ? payload.password : '';
      if (!name || !email || !password) {
        sendJson(res, 400, { error: 'name, email, and password are required.' });
        return;
      }

      const db = await readAuthDb();
      if (db.users.some((u) => u.email === email)) {
        sendJson(res, 409, { error: 'Email already exists.' });
        return;
      }

      const user = {
        id: randomBytes(16).toString('hex'),
        name,
        email,
        passwordHash: hashPassword(password),
        onboardingCompleted: false,
        onboarding: null,
        pantry: [],
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);

      const token = newToken();
      db.sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
      await writeAuthDb(db);

      sendJson(res, 200, { token, user: toPublicUser(user) });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error.';
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/auth/login') {
    try {
      const raw = await readRequestBody(req);
      const payload = JSON.parse(raw);
      const email = normalizeEmail(payload.email);
      const password = typeof payload.password === 'string' ? payload.password : '';
      if (!email || !password) {
        sendJson(res, 400, { error: 'email and password are required.' });
        return;
      }

      const db = await readAuthDb();
      const user = db.users.find((u) => u.email === email);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        sendJson(res, 401, { error: 'Invalid email or password.' });
        return;
      }

      const token = newToken();
      db.sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
      await writeAuthDb(db);

      sendJson(res, 200, { token, user: toPublicUser(user) });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error.';
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/api/auth/me') {
    const { user } = await getUserFromRequest(req);
    if (!user) {
      sendJson(res, 401, { error: 'Unauthorized.' });
      return;
    }
    sendJson(res, 200, { user: toPublicUser(user) });
    return;
  }

  // ---- Onboarding ----
  if (req.method === 'GET' && req.url === '/api/onboarding/me') {
    const { user } = await getUserFromRequest(req);
    if (!user) {
      sendJson(res, 401, { error: 'Unauthorized.' });
      return;
    }
    sendJson(res, 200, {
      onboardingCompleted: (user?.onboardingCompleted ?? false) === true,
      onboarding: user?.onboarding ?? null,
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/onboarding/me') {
    try {
      const { token, user } = await getUserFromRequest(req);
      if (!user) {
        sendJson(res, 401, { error: 'Unauthorized.' });
        return;
      }

      const raw = await readRequestBody(req);
      const payload = JSON.parse(raw);
      const onboarding = sanitizeOnboardingPayload(payload);

      const db = await readAuthDb();
      const session = db.sessions[token];
      if (!session?.userId) {
        sendJson(res, 401, { error: 'Unauthorized.' });
        return;
      }

      const userIndex = db.users.findIndex((u) => u.id === session.userId);
      if (userIndex < 0) {
        sendJson(res, 401, { error: 'Unauthorized.' });
        return;
      }

      db.users[userIndex] = {
        ...db.users[userIndex],
        onboarding,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
      };
      await writeAuthDb(db);

      sendJson(res, 200, { ok: true, onboardingCompleted: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error.';
      sendJson(res, 500, { error: message });
    }
    return;
  }

  // ---- Pantry ----
  if (req.method === 'GET' && req.url === '/api/pantry/me') {
    const { user } = await getUserFromRequest(req);
    if (!user) {
      sendJson(res, 401, { error: 'Unauthorized.' });
      return;
    }
    const pantry = Array.isArray(user.pantry) ? user.pantry : [];
    // Keep backward/forward compatibility with different frontend shapes.
    sendJson(res, 200, { pantry, items: pantry });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/pantry/me') {
    try {
      const { token, user } = await getUserFromRequest(req);
      if (!user) {
        sendJson(res, 401, { error: 'Unauthorized.' });
        return;
      }

      const raw = await readRequestBody(req);
      const payload = JSON.parse(raw);
      const pantry = sanitizePantryPayload(payload);

      const db = await readAuthDb();
      const session = db.sessions[token];
      if (!session?.userId) {
        sendJson(res, 401, { error: 'Unauthorized.' });
        return;
      }

      const userIndex = db.users.findIndex((u) => u.id === session.userId);
      if (userIndex < 0) {
        sendJson(res, 401, { error: 'Unauthorized.' });
        return;
      }

      db.users[userIndex] = { ...db.users[userIndex], pantry };
      await writeAuthDb(db);

      sendJson(res, 200, { ok: true, pantry, items: pantry });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error.';
      sendJson(res, 500, { error: message });
    }
    return;
  }

  // ---- Spoonacular proxy ----
  if (req.method === 'GET' && req.url === '/api/spoonacular/status') {
    sendJson(res, 200, {
      envPath: loadedEnvPath ?? null,
      baseUrl: SPOONACULAR_API_BASE_URL,
      keysConfigured: SPOONACULAR_API_KEYS.length > 0,
      keysCount: SPOONACULAR_API_KEYS.length,
      sources: {
        SPOONACULAR_API_KEY: Boolean(process.env.SPOONACULAR_API_KEY),
        SPOONACULAR_API_KEYS: Boolean(process.env.SPOONACULAR_API_KEYS),
        VITE_SPOONACULAR_API_KEY: Boolean(process.env.VITE_SPOONACULAR_API_KEY),
      },
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/recipes/spoonacular') {
    try {
      const raw = await readRequestBody(req);
      const payload = JSON.parse(raw);

      const originalIngredients = normalizeCommaList(payload.ingredients);
      const allergies = normalizeCommaList(payload.intolerances);
      const excludeIngredients = normalizeCommaList(payload.excludeIngredients);

      const diet = typeof payload.diet === 'string' ? payload.diet.trim() : '';
      const sort = typeof payload.sort === 'string' ? payload.sort.trim() : '';
      const maxReadyTime = Number(payload.maxReadyTime);

      const spoonacularIntolerances = mapAllergiesToSpoonacularIntolerances(allergies);
      const vegetarianMode = isVegetarianDiet(diet);
      const effectiveExcludeIngredients = normalizeCommaList([
        ...excludeIngredients,
        ...(vegetarianMode ? VEGETARIAN_EXCLUDE_KEYWORDS : []),
      ]);

      const requestedNumberRaw = payload.number;
      const requestedNumber = Number(requestedNumberRaw);
      const number = Number.isFinite(requestedNumber) ? Math.max(1, Math.min(40, requestedNumber)) : 20;

      const { filteredIncludeIngredients, filteredOutIngredients } = filterIncludeAgainstRestrictions(
        originalIngredients,
        allergies,
        effectiveExcludeIngredients,
      );

      if (filteredIncludeIngredients.length === 0) {
        sendJson(res, 200, {
          recipes: [],
          applied: {
            endpoint: '/recipes/complexSearch',
            diet: diet || null,
            originalIngredients,
            includeIngredients: [],
            filteredOutIngredients,
            intolerances: allergies,
            excludeIngredients: effectiveExcludeIngredients,
            totalResults: 0,
            number,
            ignorePantry: true,
            ranking: 1,
            addRecipeInformation: true,
            fillIngredients: true,
            tuning: {
              ...(sort ? { sort } : {}),
              ...(Number.isFinite(maxReadyTime) ? { maxReadyTime } : {}),
            },
          },
        });
        return;
      }

      const buildUrl = (includeIngredients) =>
        buildSpoonacularUrl('/recipes/complexSearch', {
          includeIngredients: includeIngredients.join(','),
          intolerances: spoonacularIntolerances.join(','),
          excludeIngredients: effectiveExcludeIngredients.join(','),
          diet,
          sort,
          maxReadyTime: Number.isFinite(maxReadyTime) ? maxReadyTime : undefined,
          number,
          addRecipeInformation: true,
          fillIngredients: true,
          ignorePantry: true,
          ranking: 1,
        });

      // `includeIngredients` is an AND filter.
      let data = null;
      let results = [];
      let totalResults = null;
      let includeIngredients = [];
      let retriedWithReducedIncludeIngredients = false;

      const strategies = [];
      if (filteredIncludeIngredients.length > 0) {
        if (filteredIncludeIngredients.length >= 5) strategies.push(filteredIncludeIngredients.slice(0, 5));
        if (filteredIncludeIngredients.length >= 3) strategies.push(filteredIncludeIngredients.slice(0, 3));
        strategies.push(filteredIncludeIngredients.slice(0, 1));
        if (filteredIncludeIngredients.length >= 2) strategies.push(filteredIncludeIngredients.slice(1, 2));
      }
      strategies.push([]); // Ultimate fallback: no ingredient enforced, just use diet/allergies

      for (let i = 0; i < strategies.length; i++) {
        includeIngredients = strategies[i];
        if (i > 0) retriedWithReducedIncludeIngredients = true;

        data = await fetchSpoonacularJson(buildUrl(includeIngredients));
        results = Array.isArray(data?.results) ? data.results : [];
        totalResults = typeof data?.totalResults === 'number' ? data.totalResults : null;

        if (results.length > 0) {
          break;
        }
      }

      console.log('Spoonacular complexSearch', {
        includeCount: includeIngredients.length,
        allergyCount: allergies.length,
        excludeCount: effectiveExcludeIngredients.length,
        spoonacularIntolerances,
        diet: diet || null,
        retriedWithReducedIncludeIngredients,
        totalResults,
      });

      const fullPantryTokens = originalIngredients.map(normalizeLoose).filter(Boolean);

      const normalized = results.map((recipe) => {
        const allIngs = [
          ...(Array.isArray(recipe.usedIngredients) ? recipe.usedIngredients : []),
          ...(Array.isArray(recipe.missedIngredients) ? recipe.missedIngredients : []),
          ...(Array.isArray(recipe.unusedIngredients) ? recipe.unusedIngredients : []),
        ];
        
        const unique = [];
        const seen = new Set();
        for (const ing of allIngs) {
          if (!ing || !ing.name) continue;
          if (!seen.has(ing.id)) {
            seen.add(ing.id);
            unique.push(ing);
          }
        }
        
        const realUsed = [];
        const realMissed = [];
        
        for (const ing of unique) {
          const ingNorm = normalizeLoose(ing.name);
          let matched = false;
          for (const p of fullPantryTokens) {
            if (ingNorm.includes(p) || p.includes(ingNorm)) {
              matched = true;
              break;
            }
          }
          if (matched) realUsed.push(ing);
          else realMissed.push(ing);
        }

        return {
          id: recipe.id,
          title: recipe.title,
          image: recipe.image,
          imageType: recipe.imageType || 'jpg',
          usedIngredientCount: realUsed.length,
          missedIngredientCount: realMissed.length,
          missedIngredients: realMissed,
          usedIngredients: realUsed,
          unusedIngredients: [],
          likes: recipe.likes ?? 0,
        };
      });

      // Sort recipes locally by how much of the FULL pantry they use!
      normalized.sort((a, b) => {
        if (b.usedIngredientCount !== a.usedIngredientCount) {
          return b.usedIngredientCount - a.usedIngredientCount;
        }
        return a.missedIngredientCount - b.missedIngredientCount;
      });

      sendJson(res, 200, {
        recipes: normalized,
        applied: {
          endpoint: '/recipes/complexSearch',
          diet: diet || null,
          originalIngredients,
          includeIngredients,
          filteredOutIngredients,
          retriedWithReducedIncludeIngredients,
          intolerances: allergies,
          excludeIngredients: effectiveExcludeIngredients,
          totalResults,
          number,
          ignorePantry: true,
          ranking: 1,
          addRecipeInformation: true,
          fillIngredients: true,
          tuning: {
            ...(sort ? { sort } : {}),
            ...(Number.isFinite(maxReadyTime) ? { maxReadyTime } : {}),
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error.';
      const status = typeof error?.status === 'number' ? error.status : 500;
      const isNoKey = error?.code === 'NO_KEY' || message.includes('SPOONACULAR_API_KEY');
      sendJson(res, isNoKey ? 501 : status, { error: message });
    }
    return;
  }

  // Videos proxy (used by frontend)
  if (req.method === 'GET' && req.url?.startsWith('/api/spoonacular/food/videos/search')) {
    try {
      const url = new URL(req.url, `http://${HOST}:${PORT}`);
      const query = url.searchParams.get('query') || '';
      const number = Number(url.searchParams.get('number') || 12);

      const upstream = buildSpoonacularUrl('/food/videos/search', { query, number });
      const data = await fetchSpoonacularJson(upstream);
      sendJson(res, 200, { videos: Array.isArray(data?.videos) ? data.videos : [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error.';
      const status = typeof error?.status === 'number' ? error.status : 500;
      const isNoKey = error?.code === 'NO_KEY' || message.includes('SPOONACULAR_API_KEY');
      sendJson(res, isNoKey ? 501 : status, { error: message });
    }
    return;
  }

  // Recipe details proxy (used by frontend)
  if (req.method === 'GET' && req.url?.startsWith('/api/spoonacular/recipes/')) {
    const match = req.url.match(/^\/api\/spoonacular\/recipes\/(\d+)\/information/);
    if (!match) {
      sendJson(res, 404, { error: 'Not found.' });
      return;
    }

    try {
      const id = Number(match[1]);
      const includeNutrition = 'false';
      const upstream = buildSpoonacularUrl(`/recipes/${id}/information`, { includeNutrition });
      const data = await fetchSpoonacularJson(upstream);
      sendJson(res, 200, data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error.';
      const status = typeof error?.status === 'number' ? error.status : 500;
      const isNoKey = error?.code === 'NO_KEY' || message.includes('SPOONACULAR_API_KEY');
      sendJson(res, isNoKey ? 501 : status, { error: message });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found.' });
});

server.listen(PORT, HOST, () => {
  console.log(`User data API listening on http://${HOST}:${PORT}`);
});
