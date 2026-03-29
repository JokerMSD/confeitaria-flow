import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { getPool } from "../db/client";
import { getSessionSecret } from "../config";

const PgSession = connectPgSimple(session);

export function createSessionMiddleware() {
  const cookieSecure = process.env.SESSION_COOKIE_SECURE === "true";

  return session({
    store: new PgSession({
      pool: getPool(),
      createTableIfMissing: true,
    }),
    name: "confeitaria.sid",
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    proxy: cookieSecure,
    cookie: {
      httpOnly: true,
      sameSite: cookieSecure ? "none" : "lax",
      secure: cookieSecure,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  });
}
