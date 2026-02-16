import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

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

const sendJson = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
};

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
      const raw = await readRequestBody(req);
      const payload = JSON.parse(raw);
      const imageBase64 = typeof payload.imageBase64 === 'string' ? payload.imageBase64 : '';
      const mimeType = typeof payload.mimeType === 'string' ? payload.mimeType : 'image/jpeg';

      if (!imageBase64) {
        sendJson(res, 400, { error: 'imageBase64 is required.' });
        return;
      }

      const prompt = [
        'Extract grocery items from this image (receipt, grocery photo, pantry shelf, spice rack).',
        'Return ONLY valid JSON (no markdown, no explanation).',
        'Schema:',
        '{"items":[{"name":"string","quantity":"string"}]}',
        'Rules:',
        '1) Include only food/grocery items.',
        '2) Quantity should be visible amount/count/weight; if unknown use "unknown".',
        '3) Normalize names and merge duplicates when possible.',
      ].join('\n');

      const imageFormat = mimeType.includes('png')
        ? 'png'
        : mimeType.includes('webp')
          ? 'webp'
          : 'jpeg';

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

      sendJson(res, 200, { text });
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
