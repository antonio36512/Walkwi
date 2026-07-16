const baseUrl = import.meta.env.VITE_ADMIN_API_URL || (import.meta.env.DEV ? 'http://localhost:5100' : '');
let token = sessionStorage.getItem('walkwi_admin_token');
export const session = {
  get token() { return token; },
  set(value) { token = value; value ? sessionStorage.setItem('walkwi_admin_token', value) : sessionStorage.removeItem('walkwi_admin_token'); },
};
export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  } catch {
    throw new Error('No se pudo conectar con el servidor de Walkwi. Verifica que la API administrativa esté encendida en el puerto 5100.');
  }
  const responseText = await response.text();
  let data = {};
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = { error: responseText || 'El servidor devolvió una respuesta no reconocida.' };
  }
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación.');
  return data;
}
