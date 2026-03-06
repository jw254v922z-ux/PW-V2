import { getDb } from '../db';
import { projects, projectDrawings } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function createProject(
  userId: number,
  name: string,
  description: string | null,
  inputs: Record<string, any>,
  results: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error('Database not connected');
  const result = await db.insert(projects).values({
    userId,
    name,
    description,
    inputs: JSON.stringify(inputs),
    results: JSON.stringify(results),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result;
}

export async function getProjectsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not connected');
  return db.select().from(projects).where(eq(projects.userId, userId));
}

export async function getProjectById(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not connected');
  const result = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  return result[0] || null;
}

export async function updateProject(
  projectId: number,
  userId: number,
  name: string,
  description: string | null,
  inputs: Record<string, any>,
  results: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error('Database not connected');
  return db
    .update(projects)
    .set({
      name,
      description,
      inputs: JSON.stringify(inputs),
      results: JSON.stringify(results),
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

export async function deleteProject(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not connected');
  // Delete drawings first (cascade)
  await db.delete(projectDrawings).where(eq(projectDrawings.projectId, projectId));
  // Delete project
  return db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
}

export async function duplicateProject(projectId: number, userId: number, newName: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not connected');
  const original = await getProjectById(projectId, userId);
  if (!original) {
    throw new Error('Project not found');
  }

  const result = await db.insert(projects).values({
    userId,
    name: newName,
    description: original.description,
    inputs: original.inputs,
    results: original.results,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result;
}

export async function addProjectDrawing(
  projectId: number,
  type: string,
  url: string
) {
  const db = await getDb();
  if (!db) throw new Error('Database not connected');
  return db.insert(projectDrawings).values({
    projectId,
    type,
    url,
    createdAt: new Date(),
  });
}

export async function getProjectDrawings(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not connected');
  return db.select().from(projectDrawings).where(eq(projectDrawings.projectId, projectId));
}

export async function deleteProjectDrawing(drawingId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not connected');
  return db.delete(projectDrawings).where(eq(projectDrawings.id, drawingId));
}
