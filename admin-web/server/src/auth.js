import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { User } from './models.js';

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sesión administrativa requerida.' });
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.userId).select('_id name email role accountStatus');
    if (!user) return res.status(403).json({ error: 'Acceso denegado.' });
    req.user = user;
    req.admin = user.role === 'admin' ? user : null;
    next();
  } catch { return res.status(401).json({ error: 'Sesión vencida o inválida.' }); }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Se requieren permisos de administrador.' });
  req.admin = req.user;
  next();
}

export const signAdminToken = (user) => jwt.sign({ userId: user._id, role: user.role }, config.jwtSecret, { expiresIn: `${config.tokenHours}h` });
