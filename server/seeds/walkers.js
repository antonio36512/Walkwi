import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const walkers = [
  {
    name: 'Carlos Rodriguez',
    email: 'carlos@walkwi.com',
    password: '123456',
    role: 'walker',
    location: 'Via Argentina',
    latitude: 9.0327,
    longitude: -79.5134,
    experience: '5 años',
    bio: 'Experiencia de 5 años paseando perros de todas las razas. Especializado en perros grandes y activos. Amante de los animales y comprometido con su bienestar.',
    rating: 4.9,
    reviewCount: 127,
    pricePerHour: 15,
    verified: true,
    completedWalks: 342,
    availableDays: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
    availableHours: { start: '08:00', end: '18:00' },
  },
  {
    name: 'Maria Lopez',
    email: 'maria@walkwi.com',
    password: '123456',
    role: 'walker',
    location: 'El Cangrejo',
    latitude: 9.0360,
    longitude: -79.5199,
    experience: '3 años',
    bio: 'Paseadora profesional con 3 años de experiencia. Adoro jugar y socializar perros de todas las razas. Tu mascota será tratada como familia.',
    rating: 4.8,
    reviewCount: 98,
    pricePerHour: 12,
    verified: true,
    completedWalks: 215,
    availableDays: ['lunes', 'miercoles', 'viernes', 'sabado'],
    availableHours: { start: '09:00', end: '17:00' },
  },
  {
    name: 'Juan Garcia',
    email: 'juan@walkwi.com',
    password: '123456',
    role: 'walker',
    location: 'Obarrio',
    latitude: 9.0285,
    longitude: -79.5078,
    experience: '4 años',
    bio: 'Paseador profesional. Ofrezco paseos diarios, adiestramiento básico y cuidado personalizado. Tu mascota estará en buenas manos.',
    rating: 4.7,
    reviewCount: 84,
    pricePerHour: 14,
    verified: true,
    completedWalks: 189,
    availableDays: ['lunes', 'martes', 'jueves', 'viernes', 'sabado'],
    availableHours: { start: '07:00', end: '19:00' },
  },
  {
    name: 'Sofia Martin',
    email: 'sofia@walkwi.com',
    password: '123456',
    role: 'walker',
    location: 'San Francisco',
    latitude: 9.0400,
    longitude: -79.5320,
    experience: '6 años',
    bio: 'Especialista en paseos para mascotas con necesidades especiales. Entrenamiento positivo y mucho amor. Certificada en primeros auxilios veterinarios.',
    rating: 4.9,
    reviewCount: 156,
    pricePerHour: 16,
    verified: true,
    completedWalks: 410,
    availableDays: ['martes', 'jueves', 'viernes', 'sabado', 'domingo'],
    availableHours: { start: '10:00', end: '20:00' },
  },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI;
    const dbName = process.env.MONGO_DB_NAME || 'walkwi';

    await mongoose.connect(mongoUri, { dbName });
    console.log('MongoDB conectado para seed.');

    for (const walker of walkers) {
      const exists = await User.findOne({ email: walker.email });
      if (exists) {
        const { bio, availableDays, availableHours, completedWalks, experience, latitude, location, longitude, rating, reviewCount, pricePerHour } = walker;
        await User.updateOne(
          { email: walker.email },
          { $set: { bio, availableDays, availableHours, completedWalks, experience, latitude, location, longitude, rating, reviewCount, pricePerHour } }
        );
        console.log(`Walker ${walker.email} actualizado con nuevos campos.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(walker.password, 10);
      await User.create({ ...walker, password: hashedPassword });
      console.log(`Walker ${walker.name} creado.`);
    }

    console.log('Seed completado.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
}

seed();
