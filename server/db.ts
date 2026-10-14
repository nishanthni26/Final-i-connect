import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertOrder, InsertProduct, InsertUser, Order, orders, Product, products, StoreMedia, storeMedia, User, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let db: any;
try {
  if (process.env.DATABASE_URL) {
    db = drizzle(process.env.DATABASE_URL);
    _db = db;
  } else {
    throw new Error("No DATABASE_URL configured");
  }
} catch {
  console.warn("[AI Studio] Database not connected — using mock");
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };
  db = new Proxy(
    {},
    {
      get: (_, prop) =>
        prop === "query"
          ? new Proxy({}, { get: () => noOp })
          : async () => [],
    }
  );
}
export { db };

// In-memory fallback store when MySQL is unavailable
import { scryptSync } from "node:crypto";

export type SellQuote = {
  id: number;
  quoteNumber: string;
  customerName: string;
  phone: string;
  deviceModel: string;
  condition: "Like new" | "Good" | "Needs repair";
  branch: "RT Nagar" | "Yeshwanthpur" | "Ganganagar";
  notes: string;
  offeredPrice: number | null;
  status: "new" | "quoted" | "accepted" | "completed" | "declined";
  createdAt: Date;
};

export type RepairTicket = {
  id: number;
  ticketNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  deviceType: string;
  model: string;
  branch: "RT Nagar" | "Yeshwanthpur" | "Ganganagar";
  issue: string;
  estimatedCost: number | null;
  status: "received" | "diagnosing" | "in_repair" | "ready" | "completed" | "cancelled";
  createdAt: Date;
};

const memoryUsers = new Map<string, User>();
const memoryProducts = new Map<number, Product>();
const memoryOrders = new Map<number, Order>();
const memoryQuotes = new Map<number, SellQuote>();
const memoryRepairs = new Map<number, RepairTicket>();
let memoryStoreVideo: StoreMedia | null = null;
let nextUserId = 1;
let nextProductId = 1;
let nextOrderId = 1;
let nextQuoteId = 1;
let nextRepairId = 1;

function seedInitialData() {
  const adminSalt = "iconnectadminsalt";
  const adminHash = scryptSync("admin1234", adminSalt, 64).toString("hex");
  const now = new Date();
  const adminUser: User = {
    id: nextUserId++,
    openId: "local:admin@iconnectblr.com",
    name: "iConnect BLR Admin",
    email: "admin@iconnectblr.com",
    passwordHash: `${adminSalt}:${adminHash}`,
    loginMethod: "password",
    role: "admin",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
  memoryUsers.set(adminUser.openId, adminUser);

  const initialProducts: Array<Omit<Product, "id" | "createdBy" | "createdAt">> = [
    {
      name: "iPhone 13",
      spec: "128GB · Midnight · Excellent",
      price: 32990,
      wasPrice: 37990,
      tag: "RT Nagar",
      image: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/hARVVZXMDeRsRHJf7qX5xW.jpg",
      category: "iPhone",
      stock: "2 units at RT Nagar",
      description: "Finished in deep Midnight with 128GB storage, this iPhone 13 features an untouched Super Retina XDR panel, responsive Face ID, and strong battery health. Drop by our RT Nagar counter to test it hands-on or trade in your old phone on the spot.",
    },
    {
      name: "Samsung S23",
      spec: "256GB · Green · Like new",
      price: 27990,
      wasPrice: 32990,
      tag: "Yeshwanthpur",
      image: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/QnDuQcixwAeWSV4C6efJxb.jpg",
      category: "Samsung",
      stock: "In store · Yeshwanthpur",
      description: "Powered by the Snapdragon 8 Gen 2 chip with 256GB onboard memory, this Botanic Green Galaxy S23 delivers flagship night photography and a 120Hz AMOLED screen. Ready for walk-in purchase or exchange at our Yeshwanthpur hub.",
    },
    {
      name: "Google Pixel 7",
      spec: "128GB · Snow · Excellent",
      price: 18990,
      wasPrice: 21990,
      tag: "Ganganagar",
      image: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/hARVVZXMDeRsRHJf7qX5xW.jpg",
      category: "Android",
      stock: "In store · Ganganagar",
      description: "Experience pure Android and Google Tensor G2 computational photography in a crisp Snow finish. Hardware-cleared across cameras, haptics, and cellular bands—available for immediate pickup or upgrade credit at Ganganagar.",
    },
    {
      name: "MacBook Air M1",
      spec: "8GB · 256GB SSD · 2020",
      price: 49990,
      wasPrice: 56990,
      tag: "RT Nagar",
      image: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/F4wCRumpvJMb9Mwu2DD82a.jpg",
      category: "Laptops",
      stock: "1 unit at RT Nagar",
      description: "Silent fanless performance meets all-day battery life in this Apple M1 MacBook Air (8GB RAM, 256GB SSD). Includes a low cycle count battery, flawless keyboard deck, and original USB-C power adapter at our RT Nagar showroom.",
    },
    {
      name: "iPhone 12",
      spec: "64GB · Blue · Very good",
      price: 23990,
      wasPrice: 27990,
      tag: "Yeshwanthpur",
      image: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/hARVVZXMDeRsRHJf7qX5xW.jpg",
      category: "iPhone",
      stock: "Available · Yeshwanthpur",
      description: "An approachable entry into Apple's 5G OLED lineup in vibrant Blue. Cleared for True Tone display accuracy, speaker clarity, and MagSafe charging—bring your current handset to Yeshwanthpur for an instant upgrade deduction.",
    },
    {
      name: "OnePlus 11",
      spec: "256GB · Titan Black · Like new",
      price: 24990,
      wasPrice: 29990,
      tag: "Ganganagar",
      image: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/QnDuQcixwAeWSV4C6efJxb.jpg",
      category: "Android",
      stock: "Available · Ganganagar",
      description: "Built for speed with 256GB UFS 4.0 storage, Hasselblad triple cameras, and ultra-fast SuperVOOC charging in matte Titan Black. Inspect it live at our Ganganagar desk or request a real-time video walkthrough on WhatsApp.",
    },
    {
      name: "iPad Air 4",
      spec: "64GB · Wi‑Fi · Sky Blue",
      price: 29990,
      wasPrice: 34990,
      tag: "RT Nagar",
      image: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/F4wCRumpvJMb9Mwu2DD82a.jpg",
      category: "Tablets",
      stock: "3 units at RT Nagar",
      description: "Slim 10.9-inch Liquid Retina tablet in Sky Blue with Touch ID integrated into the top button and Apple Pencil (2nd gen) support. Ideal for note-taking, media, and creative workflows—backed by our 6-month store warranty.",
    },
    {
      name: "Galaxy Watch 5",
      spec: "44mm · Bluetooth · Graphite",
      price: 12990,
      wasPrice: 16990,
      tag: "Yeshwanthpur",
      image: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/QnDuQcixwAeWSV4C6efJxb.jpg",
      category: "Wearables",
      stock: "In store · Yeshwanthpur",
      description: "Crafted with scratch-resistant Sapphire Crystal glass and BioActive health sensors in a 44mm Graphite case. Includes wireless fast-charging puck and verified battery endurance at our Yeshwanthpur branch.",
    },
    {
      name: "Apple 20W USB-C Power Adapter & Cable",
      spec: "Original Fast Charger · USB-C to Lightning / C",
      price: 1690,
      wasPrice: 2490,
      tag: "RT Nagar",
      image: "/images/iphone-18-pro-lineup.jpg",
      category: "Accessories",
      stock: "All 3 Branches",
      description: "Safeguard your iPhone's battery health with an authentic 20W USB-C PD wall adapter paired with a durable fast-charge cable. Delivers 50% charge in roughly 30 minutes without overheating.",
    },
    {
      name: "20000mAh PD Fast Power Bank & Protection Kit",
      spec: "22.5W Two-Way Fast Charge · MagSafe Case & 9H Glass",
      price: 1990,
      wasPrice: 2990,
      tag: "RT Nagar",
      image: "https://files.manuscdn.com/search-media/310519663933648094/Et6LyycN5iP9ToYjJFtwzB/hARVVZXMDeRsRHJf7qX5xW.jpg",
      category: "Accessories",
      stock: "All 3 Branches",
      description: "Complete daily protection and travel power bundle: a airline-safe 20000mAh PD power bank, shock-absorbent MagSafe case, and oleophobic 9H tempered glass installed free at the counter.",
    },
  ];

  for (const item of initialProducts) {
    const id = nextProductId++;
    memoryProducts.set(id, {
      id,
      ...item,
      createdBy: 1,
      createdAt: new Date(Date.now() - (9 - id) * 3600_000),
    });
  }

  const initialOrders: Array<Omit<Order, "id">> = [
    {
      orderNumber: "IC-BLR9042A1",
      customerName: "Karthik Gowda",
      phone: "9845011223",
      email: "karthik.g@gmail.com",
      branch: "RT Nagar",
      items: JSON.stringify([{ id: 1, name: "iPhone 13", spec: "128GB · Midnight · Excellent", price: 32990 }]),
      total: 32990,
      status: "pending",
      createdAt: new Date(Date.now() - 1000 * 60 * 35),
    },
    {
      orderNumber: "IC-BLR7821B9",
      customerName: "Ananya Hegde",
      phone: "9900144556",
      email: "ananya.h@outlook.com",
      branch: "Yeshwanthpur",
      items: JSON.stringify([{ id: 2, name: "Samsung S23", spec: "256GB · Green · Like new", price: 27990 }]),
      total: 27990,
      status: "confirmed",
      createdAt: new Date(Date.now() - 1000 * 60 * 140),
    },
    {
      orderNumber: "IC-BLR5510C4",
      customerName: "Rohan Deshpande",
      phone: "9731288990",
      email: "rohan.d@gmail.com",
      branch: "Ganganagar",
      items: JSON.stringify([
        { id: 3, name: "Google Pixel 7", spec: "128GB · Snow · Excellent", price: 18990 },
        { id: 8, name: "Galaxy Watch 5", spec: "44mm · Bluetooth · Graphite", price: 12990 },
      ]),
      total: 31980,
      status: "ready",
      createdAt: new Date(Date.now() - 1000 * 60 * 320),
    },
    {
      orderNumber: "IC-BLR3198D2",
      customerName: "Meghana Murthy",
      phone: "9611477882",
      email: "meghana@yahoo.com",
      branch: "RT Nagar",
      items: JSON.stringify([{ id: 4, name: "MacBook Air M1", spec: "8GB · 256GB SSD · 2020", price: 49990 }]),
      total: 49990,
      status: "paid",
      createdAt: new Date(Date.now() - 1000 * 60 * 960),
    },
  ];

  for (const ord of initialOrders) {
    const id = nextOrderId++;
    memoryOrders.set(id, { id, ...ord });
  }

  const initialQuotes: Array<Omit<SellQuote, "id">> = [
    {
      quoteNumber: "QT-8821",
      customerName: "Vikram Nair",
      phone: "9880123456",
      deviceModel: "iPhone 14 Pro 256GB (Deep Purple)",
      condition: "Like new",
      branch: "RT Nagar",
      notes: "89% battery health, original box and cable included, zero scratches.",
      offeredPrice: 58500,
      status: "quoted",
      createdAt: new Date(Date.now() - 1000 * 60 * 50),
    },
    {
      quoteNumber: "QT-8822",
      customerName: "Sneha Kulkarni",
      phone: "9740987654",
      deviceModel: "Samsung Galaxy S22 Ultra 256GB",
      condition: "Good",
      branch: "Yeshwanthpur",
      notes: "Looking to exchange for iPhone 15 Pro. Minor wear on frame.",
      offeredPrice: null,
      status: "new",
      createdAt: new Date(Date.now() - 1000 * 60 * 22),
    },
    {
      quoteNumber: "QT-8823",
      customerName: "Darshan Raj",
      phone: "9986543210",
      deviceModel: "iPad Pro M1 11-inch 128GB Wi-Fi",
      condition: "Like new",
      branch: "Ganganagar",
      notes: "Under warranty till next month, bill available.",
      offeredPrice: 41000,
      status: "accepted",
      createdAt: new Date(Date.now() - 1000 * 60 * 290),
    },
  ];

  for (const qt of initialQuotes) {
    const id = nextQuoteId++;
    memoryQuotes.set(id, { id, ...qt });
  }

  const initialRepairs: Array<Omit<RepairTicket, "id">> = [
    {
      ticketNumber: "RP-4011",
      customerName: "Priya Sharma",
      phone: "9845900112",
      email: "priya.s@gmail.com",
      deviceType: "Smartphone",
      model: "iPhone 13 Pro",
      branch: "RT Nagar",
      issue: "Front OLED glass cracked near bottom corner, touch working normally.",
      estimatedCost: 8490,
      status: "in_repair",
      createdAt: new Date(Date.now() - 1000 * 60 * 75),
    },
    {
      ticketNumber: "RP-4012",
      customerName: "Nikhil Kamath",
      phone: "9632145678",
      email: "nikhil@gmail.com",
      deviceType: "Laptop",
      model: "MacBook Pro 14 M1 Pro",
      branch: "Yeshwanthpur",
      issue: "Battery service recommended warning & USB-C port loose.",
      estimatedCost: 9800,
      status: "diagnosing",
      createdAt: new Date(Date.now() - 1000 * 60 * 40),
    },
    {
      ticketNumber: "RP-4013",
      customerName: "Ayesha Khan",
      phone: "9108234567",
      email: null,
      deviceType: "Smartphone",
      model: "Samsung Galaxy S23 Ultra",
      branch: "Ganganagar",
      issue: "Charging port cleaning and fast-charging IC check.",
      estimatedCost: 1850,
      status: "ready",
      createdAt: new Date(Date.now() - 1000 * 60 * 210),
    },
  ];

  for (const rp of initialRepairs) {
    const id = nextRepairId++;
    memoryRepairs.set(id, { id, ...rp });
  }
}

seedInitialData();

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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

  const dbConn = await getDb();
  if (!dbConn) {
    const existing = memoryUsers.get(user.openId);
    const now = new Date();
    const record: User = {
      id: existing?.id ?? nextUserId++,
      openId: user.openId,
      name: user.name !== undefined ? (user.name ?? null) : (existing?.name ?? null),
      email: user.email !== undefined ? (user.email ?? null) : (existing?.email ?? null),
      passwordHash: user.passwordHash !== undefined ? (user.passwordHash ?? null) : (existing?.passwordHash ?? null),
      loginMethod: user.loginMethod !== undefined ? (user.loginMethod ?? null) : (existing?.loginMethod ?? null),
      role: user.role ?? existing?.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    };
    memoryUsers.set(user.openId, record);
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
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

    await dbConn.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const dbConn = await getDb();
  if (!dbConn) {
    return memoryUsers.get(openId);
  }

  try {
    const result = await dbConn.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch {
    return memoryUsers.get(openId);
  }
}

export async function getUserByEmail(email: string) {
  const normalized = email.toLowerCase().trim();
  const dbConn = await getDb();
  if (!dbConn) {
    for (const u of memoryUsers.values()) {
      if (u.email?.toLowerCase() === normalized) return u;
    }
    return undefined;
  }
  try {
    const result = await dbConn.select().from(users).where(eq(users.email, normalized)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch {
    for (const u of memoryUsers.values()) {
      if (u.email?.toLowerCase() === normalized) return u;
    }
    return undefined;
  }
}

export async function createLocalUser(input: { email: string; name: string; passwordHash: string }) {
  const email = input.email.toLowerCase().trim();
  const openId = `local:${email}`;
  const dbConn = await getDb();
  if (!dbConn) {
    const now = new Date();
    const user: User = {
      id: nextUserId++,
      openId,
      email,
      name: input.name,
      passwordHash: input.passwordHash,
      loginMethod: "password",
      role: email.includes("admin") ? "admin" : "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
    memoryUsers.set(openId, user);
    return user;
  }
  await dbConn.insert(users).values({ openId, email, name: input.name, passwordHash: input.passwordHash, loginMethod: "password" });
  return getUserByOpenId(openId);
}

export async function listProducts() {
  const dbConn = await getDb();
  if (!dbConn) return Array.from(memoryProducts.values());
  try {
    return await dbConn.select().from(products).orderBy(products.createdAt);
  } catch {
    return Array.from(memoryProducts.values());
  }
}

export async function createProduct(input: InsertProduct) {
  const dbConn = await getDb();
  if (!dbConn) {
    const id = nextProductId++;
    const created: Product = {
      id,
      name: input.name,
      spec: input.spec,
      price: input.price,
      wasPrice: input.wasPrice,
      tag: input.tag,
      image: input.image,
      category: input.category,
      stock: input.stock,
      description: input.description ?? null,
      createdBy: input.createdBy,
      createdAt: new Date(),
    };
    memoryProducts.set(id, created);
    return created;
  }
  const result = await dbConn.insert(products).values(input);
  const id = Number(result[0].insertId);
  const created = await dbConn.select().from(products).where(eq(products.id, id)).limit(1);
  return created[0];
}

export async function updateProduct(id: number, input: Pick<InsertProduct, "name" | "spec" | "price" | "wasPrice" | "tag" | "image" | "category" | "stock" | "description">) {
  const dbConn = await getDb();
  if (!dbConn) {
    const existing = memoryProducts.get(id);
    if (!existing) throw new Error("Product not found");
    const updated: Product = {
      ...existing,
      ...input,
      description: input.description ?? null,
    };
    memoryProducts.set(id, updated);
    return updated;
  }
  await dbConn.update(products).set(input).where(eq(products.id, id));
  const result = await dbConn.select().from(products).where(eq(products.id, id)).limit(1);
  if (!result[0]) throw new Error("Product not found");
  return result[0];
}

export async function deleteProduct(id: number) {
  const dbConn = await getDb();
  if (!dbConn) {
    memoryProducts.delete(id);
    return;
  }
  await dbConn.delete(products).where(eq(products.id, id));
}

export async function createOrder(input: InsertOrder) {
  const dbConn = await getDb();
  if (!dbConn) {
    const id = nextOrderId++;
    const created: Order = {
      id,
      orderNumber: input.orderNumber,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email ?? null,
      branch: input.branch,
      items: input.items,
      total: input.total,
      status: input.status ?? "pending",
      createdAt: new Date(),
    };
    memoryOrders.set(id, created);
    return created;
  }
  const result = await dbConn.insert(orders).values(input);
  const id = Number(result[0].insertId);
  const created = await dbConn.select().from(orders).where(eq(orders.id, id)).limit(1);
  return created[0];
}

export async function listOrders() {
  const dbConn = await getDb();
  if (!dbConn) {
    return Array.from(memoryOrders.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  try {
    return await dbConn.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
  } catch {
    return Array.from(memoryOrders.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export async function getOrderByNumberAndPhone(orderNumber: string, phone: string) {
  const dbConn = await getDb();
  if (!dbConn) {
    for (const order of memoryOrders.values()) {
      if (order.orderNumber === orderNumber && order.phone === phone) {
        return {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          phone: order.phone,
          branch: order.branch,
          items: order.items,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
        };
      }
    }
    return null;
  }
  try {
    const result = await dbConn.select({ orderNumber: orders.orderNumber, customerName: orders.customerName, phone: orders.phone, branch: orders.branch, items: orders.items, total: orders.total, status: orders.status, createdAt: orders.createdAt }).from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    const order = result[0];
    if (!order || order.phone !== phone) return null;
    return order;
  } catch {
    return null;
  }
}

export async function updateOrderStatus(id: number, status: Order["status"]) {
  const dbConn = await getDb();
  if (!dbConn) {
    const existing = memoryOrders.get(id);
    if (existing) {
      memoryOrders.set(id, { ...existing, status });
    }
    return;
  }
  await dbConn.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function getStoreVideo() {
  const dbConn = await getDb();
  if (!dbConn) return memoryStoreVideo;
  try {
    const result = await dbConn.select().from(storeMedia).where(eq(storeMedia.id, 1)).limit(1);
    return result[0] ?? null;
  } catch {
    return memoryStoreVideo;
  }
}

export async function saveStoreVideo(input: Pick<StoreMedia, "videoUrl" | "videoType" | "fileName">) {
  const dbConn = await getDb();
  if (!dbConn) {
    memoryStoreVideo = {
      id: 1,
      ...input,
      updatedAt: new Date(),
    };
    return memoryStoreVideo;
  }
  await dbConn.insert(storeMedia).values({ id: 1, ...input }).onDuplicateKeyUpdate({
    set: { ...input, updatedAt: new Date() },
  });
  return getStoreVideo();
}

export async function clearStoreVideo() {
  memoryStoreVideo = null;
  const dbConn = await getDb();
  if (dbConn) {
    try {
      await dbConn.delete(storeMedia).where(eq(storeMedia.id, 1));
    } catch {
      // ignore if table empty
    }
  }
}

export async function deleteOrder(id: number) {
  memoryOrders.delete(id);
  const dbConn = await getDb();
  if (dbConn) {
    try {
      await dbConn.delete(orders).where(eq(orders.id, id));
    } catch {
      // ignore
    }
  }
}

export async function listQuotes(): Promise<SellQuote[]> {
  return Array.from(memoryQuotes.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createQuote(input: {
  customerName: string;
  phone: string;
  deviceModel: string;
  condition: "Like new" | "Good" | "Needs repair";
  branch: "RT Nagar" | "Yeshwanthpur" | "Ganganagar";
  notes: string;
}): Promise<SellQuote> {
  const id = nextQuoteId++;
  const quote: SellQuote = {
    id,
    quoteNumber: `QT-${8820 + id}`,
    customerName: input.customerName,
    phone: input.phone.replace(/\D/g, ""),
    deviceModel: input.deviceModel,
    condition: input.condition,
    branch: input.branch,
    notes: input.notes,
    offeredPrice: null,
    status: "new",
    createdAt: new Date(),
  };
  memoryQuotes.set(id, quote);
  return quote;
}

export async function updateQuote(id: number, input: { status?: SellQuote["status"]; offeredPrice?: number | null }) {
  const existing = memoryQuotes.get(id);
  if (!existing) throw new Error("Quote not found");
  const updated: SellQuote = {
    ...existing,
    status: input.status ?? existing.status,
    offeredPrice: input.offeredPrice !== undefined ? input.offeredPrice : existing.offeredPrice,
  };
  memoryQuotes.set(id, updated);
  return updated;
}

export async function deleteQuote(id: number) {
  memoryQuotes.delete(id);
}

export async function listRepairs(): Promise<RepairTicket[]> {
  return Array.from(memoryRepairs.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createRepair(input: {
  customerName: string;
  phone: string;
  email?: string | null;
  deviceType: string;
  model: string;
  branch: "RT Nagar" | "Yeshwanthpur" | "Ganganagar";
  issue: string;
}): Promise<RepairTicket> {
  const id = nextRepairId++;
  const ticket: RepairTicket = {
    id,
    ticketNumber: `RP-${4010 + id}`,
    customerName: input.customerName,
    phone: input.phone.replace(/\D/g, ""),
    email: input.email || null,
    deviceType: input.deviceType,
    model: input.model,
    branch: input.branch,
    issue: input.issue,
    estimatedCost: null,
    status: "received",
    createdAt: new Date(),
  };
  memoryRepairs.set(id, ticket);
  return ticket;
}

export async function updateRepair(id: number, input: { status?: RepairTicket["status"]; estimatedCost?: number | null }) {
  const existing = memoryRepairs.get(id);
  if (!existing) throw new Error("Repair ticket not found");
  const updated: RepairTicket = {
    ...existing,
    status: input.status ?? existing.status,
    estimatedCost: input.estimatedCost !== undefined ? input.estimatedCost : existing.estimatedCost,
  };
  memoryRepairs.set(id, updated);
  return updated;
}

export async function deleteRepair(id: number) {
  memoryRepairs.delete(id);
}
