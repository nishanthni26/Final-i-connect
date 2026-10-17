import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { generateCleanDeviceCopy } from "./contentEngine";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { decodeJwt } from "jose";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user ? ({ id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, role: ctx.user.role, loginMethod: ctx.user.loginMethod, createdAt: ctx.user.createdAt }) : null),
    myActivity: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return { orders: [], quotes: [], repairs: [] };
      const email = (ctx.user.email || "").toLowerCase().trim();
      const name = (ctx.user.name || "").toLowerCase().trim();
      const allOrders = await db.listOrders();
      const allQuotes = await db.listQuotes();
      const allRepairs = await db.listRepairs();

      const customerOrders = allOrders
        .filter(o => (email && o.email?.toLowerCase().trim() === email) || (name && o.customerName.toLowerCase().trim() === name))
        .map(order => ({
          ...order,
          items: JSON.parse(order.items) as Array<{ id: number; name: string; spec: string; price: number }>,
        }));
      const customerQuotes = allQuotes.filter(
        q => name && q.customerName.toLowerCase().trim() === name
      );
      const customerRepairs = allRepairs.filter(
        r => (email && r.email?.toLowerCase().trim() === email) || (name && r.customerName.toLowerCase().trim() === name)
      );
      return { orders: customerOrders, quotes: customerQuotes, repairs: customerRepairs };
    }),
    updateProfile: publicProcedure
      .input(z.object({ name: z.string().trim().min(2).max(80) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to update your profile." });
        await db.upsertUser({
          openId: ctx.user.openId,
          name: input.name,
          email: ctx.user.email,
          loginMethod: ctx.user.loginMethod,
          role: ctx.user.role,
          lastSignedIn: new Date(),
        });
        const token = await sdk.createSessionToken(ctx.user.openId, { name: input.name, expiresInMs: ONE_YEAR_MS });
        ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
        return { success: true, name: input.name, token } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    signUp: publicProcedure.input(z.object({ name: z.string().min(2).max(80), email: z.string().email().max(320), password: z.string().min(7).max(120) })).mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase().trim();
      if (await db.getUserByEmail(email)) throw new TRPCError({ code: "CONFLICT", message: "An account already exists for this email." });
      const salt = randomBytes(16).toString("hex");
      const hash = scryptSync(input.password, salt, 64).toString("hex");
      const user = await db.createLocalUser({ email, name: input.name.trim(), passwordHash: `${salt}:${hash}` });
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create account." });
      const token = await sdk.createSessionToken(user.openId, { name: user.name || input.name, expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true, role: user.role, token } as const;
    }),
    signIn: publicProcedure.input(z.object({ email: z.string().email().max(320), password: z.string().min(7).max(120) })).mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email.toLowerCase().trim());
      if (!user?.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
      const [salt, stored] = user.passwordHash.split(":");
      const actual = scryptSync(input.password, salt, 64);
      if (!stored || !timingSafeEqual(actual, Buffer.from(stored, "hex"))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Email or password is incorrect." });
      const token = await sdk.createSessionToken(user.openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true, role: user.role, token } as const;
    }),
    googleSignIn: publicProcedure
      .input(
        z.object({
          credential: z.string().optional(),
          email: z.string().email().max(320).optional(),
          name: z.string().max(120).optional(),
          picture: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        let email = input.email;
        let name = input.name || "";
        let picture = input.picture;
        let googleSub = "";

        if (input.credential) {
          try {
            const payload = decodeJwt(input.credential) as {
              email?: string;
              name?: string;
              picture?: string;
              sub?: string;
            };
            if (payload?.email) {
              email = payload.email;
              name = payload.name || name;
              picture = payload.picture || picture;
              googleSub = payload.sub || "";
            }
          } catch (e) {
            console.warn("[Google Auth] Error decoding token credential:", e);
          }
        }

        if (!email) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Google account email is required." });
        }

        const cleanEmail = email.toLowerCase().trim();
        const existing = await db.getUserByEmail(cleanEmail);
        const openId = existing?.openId || (googleSub ? `google:${googleSub}` : `google:${cleanEmail}`);
        const resolvedName = (name || cleanEmail.split("@")[0] || "Customer").trim();

        await db.upsertUser({
          openId,
          name: resolvedName,
          email: cleanEmail,
          loginMethod: "google",
          lastSignedIn: new Date(),
        });

        const user = await db.getUserByEmail(cleanEmail);
        const token = await sdk.createSessionToken(openId, { name: resolvedName, expiresInMs: ONE_YEAR_MS });
        ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
        return { success: true, role: user?.role ?? "user", token, email: cleanEmail, name: resolvedName, picture } as const;
      }),
    demoAdminSignIn: publicProcedure.mutation(async ({ ctx }) => {
      const openId = "local:demo-admin@iconnectblr.com";
      await db.upsertUser({
        openId,
        name: "iConnect Store Admin",
        email: "admin@iconnectblr.com",
        loginMethod: "demo-admin",
        role: "admin",
        lastSignedIn: new Date(),
      });
      const token = await sdk.createSessionToken(openId, { name: "iConnect Store Admin", expiresInMs: ONE_YEAR_MS });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true, role: "admin" as const, token };
    }),
  }),

  catalog: router({
    list: publicProcedure.query(async () => (await db.listProducts()).map(product => ({
      id: product.id,
      name: product.name,
      spec: product.spec,
      price: product.price,
      wasPrice: product.wasPrice,
      tag: product.tag,
      image: product.image,
      category: product.category,
      stock: product.stock,
      description: product.description ?? undefined,
    }))),
    create: adminProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(120),
        spec: z.string().trim().min(2).max(240),
        price: z.number().int().positive().max(100_000_000),
        wasPrice: z.number().int().positive().max(100_000_000),
        tag: z.string().trim().min(2).max(60),
        image: z.string().trim().max(2048).optional(),
        imageData: z.string().max(7_000_000).optional(),
        category: z.string().trim().min(2).max(40),
        stock: z.string().trim().min(2).max(60),
        description: z.string().max(2000).optional(),
      }).refine(input => input.wasPrice >= input.price, { path: ["wasPrice"], message: "Compare-at price must be at least the sale price." })
        .refine(input => Boolean(input.image || input.imageData), { path: ["image"], message: "A product image is required." }))
      .mutation(async ({ input, ctx }) => {
        let image = input.image;
        if (input.imageData) {
          const match = input.imageData.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
          if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a JPEG, PNG, or WebP image." });
          const [, format, encoded] = match;
          const mime = `image/${format}`;
          const extension = format === "jpeg" ? "jpg" : format;
          const stored = await storagePut(`products/${Date.now()}.${extension}`, Buffer.from(encoded, "base64"), mime);
          image = stored.url;
        }
        const product = await db.createProduct({
          name: input.name,
          spec: input.spec,
          price: input.price,
          wasPrice: input.wasPrice,
          tag: input.tag,
          image: image || "/images/iphone-18-pro-lineup.jpg",
          category: input.category,
          stock: input.stock,
          description: input.description || null,
          createdBy: ctx.user.id,
        });
        return {
          id: product.id,
          name: product.name,
          spec: product.spec,
          price: product.price,
          wasPrice: product.wasPrice,
          tag: product.tag,
          image: product.image,
          category: product.category,
          stock: product.stock,
          description: product.description ?? undefined,
        };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        name: z.string().trim().min(2).max(120),
        spec: z.string().trim().min(2).max(240),
        price: z.number().int().positive().max(100_000_000),
        wasPrice: z.number().int().positive().max(100_000_000),
        tag: z.string().trim().min(2).max(60),
        image: z.string().trim().max(2048).optional(),
        imageData: z.string().max(7_000_000).optional(),
        category: z.string().trim().min(2).max(40),
        stock: z.string().trim().min(2).max(60),
        description: z.string().max(2000).optional(),
      }).refine(input => input.wasPrice >= input.price, { path: ["wasPrice"], message: "Compare-at price must be at least the sale price." })
        .refine(input => Boolean(input.image || input.imageData), { path: ["image"], message: "A product image is required." }))
      .mutation(async ({ input }) => {
        let image = input.image;
        if (input.imageData) {
          const match = input.imageData.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
          if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a JPEG, PNG, or WebP image." });
          const [, format, encoded] = match;
          const mime = `image/${format}`;
          const extension = format === "jpeg" ? "jpg" : format;
          const stored = await storagePut(`products/${Date.now()}.${extension}`, Buffer.from(encoded, "base64"), mime);
          image = stored.url;
        }
        const product = await db.updateProduct(input.id, {
          name: input.name, spec: input.spec, price: input.price, wasPrice: input.wasPrice,
          tag: input.tag, image: image || "/images/iphone-18-pro-lineup.jpg", category: input.category, stock: input.stock,
          description: input.description || null,
        });
        return { id: product.id, name: product.name, spec: product.spec, price: product.price, wasPrice: product.wasPrice, tag: product.tag, image: product.image, category: product.category, stock: product.stock, description: product.description ?? undefined };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteProduct(input.id);
        return { success: true } as const;
      }),
    generateCleanCopy: publicProcedure
      .input(
        z.object({
          deviceBrand: z.string().trim().min(1).max(80),
          deviceModel: z.string().trim().min(1).max(120),
          conditionScore: z.string().trim().max(60).optional(),
          spec: z.string().trim().max(240).optional(),
          branch: z.string().trim().max(60).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return generateCleanDeviceCopy(input);
      }),
  }),

  siteMedia: router({
    currentStoreVideo: publicProcedure.query(async () => {
      const media = await db.getStoreVideo();
      return media ? { videoUrl: media.videoUrl, videoType: media.videoType, fileName: media.fileName, updatedAt: media.updatedAt } : null;
    }),
    uploadStoreVideo: adminProcedure
      .input(z.object({
        videoData: z.string().max(33_600_000),
        contentType: z.enum(["video/mp4", "video/webm", "video/quicktime"]),
        fileName: z.string().trim().min(1).max(255),
      }))
      .mutation(async ({ input }) => {
        const match = input.videoData.match(/^data:(video\/(?:mp4|webm|quicktime));base64,([A-Za-z0-9+/=]+)$/);
        if (!match || match[1] !== input.contentType) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a valid MP4, WebM, or MOV video." });
        const extension = input.contentType === "video/quicktime" ? "mov" : input.contentType.slice("video/".length);
        const stored = await storagePut(`store/videos/${Date.now()}-${nanoid(8)}.${extension}`, Buffer.from(match[2], "base64"), input.contentType);
        const media = await db.saveStoreVideo({ videoUrl: stored.url, videoType: input.contentType, fileName: input.fileName });
        return media ? { videoUrl: media.videoUrl, videoType: media.videoType, fileName: media.fileName } : null;
      }),
    deleteStoreVideo: adminProcedure.mutation(async () => {
      await db.clearStoreVideo();
      return { success: true } as const;
    }),
  }),

  checkout: router({
    placeOrder: publicProcedure
      .input(z.object({
        customerName: z.string().trim().min(2).max(80),
        phone: z.string().trim().regex(/^\+?[0-9\s()\-]{8,24}$/),
        email: z.union([z.string().email().max(320), z.literal("")]).optional(),
        branch: z.enum(["RT Nagar", "Yeshwanthpur", "Ganganagar"]),
        items: z.array(z.object({
          id: z.number().int().min(-1000000).max(100000000),
          name: z.string().trim().min(2).max(120),
          spec: z.string().trim().min(2).max(240),
          price: z.number().int().positive().max(100_000_000),
        })).min(1).max(20),
      }))
      .mutation(async ({ input }) => {
        const total = input.items.reduce((sum, item) => sum + item.price, 0);
        if (!Number.isSafeInteger(total)) throw new TRPCError({ code: "BAD_REQUEST", message: "Order total is too large." });
        const orderNumber = `IC-${nanoid(10).toUpperCase()}`;
        await db.createOrder({
          orderNumber,
          customerName: input.customerName,
          phone: input.phone.replace(/\D/g, ""),
          email: input.email || null,
          branch: input.branch,
          items: JSON.stringify(input.items),
          total,
          status: "pending",
        });
        return { orderNumber, status: "pending" as const, total };
      }),
    lookup: publicProcedure
      .input(z.object({ orderNumber: z.string().trim().min(8).max(24), phone: z.string().trim().regex(/^\+?[0-9\s()\-]{8,24}$/) }))
      .query(async ({ input }) => {
        const order = await db.getOrderByNumberAndPhone(input.orderNumber.toUpperCase(), input.phone.replace(/\D/g, ""));
        if (!order) return null;
        return { ...order, items: JSON.parse(order.items) as Array<{ id: number; name: string; spec: string; price: number }> };
      }),
    list: adminProcedure.query(async () => (await db.listOrders()).map(order => ({
      ...order,
      items: JSON.parse(order.items) as Array<{ id: number; name: string; spec: string; price: number }>,
    }))),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["pending", "confirmed", "paid", "ready", "completed", "cancelled"]) }))
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.id, input.status);
        return { success: true } as const;
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteOrder(input.id);
        return { success: true } as const;
      }),
  }),

  quotes: router({
    list: adminProcedure.query(async () => db.listQuotes()),
    create: publicProcedure
      .input(z.object({
        customerName: z.string().trim().min(2).max(80),
        phone: z.string().trim().min(8).max(24),
        deviceModel: z.string().trim().min(2).max(160),
        condition: z.enum(["Like new", "Good", "Needs repair"]),
        branch: z.enum(["RT Nagar", "Yeshwanthpur", "Ganganagar"]),
        notes: z.string().trim().max(1000).optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createQuote({
          customerName: input.customerName,
          phone: input.phone,
          deviceModel: input.deviceModel,
          condition: input.condition,
          branch: input.branch,
          notes: input.notes || "",
        });
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["new", "quoted", "accepted", "completed", "declined"]).optional(),
        offeredPrice: z.number().int().nonnegative().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.updateQuote(input.id, { status: input.status, offeredPrice: input.offeredPrice });
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteQuote(input.id);
        return { success: true } as const;
      }),
  }),

  repairs: router({
    list: adminProcedure.query(async () => db.listRepairs()),
    create: publicProcedure
      .input(z.object({
        customerName: z.string().trim().min(2).max(80),
        phone: z.string().trim().min(8).max(24),
        email: z.string().trim().max(320).optional(),
        deviceType: z.string().trim().min(2).max(60),
        model: z.string().trim().min(2).max(160),
        branch: z.enum(["RT Nagar", "Yeshwanthpur", "Ganganagar"]),
        issue: z.string().trim().min(2).max(1000),
      }))
      .mutation(async ({ input }) => {
        return db.createRepair({
          customerName: input.customerName,
          phone: input.phone,
          email: input.email || null,
          deviceType: input.deviceType,
          model: input.model,
          branch: input.branch,
          issue: input.issue,
        });
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["received", "diagnosing", "in_repair", "ready", "completed", "cancelled"]).optional(),
        estimatedCost: z.number().int().nonnegative().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.updateRepair(input.id, { status: input.status, estimatedCost: input.estimatedCost });
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await db.deleteRepair(input.id);
        return { success: true } as const;
      }),
  }),

  ai: router({
    describeProduct: adminProcedure
      .input(z.object({
        name: z.string().min(2).max(120),
        spec: z.string().min(2).max(240),
        category: z.string().min(2).max(40),
        branch: z.string().min(2).max(40),
      }))
      .mutation(async ({ input }) => {
        const parts = input.name.trim().split(/\s+/);
        const deviceBrand = parts[0] || input.category;
        const deviceModel = parts.slice(1).join(" ") || input.name;
        const specParts = input.spec.split(/[·•]/).map(s => s.trim()).filter(Boolean);
        const conditionScore = specParts[2] || "Excellent";
        const { cleanCopy, whatsappUrl } = await generateCleanDeviceCopy({
          deviceBrand,
          deviceModel,
          conditionScore,
          spec: input.spec,
          branch: input.branch,
        });
        return { description: cleanCopy, whatsappUrl };
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
