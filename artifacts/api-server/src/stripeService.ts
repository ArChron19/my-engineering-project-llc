import { storage } from "./storage.js";
import { getUncachableStripeClient } from "./stripeClient.js";

export class StripeService {
  async findOrCreateCustomer(email: string) {
    const stripe = await getUncachableStripeClient();

    // Check our users table first
    const user = await storage.getUserByEmail(email);
    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Check Stripe's own customer records by email
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      const customerId = existing.data[0].id;
      await storage.upsertUserByEmail(email, customerId);
      return customerId;
    }

    // Create new customer
    const customer = await stripe.customers.create({ email });
    await storage.upsertUserByEmail(email, customer.id);
    return customer.id;
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const stripe = await getUncachableStripeClient();
    return stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }
}

export const stripeService = new StripeService();
