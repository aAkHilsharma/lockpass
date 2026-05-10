const required = (name: string): string => {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
};

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
  PORT: parseInt(process.env.PORT ?? "3001", 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",
};
