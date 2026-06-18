import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no esta definida en el archivo .env');
}

function sanitizePets(pets) {
  return pets.map((pet) => ({
    age: pet.age,
    breed: pet.breed,
    careNotes: pet.careNotes,
    insured: Boolean(pet.insured),
    name: pet.name,
    photoUri: pet.photoUri,
    weight: pet.weight,
  }));
}

function validatePets(pets) {
  return pets.some((pet) => {
    const requiredPetFields = [pet.name, pet.photoUri, pet.breed, pet.weight, pet.age];
    return requiredPetFields.some((field) => !field);
  });
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Sesion no autorizada.' });
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesion expirada o invalida.' });
  }
}

function serializeUser(user) {
  return {
    email: user.email,
    experience: user.experience,
    location: user.location,
    name: user.name,
    pets: user.pets,
    phone: user.phone,
    profilePhotoUri: user.profilePhotoUri,
    role: user.role,
  };
}

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      location,
      experience,
      profilePhotoUri,
      pets = [],
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Por favor ingresa todos los datos requeridos.' });
    }

    if (!['user', 'walker', 'caregiver'].includes(role)) {
      return res.status(400).json({ error: 'Tipo de usuario no valido.' });
    }

    if (role === 'user' && pets.length > 0) {
      if (validatePets(pets)) {
        return res.status(400).json({
          error: 'Completa foto, nombre, raza, peso y edad de cada mascota.',
        });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'El correo ya esta registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      email,
      name,
      password: hashedPassword,
      profilePhotoUri,
      role,
    };

    if (role === 'walker' || role === 'caregiver') {
      userData.location = location;
      userData.experience = experience;
    }

    if (role === 'user' && pets.length > 0) {
      userData.pets = sanitizePets(pets);
    }

    const user = new User(userData);
    await user.save();

    return res.status(201).json({ message: 'Cuenta creada con exito. Ya puedes iniciar sesion.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.patch('/me/pets', authenticate, async (req, res) => {
  try {
    const { pets = [] } = req.body;

    const currentUser = await User.findById(req.auth.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (currentUser.role !== 'user') {
      return res.status(403).json({ error: 'Solo los usuarios pueden agregar mascotas.' });
    }

    if (!Array.isArray(pets)) {
      return res.status(400).json({ error: 'La lista de mascotas no es valida.' });
    }

    if (validatePets(pets)) {
      return res.status(400).json({
        error: 'Completa foto, nombre, raza, peso y edad de cada mascota.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { pets: sanitizePets(pets) },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    return res.json({
      message: 'Mascotas actualizadas.',
      user: serializeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.patch('/me/profile-photo', authenticate, async (req, res) => {
  try {
    const { profilePhotoUri } = req.body;

    if (!profilePhotoUri) {
      return res.status(400).json({ error: 'Selecciona una imagen de perfil.' });
    }

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { profilePhotoUri },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    return res.json({
      message: 'Foto de perfil actualizada.',
      user: serializeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.patch('/me/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, location, experience, profilePhotoUri } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }

    const update = {
      experience,
      location,
      name: name.trim(),
      phone,
      profilePhotoUri,
    };

    const user = await User.findByIdAndUpdate(req.auth.userId, update, { new: true });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    return res.json({
      message: 'Perfil actualizado.',
      user: serializeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Por favor ingresa correo y contrasena.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Correo o contrasena incorrectos.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Correo o contrasena incorrectos.' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.status(200).json({
      message: 'Inicio de sesion correcto.',
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
