import mongoose from "mongoose";
import { User, Category, Product } from "@/db/schema";

const TEST_DB_URI =
  process.env.TEST_MONGODB_URI ||
  "mongodb://127.0.0.1:27017/ai_inventory_test";

/**
 * Connects to the local test MongoDB database.
 */
export async function startInMemoryMongo(): Promise<void> {
  // Already connected — nothing to do
  if (mongoose.connection.readyState === 1) return;

  // Reset the Next.js mongoose singleton cache so it re-connects to the test database
  if ((global as Record<string, unknown>).mongooseCache) {
    (global as Record<string, unknown>).mongooseCache = undefined;
  }

  await mongoose.connect(TEST_DB_URI, { bufferCommands: false });
  await Promise.all([User.init(), Category.init(), Product.init()]);
}

/**
 * Closes the mongoose connection after a test suite.
 */
export async function stopInMemoryMongo(): Promise<void> {
  // Keep connection open across test files in the shared worker.
}

/**
 * Wipes all collections between tests for full isolation.
 */
export async function clearDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

