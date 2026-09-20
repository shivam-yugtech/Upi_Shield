const DEFAULT_API_BASE_URL = 'https://upi-shield-7mcc.onrender.com';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/$/, '');
