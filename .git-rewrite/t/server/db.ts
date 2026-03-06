import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, solarModels, InsertSolarModel, gridConnectionCosts, InsertGridConnectionCost } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: any = null;

export async function getDb() {
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

export async function upsertUser(user: InsertUser): Promise<void> {
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
    
    const values: any = {
      openId: user.openId,
      email: defaultEmail,
      name: user.name ?? null,
      loginMethod: user.loginMethod || 'oauth',
      lastSignedIn: user.lastSignedIn || new Date(),
    };

    if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
    }

    // Using any cast to bypass complex type issues in Fast mode
    await (db.insert(users).values(values) as any).onConflictDoUpdate({
      target: users.openId,
      set: {
        name: values.name,
        email: values.email,
        loginMethod: values.loginMethod,
        lastSignedIn: values.lastSignedIn,
        role: values.role,
      }
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSolarModelsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(solarModels).where(eq(solarModels.userId, userId)).orderBy(solarModels.updatedAt);
}

export async function getSolarModelById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(solarModels)
    .where(and(eq(solarModels.id, id), eq(solarModels.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSolarModel(data: InsertSolarModel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(solarModels).values(data);
}

export async function updateSolarModel(id: number, userId: number, data: Partial<InsertSolarModel>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(solarModels).set(data).where(and(eq(solarModels.id, id), eq(solarModels.userId, userId)));
}

export async function deleteSolarModel(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(solarModels).where(and(eq(solarModels.id, id), eq(solarModels.userId, userId)));
}

export async function getGridConnectionCost(solarModelId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(gridConnectionCosts)
    .where(eq(gridConnectionCosts.solarModelId, solarModelId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createGridConnectionCost(data: InsertGridConnectionCost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(gridConnectionCosts).values(data);
}

export async function updateGridConnectionCost(id: number, data: Partial<InsertGridConnectionCost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(gridConnectionCosts).set(data).where(eq(gridConnectionCosts.id, id));
}

export async function deleteGridConnectionCost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(gridConnectionCosts).where(eq(gridConnectionCosts.id, id));
}
