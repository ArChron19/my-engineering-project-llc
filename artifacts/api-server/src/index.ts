import app from "./app.js";
import { startScheduler as startSeoReportScheduler } from "./lib/seoReport.js";
import { startPostDeployPing } from "./lib/sitemapPing.js";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("[stripe] DATABASE_URL not set — skipping Stripe init.");
    return;
  }

  try {
    console.log("[stripe] Initializing Stripe schema...");
    await runMigrations({ databaseUrl });
    console.log("[stripe] Schema ready");

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
    );
    console.log("[stripe] Webhook configured");

    stripeSync.syncBackfill()
      .then(() => console.log("[stripe] Data synced"))
      .catch((err: unknown) => console.error("[stripe] Backfill error:", err));
  } catch (error) {
    console.error("[stripe] Init failed (Stripe routes will be unavailable):", error);
  }
}

// Run Stripe init in background — server starts regardless
initStripe();

startSeoReportScheduler();
startPostDeployPing();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
