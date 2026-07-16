import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { getStoredToken, clearSession } from '../storage/session';

function getDevelopmentApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(':')[0];

  return host ? `http://${host}:5000` : 'http://localhost:5000';
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || getDevelopmentApiUrl();

const AUTH_ERROR_CODES = ['ACCOUNT_BLOCKED', 'ACCOUNT_SUSPENDED', 'INVALID_SESSION', 'UNAUTHORIZED', 'USER_NOT_FOUND'];

let onAuthErrorCallback = null;

export function setOnAuthErrorCallback(callback) {
  onAuthErrorCallback = callback;
}

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
    if (AUTH_ERROR_CODES.includes(data.code)) {
      await clearSession();
      if (onAuthErrorCallback) onAuthErrorCallback();
      const title = data.code === 'ACCOUNT_BLOCKED' ? 'Cuenta bloqueada'
        : data.code === 'ACCOUNT_SUSPENDED' ? 'Cuenta suspendida'
        : 'Sesión expirada';
      Alert.alert(title, data.error || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      throw new Error(data.code);
    }
    throw new Error(data.error || 'No se pudo completar la solicitud.');
  }

  return data;
}
