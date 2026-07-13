import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectEnv = path.resolve(currentDirectory, '../../../.env');
const adminEnv = path.resolve(currentDirectory, '../.env');

// Reutiliza la configuración principal de Walkwi. Un .env administrativo local,
// si existe, solo sirve para sobrescribir valores específicos del panel.
dotenv.config({ path: projectEnv });
dotenv.config({ path: adminEnv, override: true });

export const config = {
  port: Number(process.env.ADMIN_PORT || 5100),
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.MONGO_DB_NAME || 'walkwi',
  jwtSecret: process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET,
  clientUrl: process.env.ADMIN_CLIENT_URL || 'http://localhost:5173',
  tokenHours: Number(process.env.ADMIN_TOKEN_HOURS || 8),
};

export function validateConfig() {
  for (const [key, value] of Object.entries({ MONGO_URI: config.mongoUri, 'ADMIN_JWT_SECRET o JWT_SECRET': config.jwtSecret })) {
    if (!value) throw new Error(`Falta la variable ${key}.`);
  }
}
