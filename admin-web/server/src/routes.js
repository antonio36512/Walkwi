import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, Report, Booking, AuditLog, Review } from './models.js';
import { requireAuth, requireAdmin, signAdminToken } from './auth.js';
import { audit } from './audit.js';

const router = Router();
const safeUser = '_id name email role verified accountStatus sanction createdAt updatedAt location phone rating reviewCount completedWalks';

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').trim().toLowerCase() });
  if (!user || !await bcrypt.compare(String(password || ''), user.password)) return res.status(401).json({ error: 'Credenciales incorrectas.' });
  res.json({ token: signAdminToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role, accountStatus: user.accountStatus || 'active' } });
});

router.use(requireAuth);
router.get('/auth/me', (req, res) => res.json({ user: req.user }));

router.get('/portal/overview', async (req, res) => {
  try {
  if (!['user', 'walker'].includes(req.user.role)) return res.status(403).json({ error: 'Portal disponible para usuarios y paseadores.' });
  const user = await User.findById(req.user._id).select('-password');
  const participant = req.user.role === 'walker' ? { walker: req.user._id } : { client: req.user._id };
  const [bookings, reports] = await Promise.all([
    Booking.find(participant).populate('client', 'name email profilePhotoUri').populate('walker', 'name email profilePhotoUri rating reviewCount').sort({ startTime: -1 }).limit(100),
    Report.find({ $or: [{ reporter: req.user._id }, { reported: req.user._id }] }).populate('reporter', 'name role').populate('reported', 'name role').sort({ createdAt: -1 }).limit(100),
  ]);
  const now = new Date();
  const activeStatuses = ['pending', 'accepted', 'in_progress'];
  const active = bookings.filter((item) => activeStatuses.includes(item.status));
  const upcoming = active.filter((item) => new Date(item.startTime) >= now).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const history = bookings.filter((item) => ['completed', 'cancelled'].includes(item.status));
  const notifications = [];
  if (user.accountStatus && user.accountStatus !== 'active') notifications.push({ type: 'account', title: `Estado de cuenta: ${user.accountStatus}`, message: user.sanction?.reason || 'Consulta los detalles de tu cuenta.', createdAt: user.updatedAt });
  if (req.user.role === 'walker' && !user.verified) notifications.push({ type: 'verification', title: 'Verificación pendiente', message: 'Tu perfil todavía no ha sido verificado.', createdAt: user.updatedAt });
  reports.filter((item) => item.status !== 'pending').slice(0, 10).forEach((item) => notifications.push({ type: 'report', title: 'Actualización de denuncia', message: `El caso está en estado ${item.status}.`, createdAt: item.updatedAt }));
  res.json({ user, bookings: { active, upcoming, history }, reports, notifications });
  } catch (error) {
    console.error('Error al cargar el portal del usuario:', error);
    res.status(500).json({ error: 'No se pudo cargar la información de tu cuenta. La API continúa disponible.' });
  }
});

router.patch('/portal/profile', async (req, res) => {
  try {
    if (!['user', 'walker'].includes(req.user.role)) return res.status(403).json({ error: 'Esta acción no está disponible para este rol.' });
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = String(req.body.phone || '').trim();
    const pricePerHour = req.user.role === 'walker' ? Number(req.body.pricePerHour) : undefined;
    if (!name || !email) return res.status(400).json({ error: 'El nombre y el correo son obligatorios.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Ingresa un correo válido.' });
    if (req.user.role === 'walker' && (!Number.isFinite(pricePerHour) || pricePerHour <= 0)) return res.status(400).json({ error: 'El precio por hora debe ser mayor que cero.' });
    const duplicate = await User.findOne({ email, _id: { $ne: req.user._id } }).select('_id');
    if (duplicate) return res.status(409).json({ error: 'Ese correo ya pertenece a otra cuenta.' });
    const user = await User.findByIdAndUpdate(req.user._id, { name, email, phone, ...(req.user.role === 'walker' ? { pricePerHour } : {}) }, { new: true, runValidators: true }).select('-password');
    res.json({ user, message: 'Perfil actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    res.status(500).json({ error: 'No se pudo actualizar el perfil.' });
  }
});

router.patch('/portal/pets/:petId', async (req, res) => {
  try {
    if (req.user.role !== 'user') return res.status(403).json({ error: 'Solo los dueños pueden editar mascotas.' });
    const user = await User.findById(req.user._id);
    const pet = user?.pets?.id(req.params.petId);
    if (!pet) return res.status(404).json({ error: 'Mascota no encontrada.' });
    const name = String(req.body.name || '').trim();
    const breed = String(req.body.breed || '').trim();
    const age = String(req.body.age || '').trim();
    const weight = String(req.body.weight || '').trim();
    if (!name || !breed || !age || !weight) return res.status(400).json({ error: 'Nombre, raza, edad y peso son obligatorios.' });
    pet.name = name;
    pet.breed = breed;
    pet.age = age;
    pet.weight = weight;
    pet.insured = Boolean(req.body.insured);
    pet.careNotes = String(req.body.careNotes || '').trim();
    await user.save();
    res.json({ pet, message: 'Mascota actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar mascota:', error);
    res.status(500).json({ error: 'No se pudo actualizar la mascota.' });
  }
});

router.use(requireAdmin);

router.get('/dashboard', async (_req, res) => {
  const now=new Date(), week=new Date(now-7*864e5), previousWeek=new Date(now-14*864e5);
  const [users,owners,walkers,verifiedWalkers,pendingReports,criticalReports,statuses,thisWeek,lastWeek,recentActivity,expiredSuspensions,frequentCancellations,multipleReported] = await Promise.all([
    User.countDocuments({ role:{ $ne:'admin' } }),User.countDocuments({role:'user'}),User.countDocuments({role:'walker'}),User.countDocuments({role:'walker',verified:true}),
    Report.countDocuments({status:'pending'}),Report.countDocuments({priority:'critical',status:{$in:['pending','reviewed']}}),
    User.aggregate([{$match:{role:{$ne:'admin'}}},{$group:{_id:{$ifNull:['$accountStatus','active']},count:{$sum:1}}}]),
    User.countDocuments({role:{$ne:'admin'},createdAt:{$gte:week}}),User.countDocuments({role:{$ne:'admin'},createdAt:{$gte:previousWeek,$lt:week}}),
    AuditLog.find().populate('admin','name email').sort({createdAt:-1}).limit(8),
    User.countDocuments({accountStatus:'suspended','sanction.until':{$lt:now}}),
    Booking.aggregate([{$match:{status:'cancelled'}},{$group:{_id:'$client',count:{$sum:1}}},{$match:{count:{$gte:3}}},{$count:'total'}]),
    Report.aggregate([{$group:{_id:'$reported',count:{$sum:1}}},{$match:{count:{$gte:2}}},{$count:'total'}]),
  ]);
  res.json({users,owners,walkers,verifiedWalkers,pendingVerification:walkers-verifiedWalkers,pendingReports,criticalReports,accountStatuses:Object.fromEntries(statuses.map(x=>[x._id,x.count])),comparison:{thisWeek,lastWeek,change:lastWeek?Math.round((thisWeek-lastWeek)/lastWeek*100):thisWeek?100:0},alerts:{expiredSuspensions,frequentCancellations:frequentCancellations[0]?.total||0,multipleReported:multipleReported[0]?.total||0},recentActivity});
});

router.get('/users', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
  const filter = { role: { $ne: 'admin' } };
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.accountStatus = req.query.status;
  if (req.query.verified === 'true') filter.verified = true;
  if (req.query.verified === 'false') filter.verified = false;
  if (req.query.dateFrom) filter.createdAt = { $gte: new Date(req.query.dateFrom) };
  if (req.query.hasReports === 'true') filter._id = { $in: await Report.distinct('reported') };
  if (req.query.activeBooking === 'true') filter._id = { $in: await Booking.distinct(req.query.role==='walker'?'walker':'client',{status:{$in:['pending','accepted','in_progress']}}) };
  if (req.query.search) filter.$or = ['name', 'email'].map((key) => ({ [key]: { $regex: String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }));
  const [items, total] = await Promise.all([User.find(filter).select(safeUser).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), User.countDocuments(filter)]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id).select(`${safeUser} pets bio experience availableDays availableHours pricePerHour`);
  if (!user || user.role === 'admin') return res.status(404).json({ error: 'Usuario no encontrado.' });
  const [reportsSent,reportsReceived,bookings] = await Promise.all([Report.find({reporter:user._id}).populate('reported','name email').sort({createdAt:-1}),Report.find({reported:user._id}).populate('reporter','name email').sort({createdAt:-1}),Booking.find({$or:[{client:user._id},{walker:user._id}]}).populate('client','name email').populate('walker','name email').sort({startTime:-1})]);
  res.json({user,reportsSent,reportsReceived,bookings});
});

router.patch('/users/:id/status', async (req, res) => {
  const allowed = ['active', 'warned', 'suspended', 'blocked'];
  if (!allowed.includes(req.body.status) || !String(req.body.reason || '').trim()) return res.status(400).json({ error: 'Estado y motivo válidos son obligatorios.' });
  const before = await User.findOne({ _id: req.params.id, role: { $ne: 'admin' } });
  if (!before) return res.status(404).json({ error: 'Usuario no encontrado.' });
  const update = { accountStatus: req.body.status, sanction: req.body.status === 'active' ? {} : { reason: req.body.reason.trim(), until: req.body.until || null, adminId: req.admin._id } };
  const user = await User.findByIdAndUpdate(before._id, update, { new: true }).select(safeUser);
  try { await audit(req, { action: 'user.status_changed', entityType: 'User', entityId: user._id, before: { accountStatus: before.accountStatus }, after: update, reason: req.body.reason }); }
  catch (auditError) { console.error('No se pudo registrar la auditoría del cambio de cuenta:', auditError); }
  res.json({ user });
});

router.patch('/users/:id/verification', async (req, res) => {
  const before = await User.findOne({ _id: req.params.id, role: 'walker' });
  if (!before) return res.status(404).json({ error: 'Paseador no encontrado.' });
  const user = await User.findByIdAndUpdate(before._id, { verified: Boolean(req.body.verified) }, { new: true }).select(safeUser);
  await audit(req, { action: 'walker.verification_changed', entityType: 'User', entityId: user._id, before: { verified: before.verified }, after: { verified: user.verified }, reason: req.body.reason });
  res.json({ user });
});

router.get('/reports', async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.unassigned === 'true') filter.assignedTo = null;
  if (req.query.search) { const ids=await User.find({$or:[{name:{$regex:req.query.search,$options:'i'}},{email:{$regex:req.query.search,$options:'i'}}]}).distinct('_id'); filter.$or=[{reporter:{$in:ids}},{reported:{$in:ids}}]; }
  const items = await Report.find(filter).populate('reporter', 'name email role').populate('reported', 'name email role accountStatus').populate('booking', 'startTime petName status').populate('assignedTo','name email').sort({ createdAt: req.query.order==='oldest'?1:-1 }).limit(100);
  res.json({ items });
});

router.get('/reports/:id', async (req, res) => {
  const report = await Report.findById(req.params.id).populate('reporter', safeUser).populate('reported', safeUser).populate('booking').populate('assignedTo', 'name email');
  if (!report) return res.status(404).json({ error: 'Denuncia no encontrada.' });
  res.json({ report });
});

router.patch('/reports/:id', async (req, res) => {
  const statuses = ['pending', 'reviewed', 'dismissed', 'action_taken'], priorities = ['low', 'medium', 'high', 'critical'];
  const before = await Report.findById(req.params.id);
  if (!before) return res.status(404).json({ error: 'Denuncia no encontrada.' });
  const update = {};
  if (statuses.includes(req.body.status)) update.status = req.body.status;
  if (priorities.includes(req.body.priority)) update.priority = req.body.priority;
  if (req.body.adminNotes !== undefined) update.adminNotes = String(req.body.adminNotes).trim();
  if (req.body.assignToMe) update.assignedTo = req.admin._id;
  const report = await Report.findByIdAndUpdate(before._id, update, { new: true });
  await audit(req, { action: 'report.updated', entityType: 'Report', entityId: report._id, before: { status: before.status, priority: before.priority }, after: update, reason: update.adminNotes });
  res.json({ report });
});

router.get('/reviews',async(_req,res)=>res.json({items:await Review.find().populate('reviewer','name email role').populate('reviewed','name email role rating reviewCount').populate('booking','petName startTime status').sort({createdAt:-1})}));
router.delete('/reviews/:id',async(req,res)=>{const review=await Review.findByIdAndDelete(req.params.id);if(!review)return res.status(404).json({error:'Reseña no encontrada.'});const rows=await Review.aggregate([{$match:{reviewed:review.reviewed}},{$group:{_id:null,rating:{$avg:'$rating'},count:{$sum:1}}}]);await User.findByIdAndUpdate(review.reviewed,{rating:rows[0]?.rating||0,reviewCount:rows[0]?.count||0});try{await audit(req,{action:'review.deleted',entityType:'Review',entityId:review._id,reason:req.body?.reason||'Moderación administrativa'})}catch(e){console.error('Error de auditoría al eliminar reseña:',e)}res.json({message:'Reseña eliminada y calificación recalculada.'})});

router.get('/audit', async (req, res) => { const filter={}; if(req.query.admin)filter.admin=req.query.admin;if(req.query.action)filter.action={$regex:req.query.action,$options:'i'};if(req.query.entityId)filter.entityId=req.query.entityId;if(req.query.dateFrom)filter.createdAt={$gte:new Date(req.query.dateFrom)};res.json({items:await AuditLog.find(filter).populate('admin','name email').sort({createdAt:-1}).limit(200)});});
export default router;
