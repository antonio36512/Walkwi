import { AuditLog } from './models.js';
export function audit(req, data) {
  return AuditLog.create({ admin: req.admin._id, ip: req.ip, ...data });
}
