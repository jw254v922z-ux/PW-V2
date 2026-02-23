import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  createProject,
  getProjectsByUserId,
  getProjectById,
  updateProject,
  deleteProject,
  duplicateProject,
  getProjectDrawings,
} from './db';

const projectInputSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional().nullable(),
  inputs: z.record(z.string(), z.any()),
  results: z.record(z.string(), z.any()),
});

export const projectsRouter = router({
  create: protectedProcedure
    .input(projectInputSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await createProject(
        Number(ctx.user.id),
        input.name,
        input.description || null,
        input.inputs,
        input.results
      );
      return {
        success: true,
        projectId: (result as any).insertId || result[0],
      };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const projectsList = await getProjectsByUserId(Number(ctx.user.id));
    return projectsList.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }),

  get: protectedProcedure
    .input(z.object({ projectId: z.coerce.number() }))
    .query(async ({ input, ctx }) => {
      const project = await getProjectById(input.projectId, Number(ctx.user.id));
      if (!project) {
        throw new Error('Project not found');
      }
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        inputs: JSON.parse(project.inputs as string),
        results: JSON.parse(project.results as string),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        projectId: z.coerce.number(),
        name: z.string().min(1, 'Project name is required'),
        description: z.string().optional().nullable(),
        inputs: z.record(z.string(), z.any()),
        results: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input, ctx }) => {
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
        message: 'Project updated successfully',
      };
    }),

  delete: protectedProcedure
    .input(z.object({ projectId: z.coerce.number() }))
    .mutation(async ({ input, ctx }) => {
      await deleteProject(input.projectId, Number(ctx.user.id));
      return {
        success: true,
        message: 'Project deleted successfully',
      };
    }),

  duplicate: protectedProcedure
    .input(
      z.object({
        projectId: z.coerce.number(),
        newName: z.string().min(1, 'New project name is required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await duplicateProject(
        input.projectId,
        Number(ctx.user.id),
        input.newName
      );
      return {
        success: true,
        projectId: (result as any).insertId || result[0],
        message: 'Project duplicated successfully',
      };
    }),

  getDrawings: protectedProcedure
    .input(z.object({ projectId: z.coerce.number() }))
    .query(async ({ input }) => {
      return getProjectDrawings(input.projectId);
    }),
});
