import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ code: 'UNAUTHORIZED', error: 'Sesion no autorizada.' });
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET no configurado.');
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ code: 'USER_NOT_FOUND', error: 'Usuario no encontrado.' });
    if (user.accountStatus === 'suspended' && user.sanction?.until && user.sanction.until <= new Date()) {
      user.accountStatus = 'active'; user.sanction = {}; await user.save();
    }
    if (user.accountStatus === 'blocked') return res.status(403).json({ code: 'ACCOUNT_BLOCKED', error: 'Tu cuenta esta bloqueada.', reason: user.sanction?.reason });
    if (user.accountStatus === 'suspended') return res.status(403).json({ code: 'ACCOUNT_SUSPENDED', error: 'Tu cuenta esta suspendida.', reason: user.sanction?.reason, until: user.sanction?.until });
    req.auth = payload; req.currentUser = user; next();
  } catch {
    return res.status(401).json({ code: 'INVALID_SESSION', error: 'Sesion expirada o invalida.' });
  }
}
