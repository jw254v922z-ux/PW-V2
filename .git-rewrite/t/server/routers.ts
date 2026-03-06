import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getSolarModelsByUserId, getSolarModelById, createSolarModel, updateSolarModel, deleteSolarModel, getGridConnectionCost, createGridConnectionCost, updateGridConnectionCost, deleteGridConnectionCost } from "./db";
import { InsertSolarModel, InsertGridConnectionCost } from "../drizzle/schema";
import { customAuthRouter } from "./auth/router";
import { projectsRouter } from "./projects/router";

const gridConnectionSchema = z.object({
  agriculturalTrenchingMin: z.number().nonnegative().optional(),
  agriculturalTrenchingMax: z.number().nonnegative().optional(),
  roadTrenchingMin: z.number().nonnegative().optional(),
  roadTrenchingMax: z.number().nonnegative().optional(),
  majorRoadCrossingsMin: z.number().nonnegative().optional(),
  majorRoadCrossingsMax: z.number().nonnegative().optional(),
  jointBaysMin: z.number().nonnegative().optional(),
  jointBaysMax: z.number().nonnegative().optional(),
  transformersMin: z.number().nonnegative().optional(),
  transformersMax: z.number().nonnegative().optional(),
  landRightsCompensationMin: z.number().nonnegative().optional(),
  landRightsCompensationMax: z.number().nonnegative().optional(),
  landRightsLegalMin: z.number().nonnegative().optional(),
  landRightsLegalMax: z.number().nonnegative().optional(),
  planningFeesMin: z.number().nonnegative().optional(),
  planningFeesMax: z.number().nonnegative().optional(),
  planningConsentsMin: z.number().nonnegative().optional(),
  planningConsentsMax: z.number().nonnegative().optional(),
  constructionMin: z.number().nonnegative().optional(),
  constructionMax: z.number().nonnegative().optional(),
  softCostsMin: z.number().nonnegative().optional(),
  softCostsMax: z.number().nonnegative().optional(),
  projectMin: z.number().nonnegative().optional(),
  projectMax: z.number().nonnegative().optional(),
});

export const appRouter = router({
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
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  solar: router({
    list: protectedProcedure.query(({ ctx }) =>
      getSolarModelsByUserId(Number(ctx.user.id))
    ),
    get: protectedProcedure
      .input(z.object({ id: z.coerce.number() }))
      .query(({ ctx, input }) =>
        getSolarModelById(Number(input.id), Number(ctx.user.id))
      ),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        mw: z.number().positive(),
        capexPerMW: z.number().positive(),
        privateWireCost: z.number().nonnegative(),
        gridConnectionCost: z.number().nonnegative(),
        developmentPremiumPerMW: z.number().nonnegative(),
        opexPerMW: z.number().positive(),
        opexEscalation: z.string(),
        generationPerMW: z.string(),
        degradationRate: z.string(),
        projectLife: z.number().positive(),
        discountRate: z.string(),
        powerPrice: z.number().positive(),
        percentConsumptionPPA: z.number().min(0).max(100),
        percentConsumptionExport: z.number().min(0).max(100),
        exportPrice: z.number().nonnegative(),
        lcoe: z.string().optional(),
        irr: z.string().optional(),
        paybackPeriod: z.string().optional(),
        totalNpv: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        return createSolarModel({
          userId: ctx.user.id,
          ...input,
        } as InsertSolarModel);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.coerce.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        mw: z.number().positive().optional(),
        capexPerMW: z.number().positive().optional(),
        privateWireCost: z.number().nonnegative().optional(),
        gridConnectionCost: z.number().nonnegative().optional(),
        developmentPremiumPerMW: z.number().nonnegative().optional(),
        opexPerMW: z.number().positive().optional(),
        opexEscalation: z.string().optional(),
        generationPerMW: z.string().optional(),
        degradationRate: z.string().optional(),
        projectLife: z.number().positive().optional(),
        discountRate: z.string().optional(),
        powerPrice: z.number().positive().optional(),
        percentConsumptionPPA: z.number().min(0).max(100).optional(),
        percentConsumptionExport: z.number().min(0).max(100).optional(),
        exportPrice: z.number().nonnegative().optional(),
        lcoe: z.string().optional(),
        irr: z.string().optional(),
        paybackPeriod: z.string().optional(),
        totalNpv: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return updateSolarModel(Number(id), Number(ctx.user.id), data as unknown as Partial<InsertSolarModel>);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.coerce.number() }))
      .mutation(({ ctx, input }) =>
        deleteSolarModel(Number(input.id as unknown), Number(ctx.user.id))
      ),
  }),


  gridConnection: router({
    get: protectedProcedure
      .input(z.object({ solarModelId: z.coerce.number() }))
      .query(({ input }) =>
        getGridConnectionCost(input.solarModelId as number)
      ),
    create: protectedProcedure
      .input(z.object({
        solarModelId: z.coerce.number(),
      }).merge(gridConnectionSchema))
      .mutation(({ input }) =>
        createGridConnectionCost({ ...input, solarModelId: input.solarModelId as number })
      ),
    update: protectedProcedure
      .input(z.object({
        id: z.coerce.number(),
      }).merge(gridConnectionSchema))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateGridConnectionCost(id as number, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.coerce.number() }))
      .mutation(({ input }) =>
        deleteGridConnectionCost(input.id as number)
      ),
  }),
});

export type AppRouter = typeof appRouter;
