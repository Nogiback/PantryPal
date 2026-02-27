import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

// Lightweight .env loader so this file can run directly with `node`
// (without adding dotenv as an extra dependency).
const loadDotEnv = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const envCandidates = [path.resolve(process.cwd(), '.env'), path.resolve(__dirname, '..', '.env')];

  const envPath = envCandidates.find((candidate) => existsSync(candidate));
  if (!envPath) return;

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

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

loadDotEnv();

const PORT = Number(process.env.PORT || 8787);
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

// Small helper for consistent JSON + CORS responses.
const sendJson = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
};

// Read the full request body with a size guard to prevent oversized uploads.
const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 15 * 1024 * 1024) {
        reject(new Error('Payload too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });

const bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });

const stripCodeFences = (rawText) =>
  rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

const getPexelsImageUrl = async (query) => {
  if (!PEXELS_API_KEY) return '';

  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '1');
  url.searchParams.set('orientation', 'landscape');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) return '';

    const data = await response.json();
    const photos = Array.isArray(data.photos) ? data.photos : [];
    const firstPhoto = photos[0];
    return firstPhoto?.src?.large2x || firstPhoto?.src?.large || firstPhoto?.src?.medium || '';
  } catch {
    return '';
  }
};

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: 'Invalid request.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'POST' && req.url === '/api/scan/aws') {
    try {
      // Expected payload from frontend:
      // { imageBase64: "....", mimeType: "image/jpeg|image/png|image/webp" }
      const raw = await readRequestBody(req);
      const payload = JSON.parse(raw);
      const imageBase64 = typeof payload.imageBase64 === 'string' ? payload.imageBase64 : '';
      const mimeType = typeof payload.mimeType === 'string' ? payload.mimeType : 'image/jpeg';

      if (!imageBase64) {
        sendJson(res, 400, { error: 'imageBase64 is required.' });
        return;
      }

      // Strong prompt to force structured JSON output that frontend can parse reliably.
      const prompt = [
        '# Grocery List Extraction Expert',
        '## Task',
        'Analyze this image (receipt, grocery photo, pantry shelf, or spice rack) and extract a clean, normalized grocery list in JSON format.',
        '## Output Requirements',
        '- Return ONLY valid JSON without markdown, preamble, explanations, or extra keys.',
        '- Follow this schema exactly: {"items":[{"name":"string","quantity":"string"}]}',
        '## Normalization Rules',
        '1) Include only food/grocery items.',
        'Exclude taxes, totals, store information, loyalty program lines, coupons, phone numbers, and non-item text.',
        '2) Clean item names.',
        'Remove store/internal abbreviations and junk tokens (e.g., "ORG", "OP", "PNT", codes).',
        'Example: "APPL GALA ORG 2.99" -> "Organic Gala Apples".',
        '3) Canonicalize names to shopper-friendly form.',
        'Convert abbreviated/coded names to natural language.',
        'Examples:',
        '- "2% MLK 1GAL" -> "2% Milk"',
        '- "BANANAS ORG" -> "Organic Bananas"',
        '- "CHKN BRST BNLS" -> "Boneless Chicken Breast"',
        '4) Extract accurate quantities.',
        'Use the most specific visible amount/count/weight text.',
        'If quantity is unclear, use "unknown".',
        'Include units when available (e.g., "2 lbs", "1 gallon").',
        '5) Merge duplicate items.',
        'Combine identical items by summing/combining quantities when possible.',
        'Example: Two entries of "Milk 1 gallon" should become one entry with quantity "2 gallons".',
        '6) Handle low-confidence items.',
        'Include items with low confidence if they appear grocery-related.',
        'Keep names concise and relevant.',
        'Omit items that are clearly not groceries.',
        'Process the image carefully and return only the structured JSON output.',
      ].join('\n');

      const imageFormat = mimeType.includes('png')
        ? 'png'
        : mimeType.includes('webp')
          ? 'webp'
          : 'jpeg';

      // Bedrock Converse call with multimodal content (text prompt + image bytes).
      const command = new ConverseCommand({
        modelId: BEDROCK_MODEL_ID,
        messages: [
          {
            role: 'user',
            content: [
              { text: prompt },
              {
                image: {
                  format: imageFormat,
                  source: { bytes: Buffer.from(imageBase64, 'base64') },
                },
              },
            ],
          },
        ],
        inferenceConfig: {
          maxTokens: 800,
          temperature: 0.1,
        },
      });

      const bedrockRes = await bedrockClient.send(command);
      const text = bedrockRes.output?.message?.content?.find((block) => 'text' in block)?.text ?? '';
      if (!text) {
        sendJson(res, 502, { error: 'AWS Bedrock returned empty text response.' });
        return;
      }

      // Frontend parses this `text` into item rows.
      sendJson(res, 200, { text });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error.';
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/recipes/aws') {
    try {
      const raw = await readRequestBody(req);
      const payload = JSON.parse(raw);
      const ingredients = Array.isArray(payload.ingredients) ? payload.ingredients : [];
      const cleanedIngredients = ingredients
        .map((item) => ({
          name: typeof item?.name === 'string' ? item.name.trim() : '',
          quantity: typeof item?.quantity === 'string' ? item.quantity.trim() : 'unknown',
        }))
        .filter((item) => item.name.length > 0);

      if (cleanedIngredients.length === 0) {
        sendJson(res, 400, { error: 'ingredients array is required.' });
        return;
      }

      const prompt = [
        'You are a chef assistant. Create EXACTLY 3 recipe suggestions using pantry items.',
        'Return ONLY valid JSON (no markdown, no explanation).',
        'Schema:',
        '{"recipes":[{"title":"string","servings":"string","estimatedTime":"string","ingredients":[{"name":"string","quantity":"string","fromPantry":true}],"instructions":["string"],"finalDish":"string","imageQuery":"string"}]}',
        'Rules:',
        '1) Rank recipes by pantry usage from highest to lowest.',
        '2) Mark each ingredient with fromPantry=true/false.',
        '3) instructions must be clear, ordered, and practical.',
        '4) finalDish should describe what the finished plate looks/tastes like.',
        '5) Keep estimatedTime concise (e.g. "25 mins"), servings concise (e.g. "2").',
        '6) imageQuery must be a short food-photo search phrase for each recipe.',
        `Pantry input: ${JSON.stringify(cleanedIngredients)}`,
      ].join('\n');

      const command = new ConverseCommand({
        modelId: BEDROCK_MODEL_ID,
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }],
          },
        ],
        inferenceConfig: {
          maxTokens: 1800,
          temperature: 0.4,
        },
      });

      const bedrockRes = await bedrockClient.send(command);
      const text = bedrockRes.output?.message?.content?.find((block) => 'text' in block)?.text ?? '';
      if (!text) {
        sendJson(res, 502, { error: 'AWS Bedrock returned empty text response.' });
        return;
      }

      const cleanedText = stripCodeFences(text);
      try {
        const parsed = JSON.parse(cleanedText);
        const recipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];

        const enrichedRecipes = await Promise.all(
          recipes.map(async (recipe) => {
            const title = typeof recipe?.title === 'string' ? recipe.title : '';
            const imageQuery =
              typeof recipe?.imageQuery === 'string' && recipe.imageQuery.trim().length > 0
                ? recipe.imageQuery.trim()
                : `${title} dish`;
            const imageUrl = await getPexelsImageUrl(imageQuery);

            return {
              ...recipe,
              imageUrl,
            };
          }),
        );

        sendJson(res, 200, {
          text: JSON.stringify({
            recipes: enrichedRecipes,
          }),
        });
      } catch {
        sendJson(res, 200, { text });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error.';
      sendJson(res, 500, { error: message });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found.' });
});

server.listen(PORT, () => {
  console.log(`Claude proxy listening on http://localhost:${PORT}`);
});
