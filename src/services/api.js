import Constants from 'expo-constants';

function getDevelopmentApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(':')[0];

  return host ? `http://${host}:5000` : 'http://localhost:5000';
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || getDevelopmentApiUrl();

export async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new Error(`No se pudo conectar con la API en ${API_URL}. Verifica que el servidor esté encendido.`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo completar la solicitud.');
  }

  return data;
}
