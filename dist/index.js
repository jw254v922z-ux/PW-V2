// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// drizzle/schema.ts
import { pgTable, serial, varchar, timestamp, integer, text } from "drizzle-orm/pg-core";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) - optional, for backward compatibility */
  openId: varchar("openId", { length: 64 }).unique(),
  /** Custom auth email - required for non-OAuth users */
  email: varchar("email", { length: 320 }).unique().notNull(),
  /** Hashed password for custom auth - optional if using OAuth */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** Email verification status */
  emailVerified: integer("emailVerified").default(0).notNull(),
  name: varchar("name", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("custom").notNull(),
  role: varchar("role", { length: 50 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow()
});
var solarModels = pgTable("solar_models", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1e3 }),
  mw: integer("mw").notNull(),
  capexPerMW: integer("capexPerMW").notNull(),
  privateWireCost: integer("privateWireCost").notNull(),
  gridConnectionCost: integer("gridConnectionCost").default(0).notNull(),
  developmentPremiumPerMW: integer("developmentPremiumPerMW").notNull(),
  opexPerMW: integer("opexPerMW").notNull(),
  opexEscalation: varchar("opexEscalation", { length: 20 }).notNull(),
  generationPerMW: varchar("generationPerMW", { length: 20 }).notNull(),
  degradationRate: varchar("degradationRate", { length: 20 }).notNull(),
  projectLife: integer("projectLife").notNull(),
  discountRate: varchar("discountRate", { length: 20 }).notNull(),
  powerPrice: integer("powerPrice").notNull(),
  percentConsumptionPPA: integer("percentConsumptionPPA").default(100).notNull(),
  percentConsumptionExport: integer("percentConsumptionExport").default(0).notNull(),
  exportPrice: integer("exportPrice").default(50).notNull(),
  offsetableEnergyCost: integer("offsetableEnergyCost").default(120).notNull(),
  lcoe: varchar("lcoe", { length: 20 }),
  irr: varchar("irr", { length: 20 }),
  paybackPeriod: varchar("paybackPeriod", { length: 20 }),
  totalNpv: varchar("totalNpv", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow()
});
var gridConnectionCosts = pgTable("grid_connection_costs", {
  id: serial("id").primaryKey(),
  solarModelId: integer("solarModelId").notNull(),
  // Trenching costs
  agriculturalTrenchingMin: integer("agriculturalTrenchingMin").default(6e5).notNull(),
  agriculturalTrenchingMax: integer("agriculturalTrenchingMax").default(105e4).notNull(),
  roadTrenchingMin: integer("roadTrenchingMin").default(12e5).notNull(),
  roadTrenchingMax: integer("roadTrenchingMax").default(24e5).notNull(),
  // Major crossings
  majorRoadCrossingsMin: integer("majorRoadCrossingsMin").default(3e5).notNull(),
  majorRoadCrossingsMax: integer("majorRoadCrossingsMax").default(6e5).notNull(),
  // Joint bays and terminations
  jointBaysMin: integer("jointBaysMin").default(12e4).notNull(),
  jointBaysMax: integer("jointBaysMax").default(24e4).notNull(),
  // Transformers
  transformersMin: integer("transformersMin").default(5e5).notNull(),
  transformersMax: integer("transformersMax").default(8e5).notNull(),
  // Land rights - compensation
  landRightsCompensationMin: integer("landRightsCompensationMin").default(2e4).notNull(),
  landRightsCompensationMax: integer("landRightsCompensationMax").default(6e4).notNull(),
  // Land rights - legal fees
  landRightsLegalMin: integer("landRightsLegalMin").default(5e4).notNull(),
  landRightsLegalMax: integer("landRightsLegalMax").default(9e4).notNull(),
  // Planning
  planningFeesMin: integer("planningFeesMin").default(600).notNull(),
  planningFeesMax: integer("planningFeesMax").default(1200).notNull(),
  planningConsentsMin: integer("planningConsentsMin").default(15e3).notNull(),
  planningConsentsMax: integer("planningConsentsMax").default(4e4).notNull(),
  // Calculated totals
  constructionMin: integer("constructionMin").default(32e5).notNull(),
  constructionMax: integer("constructionMax").default(42e5).notNull(),
  softCostsMin: integer("softCostsMin").default(85e3).notNull(),
  softCostsMax: integer("softCostsMax").default(19e4).notNull(),
  projectMin: integer("projectMin").default(33e5).notNull(),
  projectMax: integer("projectMax").default(44e5).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow()
});
var emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow()
});
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow()
});
var domainWhitelist = pgTable("domain_whitelist", {
  id: serial("id").primaryKey(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow()
});
var projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1e3 }),
  /** Full calculator inputs as JSON */
  inputs: text("inputs").notNull(),
  /** Full calculator results as JSON */
  results: text("results").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow()
});
var projectDrawings = pgTable("project_drawings", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  // 'map', 'sketch', etc.
  url: varchar("url", { length: 1024 }).notNull(),
  // S3 URL
  createdAt: timestamp("createdAt").defaultNow()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const defaultEmail = user.email || `oauth-${user.openId}@internal.local`;
    const values = {
      openId: user.openId,
      email: defaultEmail,
      name: user.name ?? null,
      loginMethod: user.loginMethod || "oauth",
      lastSignedIn: user.lastSignedIn || /* @__PURE__ */ new Date()
    };
    if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: {
        name: values.name,
        email: values.email,
        loginMethod: values.loginMethod,
        lastSignedIn: values.lastSignedIn,
        role: values.role
      }
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getSolarModelsByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(solarModels).where(eq(solarModels.userId, userId)).orderBy(solarModels.updatedAt);
}
async function getSolarModelById(id, userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(solarModels).where(and(eq(solarModels.id, id), eq(solarModels.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createSolarModel(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(solarModels).values(data);
}
async function updateSolarModel(id, userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(solarModels).set(data).where(and(eq(solarModels.id, id), eq(solarModels.userId, userId)));
}
async function deleteSolarModel(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(solarModels).where(and(eq(solarModels.id, id), eq(solarModels.userId, userId)));
}
async function getGridConnectionCost(solarModelId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(gridConnectionCosts).where(eq(gridConnectionCosts.solarModelId, solarModelId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createGridConnectionCost(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(gridConnectionCosts).values(data);
}
async function updateGridConnectionCost(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(gridConnectionCosts).set(data).where(eq(gridConnectionCosts.id, id));
}
async function deleteGridConnectionCost(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(gridConnectionCosts).where(eq(gridConnectionCosts.id, id));
}

// server/_core/cookies.ts
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret2 = ENV.cookieSecret;
    return new TextEncoder().encode(secret2);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const authHeader = req.headers.authorization;
    let sessionToken = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      sessionToken = authHeader.substring(7);
    }
    if (!sessionToken) {
      const cookies = this.parseCookies(req.headers.cookie);
      sessionToken = cookies.get(COOKIE_NAME);
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || void 0,
          email: userInfo.email || `oauth-${userInfo.openId}@internal.local`,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? "oauth",
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      email: user.email || `oauth-${user.openId}@internal.local`,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name ?? null,
        email: userInfo.email ?? `oauth-${userInfo.openId}@internal.local`,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? "oauth",
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z4 } from "zod";

// server/auth/router.ts
import { z as z2 } from "zod";

// server/auth/db.ts
import { eq as eq2 } from "drizzle-orm";
async function findUserByEmail(email) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq2(users.email, email.toLowerCase()));
  return result[0] || null;
}
async function createUser(email, passwordHash, name) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash,
    name,
    loginMethod: "custom",
    emailVerified: 0
  });
  return result;
}
async function markEmailAsVerified(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ emailVerified: 1 }).where(eq2(users.id, userId));
}
async function updateUserPassword(userId, passwordHash) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash }).where(eq2(users.id, userId));
}
async function findEmailVerificationToken(token) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(emailVerificationTokens).where(eq2(emailVerificationTokens.token, token));
  return result[0] || null;
}
async function deleteEmailVerificationToken(token) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(emailVerificationTokens).where(eq2(emailVerificationTokens.token, token));
}
async function createPasswordResetToken(userId, token, expiresAt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt
  });
}
async function findPasswordResetToken(token) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(passwordResetTokens).where(eq2(passwordResetTokens.token, token));
  return result[0] || null;
}
async function deletePasswordResetToken(token) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(passwordResetTokens).where(eq2(passwordResetTokens.token, token));
}
async function isDomainWhitelisted(domain) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(domainWhitelist).where(eq2(domainWhitelist.domain, domain.toLowerCase()));
  return result.length > 0;
}

// server/auth/utils.ts
import bcrypt from "bcrypt";
import { SignJWT as SignJWT2, jwtVerify as jwtVerify2 } from "jose";
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
var secret = new TextEncoder().encode(JWT_SECRET);
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
async function createSessionToken(userId, openId, name) {
  const payload = {
    openId: openId || `local-user-${userId}`,
    appId: process.env.VITE_APP_ID || "local-app",
    name: name || `User ${userId}`
  };
  const token = await new SignJWT2(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(secret);
  return token;
}
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function isValidPassword(password) {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  return true;
}
function getEmailDomain(email) {
  return email.split("@")[1].toLowerCase();
}

// server/auth/router.ts
var customAuthRouter = router({
  signup: publicProcedure.input(
    z2.object({
      email: z2.string().email(),
      password: z2.string(),
      confirmPassword: z2.string(),
      name: z2.string().optional()
    })
  ).mutation(async ({ input }) => {
    const { email, password, confirmPassword, name } = input;
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }
    if (!isValidPassword(password)) {
      throw new Error("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
    }
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error("Email already registered");
    }
    const domain = getEmailDomain(email);
    const isWhitelisted = await isDomainWhitelisted(domain);
    if (!isWhitelisted) {
      throw new Error(`Email domain @${domain} is not allowed to sign up`);
    }
    const passwordHash = await hashPassword(password);
    const result = await createUser(email, passwordHash, name || void 0);
    const userId = result.insertId || result[0]?.id || 1;
    await markEmailAsVerified(userId);
    return {
      success: true,
      message: "Account created successfully. You can now log in."
    };
  }),
  verifyEmail: publicProcedure.input(z2.object({ token: z2.string() })).mutation(async ({ input }) => {
    const { token } = input;
    const tokenRecord = await findEmailVerificationToken(token);
    if (!tokenRecord) {
      throw new Error("Email verification token not found or expired");
    }
    if (/* @__PURE__ */ new Date() > tokenRecord.expiresAt) {
      await deleteEmailVerificationToken(token);
      throw new Error("Email verification token has expired");
    }
    await markEmailAsVerified(tokenRecord.userId);
    await deleteEmailVerificationToken(token);
    return {
      success: true,
      message: "Email verified successfully. You can now log in."
    };
  }),
  login: publicProcedure.input(
    z2.object({
      email: z2.string().email(),
      password: z2.string()
    })
  ).mutation(async ({ input, ctx }) => {
    const { email, password } = input;
    console.log("[Login] Attempting login for email:", email);
    const user = await findUserByEmail(email);
    console.log("[Login] User found:", !!user, user ? { id: user.id, email: user.email, hasPasswordHash: !!user.passwordHash } : null);
    if (!user) {
      throw new Error("Invalid email or password");
    }
    if (!user.passwordHash) {
      throw new Error("Invalid email or password");
    }
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    console.log("[Login] Password valid:", isPasswordValid);
    if (!isPasswordValid) {
      console.log("[Login] Password mismatch for user:", user.email);
      throw new Error("Invalid email or password");
    }
    const sessionToken = await createSessionToken(user.id, user.openId || `local-user-${user.id}`, user.name || user.email || `User ${user.id}`);
    const maxAge = 30 * 24 * 60 * 60;
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    console.log("[Login] Setting session cookie:", COOKIE_NAME);
    ctx.res.setHeader("Set-Cookie", `${COOKIE_NAME}=${sessionToken}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`);
    console.log("[Login] Session cookie set successfully");
    return {
      success: true,
      message: "Login successful",
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }),
  requestPasswordReset: publicProcedure.input(z2.object({ email: z2.string().email() })).mutation(async ({ input }) => {
    const { email } = input;
    const user = await findUserByEmail(email);
    if (!user) {
      return {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent."
      };
    }
    const resetToken = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
    await createPasswordResetToken(user.id, resetToken, expiresAt);
    return {
      success: true,
      message: "Password reset link has been sent to your email.",
      resetToken
    };
  }),
  resetPassword: publicProcedure.input(
    z2.object({
      token: z2.string(),
      password: z2.string(),
      confirmPassword: z2.string()
    })
  ).mutation(async ({ input }) => {
    const { token, password, confirmPassword } = input;
    if (!isValidPassword(password)) {
      throw new Error("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
    }
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }
    const tokenRecord = await findPasswordResetToken(token);
    if (!tokenRecord) {
      throw new Error("Password reset token not found or expired");
    }
    if (/* @__PURE__ */ new Date() > tokenRecord.expiresAt) {
      await deletePasswordResetToken(token);
      throw new Error("Password reset token has expired");
    }
    const passwordHash = await hashPassword(password);
    await updateUserPassword(tokenRecord.userId, passwordHash);
    await deletePasswordResetToken(token);
    return {
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password."
    };
  }),
  changePassword: publicProcedure.input(
    z2.object({
      currentPassword: z2.string(),
      newPassword: z2.string()
    })
  ).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }
    const user = await findUserByEmail(ctx.user?.email || "");
    if (!ctx.user?.email) {
      throw new Error("User email not found");
    }
    if (!user || !user.passwordHash) {
      throw new Error("User not found");
    }
    const isPasswordValid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }
    if (!isValidPassword(input.newPassword)) {
      throw new Error("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
    }
    const newPasswordHash = await hashPassword(input.newPassword);
    await updateUserPassword(user.id, newPasswordHash);
    return {
      success: true,
      message: "Password changed successfully"
    };
  }),
  changeEmail: publicProcedure.input(z2.object({ newEmail: z2.string().email() })).mutation(async ({ input, ctx }) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }
    if (!isValidEmail(input.newEmail)) {
      throw new Error("Invalid email format");
    }
    const existingUser = await findUserByEmail(input.newEmail);
    if (existingUser) {
      throw new Error("Email already in use");
    }
    return {
      success: true,
      message: "Email change feature coming soon"
    };
  }),
  deleteAccount: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }
    return {
      success: true,
      message: "Account deletion feature coming soon"
    };
  })
});

// server/projects/router.ts
import { z as z3 } from "zod";

// server/projects/db.ts
import { eq as eq3, and as and2 } from "drizzle-orm";
async function createProject(userId, name, description, inputs, results) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.insert(projects).values({
    userId,
    name,
    description,
    inputs: JSON.stringify(inputs),
    results: JSON.stringify(results),
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  });
  return result;
}
async function getProjectsByUserId(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(projects).where(eq3(projects.userId, userId));
}
async function getProjectById(projectId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const result = await db.select().from(projects).where(and2(eq3(projects.id, projectId), eq3(projects.userId, userId)));
  return result[0] || null;
}
async function updateProject(projectId, userId, name, description, inputs, results) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.update(projects).set({
    name,
    description,
    inputs: JSON.stringify(inputs),
    results: JSON.stringify(results),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(and2(eq3(projects.id, projectId), eq3(projects.userId, userId)));
}
async function deleteProject(projectId, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  await db.delete(projectDrawings).where(eq3(projectDrawings.projectId, projectId));
  return db.delete(projects).where(and2(eq3(projects.id, projectId), eq3(projects.userId, userId)));
}
async function duplicateProject(projectId, userId, newName) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  const original = await getProjectById(projectId, userId);
  if (!original) {
    throw new Error("Project not found");
  }
  const result = await db.insert(projects).values({
    userId,
    name: newName,
    description: original.description,
    inputs: original.inputs,
    results: original.results,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  });
  return result;
}
async function getProjectDrawings(projectId) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  return db.select().from(projectDrawings).where(eq3(projectDrawings.projectId, projectId));
}

// server/projects/router.ts
var projectInputSchema = z3.object({
  name: z3.string().min(1, "Project name is required"),
  description: z3.string().optional().nullable(),
  inputs: z3.record(z3.string(), z3.any()),
  results: z3.record(z3.string(), z3.any())
});
var projectsRouter = router({
  create: protectedProcedure.input(projectInputSchema).mutation(async ({ input, ctx }) => {
    const result = await createProject(
      Number(ctx.user.id),
      input.name,
      input.description || null,
      input.inputs,
      input.results
    );
    return {
      success: true,
      projectId: result.insertId || result[0]
    };
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    const projectsList = await getProjectsByUserId(Number(ctx.user.id));
    return projectsList.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
  }),
  get: protectedProcedure.input(z3.object({ projectId: z3.coerce.number() })).query(async ({ input, ctx }) => {
    const project = await getProjectById(input.projectId, Number(ctx.user.id));
    if (!project) {
      throw new Error("Project not found");
    }
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      inputs: JSON.parse(project.inputs),
      results: JSON.parse(project.results),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }),
  update: protectedProcedure.input(
    z3.object({
      projectId: z3.coerce.number(),
      name: z3.string().min(1, "Project name is required"),
      description: z3.string().optional().nullable(),
      inputs: z3.record(z3.string(), z3.any()),
      results: z3.record(z3.string(), z3.any())
    })
  ).mutation(async ({ input, ctx }) => {
    const result = await updateProject(
      input.projectId,
      Number(ctx.user.id),
      input.name,
      input.description || null,
      input.inputs,
      input.results
    );
    return {
      success: true,
      message: "Project updated successfully"
    };
  }),
  delete: protectedProcedure.input(z3.object({ projectId: z3.coerce.number() })).mutation(async ({ input, ctx }) => {
    await deleteProject(input.projectId, Number(ctx.user.id));
    return {
      success: true,
      message: "Project deleted successfully"
    };
  }),
  duplicate: protectedProcedure.input(
    z3.object({
      projectId: z3.coerce.number(),
      newName: z3.string().min(1, "New project name is required")
    })
  ).mutation(async ({ input, ctx }) => {
    const result = await duplicateProject(
      input.projectId,
      Number(ctx.user.id),
      input.newName
    );
    return {
      success: true,
      projectId: result.insertId || result[0],
      message: "Project duplicated successfully"
    };
  }),
  getDrawings: protectedProcedure.input(z3.object({ projectId: z3.coerce.number() })).query(async ({ input }) => {
    return getProjectDrawings(input.projectId);
  })
});

// server/routers.ts
var gridConnectionSchema = z4.object({
  agriculturalTrenchingMin: z4.number().nonnegative().optional(),
  agriculturalTrenchingMax: z4.number().nonnegative().optional(),
  roadTrenchingMin: z4.number().nonnegative().optional(),
  roadTrenchingMax: z4.number().nonnegative().optional(),
  majorRoadCrossingsMin: z4.number().nonnegative().optional(),
  majorRoadCrossingsMax: z4.number().nonnegative().optional(),
  jointBaysMin: z4.number().nonnegative().optional(),
  jointBaysMax: z4.number().nonnegative().optional(),
  transformersMin: z4.number().nonnegative().optional(),
  transformersMax: z4.number().nonnegative().optional(),
  landRightsCompensationMin: z4.number().nonnegative().optional(),
  landRightsCompensationMax: z4.number().nonnegative().optional(),
  landRightsLegalMin: z4.number().nonnegative().optional(),
  landRightsLegalMax: z4.number().nonnegative().optional(),
  planningFeesMin: z4.number().nonnegative().optional(),
  planningFeesMax: z4.number().nonnegative().optional(),
  planningConsentsMin: z4.number().nonnegative().optional(),
  planningConsentsMax: z4.number().nonnegative().optional(),
  constructionMin: z4.number().nonnegative().optional(),
  constructionMax: z4.number().nonnegative().optional(),
  softCostsMin: z4.number().nonnegative().optional(),
  softCostsMax: z4.number().nonnegative().optional(),
  projectMin: z4.number().nonnegative().optional(),
  projectMax: z4.number().nonnegative().optional()
});
var appRouter = router({
  system: systemRouter,
  projects: projectsRouter,
  auth: router({
    signup: customAuthRouter._def.procedures.signup,
    login: customAuthRouter._def.procedures.login,
    verifyEmail: customAuthRouter._def.procedures.verifyEmail,
    requestPasswordReset: customAuthRouter._def.procedures.requestPasswordReset,
    resetPassword: customAuthRouter._def.procedures.resetPassword,
    changePassword: customAuthRouter._def.procedures.changePassword,
    changeEmail: customAuthRouter._def.procedures.changeEmail,
    deleteAccount: customAuthRouter._def.procedures.deleteAccount,
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  solar: router({
    list: protectedProcedure.query(
      ({ ctx }) => getSolarModelsByUserId(Number(ctx.user.id))
    ),
    get: protectedProcedure.input(z4.object({ id: z4.coerce.number() })).query(
      ({ ctx, input }) => getSolarModelById(Number(input.id), Number(ctx.user.id))
    ),
    create: protectedProcedure.input(z4.object({
      name: z4.string().min(1),
      description: z4.string().optional(),
      mw: z4.number().positive(),
      capexPerMW: z4.number().positive(),
      privateWireCost: z4.number().nonnegative(),
      gridConnectionCost: z4.number().nonnegative(),
      developmentPremiumPerMW: z4.number().nonnegative(),
      opexPerMW: z4.number().positive(),
      opexEscalation: z4.string(),
      generationPerMW: z4.string(),
      degradationRate: z4.string(),
      projectLife: z4.number().positive(),
      discountRate: z4.string(),
      powerPrice: z4.number().positive(),
      percentConsumptionPPA: z4.number().min(0).max(100),
      percentConsumptionExport: z4.number().min(0).max(100),
      exportPrice: z4.number().nonnegative(),
      lcoe: z4.string().optional(),
      irr: z4.string().optional(),
      paybackPeriod: z4.string().optional(),
      totalNpv: z4.string().optional()
    })).mutation(({ ctx, input }) => {
      return createSolarModel({
        userId: ctx.user.id,
        ...input
      });
    }),
    update: protectedProcedure.input(z4.object({
      id: z4.coerce.number(),
      name: z4.string().min(1).optional(),
      description: z4.string().optional(),
      mw: z4.number().positive().optional(),
      capexPerMW: z4.number().positive().optional(),
      privateWireCost: z4.number().nonnegative().optional(),
      gridConnectionCost: z4.number().nonnegative().optional(),
      developmentPremiumPerMW: z4.number().nonnegative().optional(),
      opexPerMW: z4.number().positive().optional(),
      opexEscalation: z4.string().optional(),
      generationPerMW: z4.string().optional(),
      degradationRate: z4.string().optional(),
      projectLife: z4.number().positive().optional(),
      discountRate: z4.string().optional(),
      powerPrice: z4.number().positive().optional(),
      percentConsumptionPPA: z4.number().min(0).max(100).optional(),
      percentConsumptionExport: z4.number().min(0).max(100).optional(),
      exportPrice: z4.number().nonnegative().optional(),
      lcoe: z4.string().optional(),
      irr: z4.string().optional(),
      paybackPeriod: z4.string().optional(),
      totalNpv: z4.string().optional()
    })).mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateSolarModel(Number(id), Number(ctx.user.id), data);
    }),
    delete: protectedProcedure.input(z4.object({ id: z4.coerce.number() })).mutation(
      ({ ctx, input }) => deleteSolarModel(Number(input.id), Number(ctx.user.id))
    )
  }),
  gridConnection: router({
    get: protectedProcedure.input(z4.object({ solarModelId: z4.coerce.number() })).query(
      ({ input }) => getGridConnectionCost(input.solarModelId)
    ),
    create: protectedProcedure.input(z4.object({
      solarModelId: z4.coerce.number()
    }).merge(gridConnectionSchema)).mutation(
      ({ input }) => createGridConnectionCost({ ...input, solarModelId: input.solarModelId })
    ),
    update: protectedProcedure.input(z4.object({
      id: z4.coerce.number()
    }).merge(gridConnectionSchema)).mutation(({ input }) => {
      const { id, ...data } = input;
      return updateGridConnectionCost(id, data);
    }),
    delete: protectedProcedure.input(z4.object({ id: z4.coerce.number() })).mutation(
      ({ input }) => deleteGridConnectionCost(input.id)
    )
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    cors: true
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000");
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}
startServer().catch(console.error);
