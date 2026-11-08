export const normalizeEmail = (raw: string) => {
  const email = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};

export const hashPassword = (password: string) => {
  let hash = 0x811c9dc5;
  for (const char of password) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0;
  return hash.toString(16);
};
