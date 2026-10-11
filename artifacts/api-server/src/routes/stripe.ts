import { Router, type IRouter } from "express";
import { storage } from "../storage.js";
import { stripeService } from "../stripeService.js";

const router: IRouter = Router();

// GET /api/stripe/products-with-prices — public
router.get("/stripe/products-with-prices", async (_req, res) => {
  try {
    const rows = await storage.listProductsWithPrices();
    const productsMap = new Map<string, {
      id: string;
      name: string;
      description: string | null;
      active: boolean;
      metadata: Record<string, string> | null;
      prices: Array<{
        id: string;
        unit_amount: number;
        currency: string;
        recurring: { interval: string; interval_count: number } | null;
      }>;
    }>();

    for (const row of rows) {
      if (!productsMap.has(row.product_id as string)) {
        productsMap.set(row.product_id as string, {
          id: row.product_id as string,
          name: row.product_name as string,
          description: row.product_description as string | null,
          active: row.product_active as boolean,
          metadata: row.product_metadata as Record<string, string> | null,
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id as string)!.prices.push({
          id: row.price_id as string,
          unit_amount: row.unit_amount as number,
          currency: row.currency as string,
          recurring: row.recurring as { interval: string; interval_count: number } | null,
        });
      }
    }
    res.json({ data: Array.from(productsMap.values()) });
  } catch (err) {
    console.error("GET /stripe/products-with-prices error:", err);
    res.status(500).json({ error: "Failed to load products" });
  }
});

// POST /api/stripe/checkout
// body: { priceId: string, email: string, successUrl: string, cancelUrl: string }
router.post("/stripe/checkout", async (req, res) => {
  try {
    const { priceId, email, successUrl, cancelUrl } = req.body as {
      priceId: string;
      email: string;
      successUrl: string;
      cancelUrl: string;
    };

    if (!priceId || !email || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: "priceId, email, successUrl and cancelUrl are required" });
    }

    const customerId = await stripeService.findOrCreateCustomer(email);
    const session = await stripeService.createCheckoutSession(
      customerId,
      priceId,
      successUrl,
      cancelUrl,
    );

    return res.json({ url: session.url });
  } catch (err) {
    console.error("POST /stripe/checkout error:", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /api/stripe/portal
// body: { email: string, returnUrl: string }
router.post("/stripe/portal", async (req, res) => {
  try {
    const { email, returnUrl } = req.body as {
      email: string;
      returnUrl: string;
    };

    if (!email || !returnUrl) {
      return res.status(400).json({ error: "email and returnUrl are required" });
    }

    const customerId = await stripeService.findOrCreateCustomer(email);
    const portalSession = await stripeService.createCustomerPortalSession(
      customerId,
      returnUrl,
    );

    return res.json({ url: portalSession.url });
  } catch (err) {
    console.error("POST /stripe/portal error:", err);
    return res.status(500).json({ error: "Failed to create portal session" });
  }
});

// GET /api/stripe/subscription?email=...
router.get("/stripe/subscription", async (req, res) => {
  try {
    const { email } = req.query as { email?: string };
    if (!email) {
      return res.status(400).json({ error: "email query parameter required" });
    }

    const customer = await storage.getCustomerByEmail(email);
    if (!customer) {
      return res.json({ subscription: null });
    }

    const subscription = await storage.getActiveSubscriptionForCustomer(
      customer.id as string,
    );
    return res.json({ subscription: subscription ?? null });
  } catch (err) {
    console.error("GET /stripe/subscription error:", err);
    return res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

export default router;
