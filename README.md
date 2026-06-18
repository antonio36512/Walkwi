# Walkwi

Aplicación móvil migrada a React Native con Expo.

## Requisitos

- Node.js
- npm
- Expo CLI mediante `npx expo`
- MongoDB y variables de entorno del servidor configuradas

## Ejecutar la app

Instala dependencias:

```powershell
npm install
```

Inicia Expo:

```powershell
npm start
```

También puedes abrir plataformas específicas:

```powershell
npm run android
npm run ios
npm run web
```

## Backend

El backend Express se mantiene en `server/` y escucha por defecto en `http://localhost:5000`.

```powershell
npm run dev:server
```

La app móvil lee la API desde `EXPO_PUBLIC_API_URL`. En un dispositivo físico, usa la IP LAN de tu equipo en lugar de `localhost`:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.50:5000"
npm start
```

En Android Emulator normalmente puedes usar:

```powershell
$env:EXPO_PUBLIC_API_URL="http://10.0.2.2:5000"
npm start
```
