export const ENV = {
  get appId() { return process.env.APP_ID || "iconnect-blr"; },
  get cookieSecret() { return process.env.JWT_SECRET || "iconnect-blr-dev-session-secret-key-2026"; },
  get databaseUrl() { return process.env.DATABASE_URL ?? ""; },
  get oAuthServerUrl() { return ""; },
  get ownerOpenId() { return process.env.OWNER_OPEN_ID ?? ""; },
  get isProduction() { return process.env.NODE_ENV === "production"; },
  get forgeApiUrl() { return process.env.API_URL ?? ""; },
  get forgeApiKey() { return process.env.GEMINI_API_KEY || process.env.API_KEY || ""; },
};
