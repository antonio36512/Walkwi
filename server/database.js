import mongoose from 'mongoose';

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || 'walkwi';

  if (!mongoUri) {
    throw new Error('MONGO_URI no está definida en el archivo .env');
  }

  await mongoose.connect(mongoUri, {
    dbName,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log(`MongoDB conectada a la base de datos: ${dbName}`);
}
