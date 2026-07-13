import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const EMAIL_FROM = process.env.EMAIL_FROM;
const GOOGLE_SIGNIN_CLIENT_ID = process.env.GOOGLE_SIGNIN_CLIENT_ID;
const GOOGLE_SIGNIN_REDIRECT_URI = process.env.GOOGLE_SIGNIN_REDIRECT_URI;

async function sendResetEmail(to, token) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !EMAIL_FROM) {
    throw new Error('Credenciales de correo no configuradas en .env');
  }

  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground',
  );
  oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  const accessTokenObj = await oAuth2Client.getAccessToken();
  const accessToken = accessTokenObj?.token || accessTokenObj;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: EMAIL_FROM,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
      accessToken,
    },
  });

  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject: 'Walkwi - Recuperación de contraseña',
    text: `Tu código de recuperación es: ${token}. Este código expira en 1 hora.`,
    html: `<p>Tu código de recuperación es: <b>${token}</b></p><p>Este código expira en 1 hora.</p>`,
  };

  const result = await transporter.sendMail(mailOptions);
  return result;
}

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
    availableDays: user.availableDays,
    availableHours: user.availableHours,
    bio: user.bio,
    completedWalks: user.completedWalks,
    email: user.email,
    experience: user.experience,
    latitude: user.latitude,
    location: user.location,
    longitude: user.longitude,
    name: user.name,
    pets: user.pets,
    phone: user.phone,
    pricePerHour: user.pricePerHour,
    profilePhotoUri: user.profilePhotoUri,
    rating: user.rating,
    reviewCount: user.reviewCount,
    role: user.role,
    verified: user.verified,
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
      pricePerHour,
      pets = [],
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Por favor ingresa todos los datos requeridos.' });
    }

    if (!['user', 'walker'].includes(role)) {
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

    if (role === 'walker') {
      userData.location = location;
      userData.experience = experience;
      userData.pricePerHour = Number(pricePerHour) || 0;
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
    const { name, phone, location, latitude, longitude, experience, profilePhotoUri, pricePerHour } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }

    const update = {
      experience,
      latitude: latitude != null ? Number(latitude) : undefined,
      location,
      longitude: longitude != null ? Number(longitude) : undefined,
      name: name.trim(),
      phone,
      pricePerHour: Number(pricePerHour) || undefined,
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

router.get('/google', (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_SIGNIN_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_SIGNIN_REDIRECT_URI,
  );

  const expoRedirect = req.query.expo_redirect || '';
  const state = Buffer.from(JSON.stringify({ expoRedirect })).toString('base64');

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'consent',
    state,
  });

  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send('Código de autorización no proporcionado.');
    }

    let expoRedirect = 'walkwi://auth';
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      if (stateData.expoRedirect) {
        expoRedirect = stateData.expoRedirect;
      }
    } catch {}

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_SIGNIN_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_SIGNIN_REDIRECT_URI,
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_SIGNIN_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        name,
        password: null,
        authProvider: 'google',
        profilePhotoUri: picture || '',
        role: 'user',
      });
      await user.save();
    }

    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const userData = encodeURIComponent(JSON.stringify(serializeUser(user)));
    const deepLink = `${expoRedirect}/--/auth?token=${jwtToken}&user=${userData}`;

    return res.send(`<!DOCTYPE html>
<html>
<head><title>Walkwi</title></head>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;background:#eff3ee">
<div style="text-align:center">
<h2>Iniciando sesion...</h2>
<p>Si no se redirige automaticamente, toca el boton.</p>
<a href="${deepLink}" style="display:inline-block;padding:12px 24px;background:#4a8c6f;color:#fff;border-radius:20px;text-decoration:none;font-weight:bold">Abrir Walkwi</a>
</div>
<script>window.location.href="${deepLink}";</script>
</body>
</html>`);
  } catch (error) {
    console.error('Google callback error:', error);
    return res.send(`<!DOCTYPE html>
<html><head><title>Walkwi</title></head>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif">
<h2>Error al iniciar sesion con Google.</h2>
<a href="walkwi://auth?error=google_auth_failed">Volver a Walkwi</a>
</body></html>`);
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Por favor ingresa tu correo.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const resetToken = String(Math.floor(100000 + Math.random() * 900000));
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    try {
      const mailResult = await sendResetEmail(user.email, resetToken);
      console.log('Reset email sent:', mailResult?.accepted || mailResult?.response);
    } catch (mailError) {
      console.error('Error sending reset email:', mailError);
      return res.status(500).json({ error: 'No se pudo enviar el correo de recuperación.' });
    }

    return res.json({
      message: 'Código de recuperación enviado por correo. Revisa tu bandeja de entrada.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Completa correo, token y nueva contraseña.' });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      passwordResetToken: token.trim(),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.json({ message: 'Contraseña actualizada con éxito. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
