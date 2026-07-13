import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, validateConfig } from './config.js';
import routes from './routes.js';

validateConfig();
await mongoose.connect(config.mongoUri, { dbName: config.dbName });
const app = express();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(currentDirectory, '../../client/dist');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.clientUrl }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/admin/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({
    error: 'Se realizaron demasiados intentos de acceso. Espera unos minutos antes de intentarlo nuevamente.',
  }),
}));
app.use('/api/admin', routes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'walkwi-admin-api' }));
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  return res.sendFile(path.join(clientDist, 'index.html'));
});
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Error interno del servidor.' }); });
app.listen(config.port, () => console.log(`Portal Walkwi: http://localhost:${config.port}`));
