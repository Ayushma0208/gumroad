process.env.NODE_ENV = "test";
process.env.PORT = "4000";
process.env.DATABASE_URL = "postgresql://lumen:lumen@localhost:5432/lumen";
process.env.JWT_SECRET = "test-jwt-secret-that-is-at-least-32ch";
process.env.JWT_EXPIRES_IN = "1d";
process.env.CLIENT_URL = "http://localhost:3000";
process.env.COOKIE_NAME = "lumen_session";
