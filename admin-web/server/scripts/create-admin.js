import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config, validateConfig } from '../src/config.js';
import { User } from '../src/models.js';

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : ''; };
validateConfig();
const rl = readline.createInterface({ input: stdin, output: stdout });
const email = (arg('email') || await rl.question('Correo: ')).trim().toLowerCase();
const name = (arg('name') || await rl.question('Nombre: ')).trim();
const password = await rl.question('Contraseña temporal: ');
rl.close();
if (!email || !name || password.length < 10) throw new Error('Nombre, correo y una contraseña de al menos 10 caracteres son obligatorios.');
await mongoose.connect(config.mongoUri, { dbName: config.dbName });
const existing = await User.findOne({ email });
if (existing) { existing.role = 'admin'; existing.password = await bcrypt.hash(password, 12); existing.accountStatus = 'active'; await existing.save(); }
else await User.create({ email, name, password: await bcrypt.hash(password, 12), role: 'admin', accountStatus: 'active' });
console.log('Administrador creado o actualizado.');
await mongoose.disconnect();
