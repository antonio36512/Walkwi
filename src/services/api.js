import Constants from 'expo-constants';
import { getStoredToken } from '../storage/session';

function getDevelopmentApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(':')[0];

  return host ? `http://${host}:5000` : 'http://localhost:5000';
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || getDevelopmentApiUrl();

export async function apiRequest(path, options = {}) {
  let response;

  const token = await getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(`No se pudo conectar con la API en ${API_URL}. Verifica que el servidor esté encendido.`);
  }

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { error: text || 'Error inesperado del servidor.' };
  }

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo completar la solicitud.');
  }

  return data;
}
