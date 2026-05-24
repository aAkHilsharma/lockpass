const KEYS = {
  accessToken: 'lp_access_token',
  refreshToken: 'lp_refresh_token',
  userId: 'lp_user_id',
  email: 'lp_email',
} as const;

const ls = () => (typeof window !== 'undefined' ? window.localStorage : null);

export const session = {
  save(data: { accessToken: string; refreshToken: string; userId: string; email: string }) {
    ls()?.setItem(KEYS.accessToken, data.accessToken);
    ls()?.setItem(KEYS.refreshToken, data.refreshToken);
    ls()?.setItem(KEYS.userId, data.userId);
    ls()?.setItem(KEYS.email, data.email);
  },
  updateTokens(accessToken: string, refreshToken: string) {
    ls()?.setItem(KEYS.accessToken, accessToken);
    ls()?.setItem(KEYS.refreshToken, refreshToken);
  },
  getAccessToken: () => ls()?.getItem(KEYS.accessToken) ?? null,
  getRefreshToken: () => ls()?.getItem(KEYS.refreshToken) ?? null,
  getEmail: () => ls()?.getItem(KEYS.email) ?? null,
  getUserId: () => ls()?.getItem(KEYS.userId) ?? null,
  isLoggedIn: () => !!ls()?.getItem(KEYS.accessToken),
  clear() {
    Object.values(KEYS).forEach((k) => ls()?.removeItem(k));
  },
};
