import express, { type Express } from "express";
import cors from "cors";
import router from "./routes/index.js";
import { WebhookHandlers } from "./webhookHandlers.js";

const app: Express = express();

// Stripe webhook MUST be registered BEFORE express.json() so the body
// arrives as a raw Buffer (required for signature verification).
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature" });
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      return res.status(200).json({ received: true });
    } catch (err: unknown) {
      console.error("Webhook error:", err);
      return res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
