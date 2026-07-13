import Constants from 'expo-constants';
import { getStoredToken, saveAccountRestriction } from '../storage/session';

let sessionInvalidHandler = null;
export function setSessionInvalidHandler(handler) { sessionInvalidHandler = handler; }

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

  const data = await response.json();

  if (!response.ok) {
    if (['ACCOUNT_SUSPENDED', 'ACCOUNT_BLOCKED'].includes(data.code)) {
      await saveAccountRestriction(data);
      sessionInvalidHandler?.(data);
    }
    const detail = `${data.error || 'No se pudo completar la solicitud.'}${data.reason ? ` Motivo: ${data.reason}.` : ''}${data.until ? ` Hasta: ${new Date(data.until).toLocaleDateString()}.` : ''}`;
    const error = new Error(detail);
    error.code = data.code;
    error.reason = data.reason;
    error.until = data.until;
    throw error;
  }

  return data;
}
