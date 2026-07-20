import { createApp } from "./app";
import { getEnv } from "./config/env";
import { connectDatabase } from "./db";
import { releaseExpiredReservations } from "./services/reservations";
import { refreshPromotionStates } from "./services/sponsored";

async function main() {
  const env = getEnv();
  await connectDatabase();
  const app = createApp();
  const reservationTimer = setInterval(() => {
    void Promise.all([releaseExpiredReservations(), refreshPromotionStates()]).catch(() => {
      process.stderr.write("ArtDera marketplace maintenance could not complete.\n");
    });
  }, 60_000);
  reservationTimer.unref();
  app.listen(env.API_PORT, "127.0.0.1", () => {
    process.stdout.write(`ArtDera API ready on port ${env.API_PORT}\n`);
  });
}

void main().catch(() => {
  process.stderr.write(
    "ArtDera API startup failed. Check server configuration and database access.\n",
  );
  process.exitCode = 1;
});
