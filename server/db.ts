import mongoose from "mongoose";
import { getEnv } from "./config/env";

declare global {
  // eslint-disable-next-line no-var
  var __artderaMongoose: { connection: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cache = globalThis.__artderaMongoose ?? { connection: null, promise: null };
globalThis.__artderaMongoose = cache;

export async function connectDatabase() {
  if (cache.connection && mongoose.connection.readyState === 1) return cache.connection;
  if (!cache.promise) {
    const env = getEnv();
    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB_NAME,
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 20,
        minPoolSize: env.NODE_ENV === "production" ? 2 : 0,
        sanitizeFilter: true,
      })
      .catch((error) => {
        cache.promise = null;
        throw error;
      });
  }
  cache.connection = await cache.promise;
  return cache.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  cache.connection = null;
  cache.promise = null;
}
