import { afterAll, beforeAll, beforeEach } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

let replicaSet: MongoMemoryReplSet;

process.env.NODE_ENV = "test";
process.env.AUTH_SECRET = "artdera-test-secret-that-is-longer-than-thirty-two-characters";
process.env.APP_URL = "http://localhost:3000";
process.env.API_PORT = "3001";
process.env.DEMO_PAYMENT_MODE = "true";
process.env.PAYMENT_PROVIDER = "demo";
process.env.DEMO_OTP_MODE = "true";
process.env.DEMO_OTP_CODE = "123456";
process.env.UPLOAD_PROVIDER = "local";
process.env.UPLOAD_DIR = "test-uploads";
process.env.SEED_DEMO_DATA = "false";

beforeAll(async () => {
  replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.MONGODB_URI = replicaSet.getUri();
  process.env.MONGODB_DB_NAME = "artdera_test";
  const { resetEnvForTests } = await import("../server/config/env");
  resetEnvForTests();
  const { connectDatabase } = await import("../server/db");
  await connectDatabase();
}, 120_000);

beforeEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));
  const { seedPlansAndTaxonomy } = await import("../server/scripts/seed-data");
  await seedPlansAndTaxonomy();
});

afterAll(async () => {
  const { disconnectDatabase } = await import("../server/db");
  await disconnectDatabase();
  if (replicaSet) await replicaSet.stop();
});
