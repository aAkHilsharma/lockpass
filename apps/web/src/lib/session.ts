const KEYS = {
  accessToken: 'lp_access_token',
  refreshToken: 'lp_refresh_token',
  userId: 'lp_user_id',
  email: 'lp_email',
} as const;

export const session = {
  save(data: { accessToken: string; refreshToken: string; userId: string; email: string }) {
    localStorage.setItem(KEYS.accessToken, data.accessToken);
    localStorage.setItem(KEYS.refreshToken, data.refreshToken);
    localStorage.setItem(KEYS.userId, data.userId);
    localStorage.setItem(KEYS.email, data.email);
  },
  getAccessToken: () => localStorage.getItem(KEYS.accessToken),
  getRefreshToken: () => localStorage.getItem(KEYS.refreshToken),
  getEmail: () => localStorage.getItem(KEYS.email),
  getUserId: () => localStorage.getItem(KEYS.userId),
  isLoggedIn: () => !!localStorage.getItem(KEYS.accessToken),
  clear() {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
