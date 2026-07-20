import { getEnv } from "../config/env";
import { connectDatabase, disconnectDatabase } from "../db";
import { seedDemoData, seedPlansAndTaxonomy } from "./seed-data";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for demo seeding`);
  return value;
}

async function main() {
  const env = getEnv();
  await connectDatabase();
  await seedPlansAndTaxonomy();
  if (env.SEED_DEMO_DATA) {
    if (env.NODE_ENV === "production") throw new Error("Demo data seeding is disabled in production");
    await seedDemoData({
      artist: { email: required("DEMO_ARTIST_EMAIL"), password: required("DEMO_ARTIST_PASSWORD") },
      gallery: { email: required("DEMO_GALLERY_EMAIL"), password: required("DEMO_GALLERY_PASSWORD") },
      buyer: { email: required("DEMO_BUYER_EMAIL"), password: required("DEMO_BUYER_PASSWORD") },
      admin: { email: required("DEMO_ADMIN_EMAIL"), password: required("DEMO_ADMIN_PASSWORD") },
    });
  }
  process.stdout.write("ArtDera seed completed.\n");
  await disconnectDatabase();
}

void main().catch(async () => {
  process.stderr.write("ArtDera seed failed. Check configuration and required demo credentials.\n");
  await disconnectDatabase();
  process.exitCode = 1;
});
