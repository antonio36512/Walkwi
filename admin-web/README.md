# Walkwi Admin Web

Panel administrativo independiente de la aplicación móvil.

## Estructura

- `client/`: interfaz React.
- `server/`: API administrativa Express conectada a MongoDB.

## Configuración

El servidor carga automáticamente el `.env` principal de Walkwi, incluyendo
`MONGO_URI`, `MONGO_DB_NAME` y `JWT_SECRET`. No es necesario duplicarlos.

Opcionalmente, copia `server/.env.example` como `server/.env` si quieres
sobrescribir el puerto, la URL del cliente o usar un secreto exclusivo para el
panel. Para producción se recomienda definir `ADMIN_JWT_SECRET`.

Ejecuta `npm run install:all` y después `npm run dev`.

## Ejecución recomendada en un solo proceso

Para evitar que el frontend permanezca abierto cuando la API se detenga, usa:

```powershell
npm run portal
```

Este comando compila React y Express sirve tanto la página como la API desde
`http://localhost:5100`. Es la modalidad recomendada para uso normal y despliegue.

Para crear el primer administrador: `npm --prefix server run create-admin -- --email admin@walkwi.com --name Administrador`.

La API administrativa usa por defecto el puerto 5100 y el cliente el 5173.
