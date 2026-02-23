import { int, varchar, timestamp, mysqlTable } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  /** Manus OAuth identifier (openId) - optional, for backward compatibility */
  openId: varchar("openId", { length: 64 }).unique(),
  /** Custom auth email - required for non-OAuth users */
  email: varchar("email", { length: 320 }).unique().notNull(),
  /** Hashed password for custom auth - optional if using OAuth */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** Email verification status */
  emailVerified: int("emailVerified").default(0).notNull(),
  name: varchar("name", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("custom").notNull(),
  role: varchar("role", { length: 50 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Solar project models saved by users
 */
export const solarModels = mysqlTable("solar_models", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }),
  mw: int("mw").notNull(),
  capexPerMW: int("capexPerMW").notNull(),
  privateWireCost: int("privateWireCost").notNull(),
  gridConnectionCost: int("gridConnectionCost").default(0).notNull(),
  developmentPremiumPerMW: int("developmentPremiumPerMW").notNull(),
  opexPerMW: int("opexPerMW").notNull(),
  opexEscalation: varchar("opexEscalation", { length: 20 }).notNull(),
  generationPerMW: varchar("generationPerMW", { length: 20 }).notNull(),
  degradationRate: varchar("degradationRate", { length: 20 }).notNull(),
  projectLife: int("projectLife").notNull(),
  discountRate: varchar("discountRate", { length: 20 }).notNull(),
  powerPrice: int("powerPrice").notNull(),
  percentConsumptionPPA: int("percentConsumptionPPA").default(100).notNull(),
  percentConsumptionExport: int("percentConsumptionExport").default(0).notNull(),
  exportPrice: int("exportPrice").default(50).notNull(),
  offsetableEnergyCost: int("offsetableEnergyCost").default(120).notNull(),
  lcoe: varchar("lcoe", { length: 20 }),
  irr: varchar("irr", { length: 20 }),
  paybackPeriod: varchar("paybackPeriod", { length: 20 }),
  totalNpv: varchar("totalNpv", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type SolarModel = typeof solarModels.$inferSelect;
export type InsertSolarModel = typeof solarModels.$inferInsert;

/**
 * Grid connection cost breakdown for solar projects
 */
export const gridConnectionCosts = mysqlTable("grid_connection_costs", {
  id: int("id").primaryKey().autoincrement(),
  solarModelId: int("solarModelId").notNull(),
  // Trenching costs
  agriculturalTrenchingMin: int("agriculturalTrenchingMin").default(600000).notNull(),
  agriculturalTrenchingMax: int("agriculturalTrenchingMax").default(1050000).notNull(),
  roadTrenchingMin: int("roadTrenchingMin").default(1200000).notNull(),
  roadTrenchingMax: int("roadTrenchingMax").default(2400000).notNull(),
  // Major crossings
  majorRoadCrossingsMin: int("majorRoadCrossingsMin").default(300000).notNull(),
  majorRoadCrossingsMax: int("majorRoadCrossingsMax").default(600000).notNull(),
  // Joint bays and terminations
  jointBaysMin: int("jointBaysMin").default(120000).notNull(),
  jointBaysMax: int("jointBaysMax").default(240000).notNull(),
  // Transformers
  transformersMin: int("transformersMin").default(500000).notNull(),
  transformersMax: int("transformersMax").default(800000).notNull(),
  // Land rights - compensation
  landRightsCompensationMin: int("landRightsCompensationMin").default(20000).notNull(),
  landRightsCompensationMax: int("landRightsCompensationMax").default(60000).notNull(),
  // Land rights - legal fees
  landRightsLegalMin: int("landRightsLegalMin").default(50000).notNull(),
  landRightsLegalMax: int("landRightsLegalMax").default(90000).notNull(),
  // Planning
  planningFeesMin: int("planningFeesMin").default(600).notNull(),
  planningFeesMax: int("planningFeesMax").default(1200).notNull(),
  planningConsentsMin: int("planningConsentsMin").default(15000).notNull(),
  planningConsentsMax: int("planningConsentsMax").default(40000).notNull(),
  // Calculated totals
  constructionMin: int("constructionMin").default(3200000).notNull(),
  constructionMax: int("constructionMax").default(4200000).notNull(),
  softCostsMin: int("softCostsMin").default(85000).notNull(),
  softCostsMax: int("softCostsMax").default(190000).notNull(),
  projectMin: int("projectMin").default(3300000).notNull(),
  projectMax: int("projectMax").default(4400000).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type GridConnectionCost = typeof gridConnectionCosts.$inferSelect;
export type InsertGridConnectionCost = typeof gridConnectionCosts.$inferInsert;

/**
 * Email verification tokens for custom auth
 */
export const emailVerificationTokens = mysqlTable("email_verification_tokens", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;

/**
 * Password reset tokens for custom auth
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Domain whitelist for signup restrictions
 */
export const domainWhitelist = mysqlTable("domain_whitelist", {
  id: int("id").primaryKey().autoincrement(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type DomainWhitelist = typeof domainWhitelist.$inferSelect;
export type InsertDomainWhitelist = typeof domainWhitelist.$inferInsert;

/**
 * Projects with full calculator inputs and results
 */
export const projects = mysqlTable("projects", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }),
  /** Full calculator inputs as JSON */
  inputs: varchar("inputs", { length: 65535 }).notNull(),
  /** Full calculator results as JSON */
  results: varchar("results", { length: 65535 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project drawings (maps, sketches)
 */
export const projectDrawings = mysqlTable("project_drawings", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("projectId").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'map', 'sketch', etc.
  url: varchar("url", { length: 1024 }).notNull(), // S3 URL
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ProjectDrawing = typeof projectDrawings.$inferSelect;
export type InsertProjectDrawing = typeof projectDrawings.$inferInsert;
