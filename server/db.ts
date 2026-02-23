import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, solarModels, InsertSolarModel, gridConnectionCosts, InsertGridConnectionCost } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool(process.env.DATABASE_URL);
      _db = drizzle(pool);
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
    // For OAuth users, provide a default email if not available
    const defaultEmail = user.email || `oauth-${user.openId}@internal.local`;
    
    const values: Partial<InsertUser> = {
      openId: user.openId,
      email: defaultEmail,
      name: user.name,
      loginMethod: user.loginMethod || 'oauth',
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? undefined;
      if (normalized !== undefined) {
        values[field] = normalized;
        updateSet[field] = normalized;
      }
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // MySQL: Use onDuplicateKeyUpdate instead of onConflictDoUpdate
    await db.insert(users).values(values as InsertUser).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

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
    .where(eq(solarModels.id, id) && eq(solarModels.userId, userId))
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
  await db.update(solarModels).set(data).where(eq(solarModels.id, id) && eq(solarModels.userId, userId));
}

export async function deleteSolarModel(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(solarModels).where(eq(solarModels.id, id) && eq(solarModels.userId, userId));
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
