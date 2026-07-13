import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'walkwi_token';
const USER_KEY = 'walkwi_user';
const RESTRICTION_KEY = 'walkwi_account_restriction';

export async function saveSession(token, user) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function getStoredToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser() {
  const storedUser = await AsyncStorage.getItem(USER_KEY);
  return storedUser ? JSON.parse(storedUser) : null;
}

export async function saveStoredUser(user) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, RESTRICTION_KEY]);
}

export async function saveAccountRestriction(restriction) {
  await AsyncStorage.setItem(RESTRICTION_KEY, JSON.stringify(restriction));
}

export async function getAccountRestriction() {
  const value = await AsyncStorage.getItem(RESTRICTION_KEY);
  return value ? JSON.parse(value) : null;
}

export async function clearAccountRestriction() {
  await AsyncStorage.removeItem(RESTRICTION_KEY);
}
