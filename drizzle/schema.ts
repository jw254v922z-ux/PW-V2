import { integer, pgEnum, pgTable, text, timestamp, varchar, AnyPgColumn } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Solar project models saved by users
 */
export const solarModels = pgTable("solar_models", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SolarModel = typeof solarModels.$inferSelect;
export type InsertSolarModel = typeof solarModels.$inferInsert;

/**
 * Grid connection cost breakdown for solar projects
 */
export const gridConnectionCosts = pgTable("grid_connection_costs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  solarModelId: integer("solarModelId").notNull(),
  // Trenching costs
  agriculturalTrenchingMin: integer("agriculturalTrenchingMin").default(600000).notNull(),
  agriculturalTrenchingMax: integer("agriculturalTrenchingMax").default(1050000).notNull(),
  roadTrenchingMin: integer("roadTrenchingMin").default(1200000).notNull(),
  roadTrenchingMax: integer("roadTrenchingMax").default(2400000).notNull(),
  // Major crossings
  majorRoadCrossingsMin: integer("majorRoadCrossingsMin").default(300000).notNull(),
  majorRoadCrossingsMax: integer("majorRoadCrossingsMax").default(600000).notNull(),
  // Joint bays and terminations
  jointBaysMin: integer("jointBaysMin").default(120000).notNull(),
  jointBaysMax: integer("jointBaysMax").default(240000).notNull(),
  // Transformers
  transformersMin: integer("transformersMin").default(500000).notNull(),
  transformersMax: integer("transformersMax").default(800000).notNull(),
  // Land rights - compensation
  landRightsCompensationMin: integer("landRightsCompensationMin").default(20000).notNull(),
  landRightsCompensationMax: integer("landRightsCompensationMax").default(60000).notNull(),
  // Land rights - legal fees
  landRightsLegalMin: integer("landRightsLegalMin").default(50000).notNull(),
  landRightsLegalMax: integer("landRightsLegalMax").default(90000).notNull(),
  // Planning
  planningFeesMin: integer("planningFeesMin").default(600).notNull(),
  planningFeesMax: integer("planningFeesMax").default(1200).notNull(),
  planningConsentsMin: integer("planningConsentsMin").default(15000).notNull(),
  planningConsentsMax: integer("planningConsentsMax").default(40000).notNull(),
  // Calculated totals
  constructionMin: integer("constructionMin").default(3200000).notNull(),
  constructionMax: integer("constructionMax").default(4200000).notNull(),
  softCostsMin: integer("softCostsMin").default(85000).notNull(),
  softCostsMax: integer("softCostsMax").default(190000).notNull(),
  projectMin: integer("projectMin").default(3300000).notNull(),
  projectMax: integer("projectMax").default(4400000).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GridConnectionCost = typeof gridConnectionCosts.$inferSelect;
export type InsertGridConnectionCost = typeof gridConnectionCosts.$inferInsert;
