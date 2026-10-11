import { db, users } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export class Storage {
  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`,
    );
    return result.rows[0] ?? null;
  }

  async listProductsWithPrices() {
    const result = await db.execute(sql`
      WITH paginated_products AS (
        SELECT id, name, description, metadata, active
        FROM stripe.products
        WHERE active = true
        ORDER BY created DESC
      )
      SELECT
        p.id           AS product_id,
        p.name         AS product_name,
        p.description  AS product_description,
        p.active       AS product_active,
        p.metadata     AS product_metadata,
        pr.id          AS price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active      AS price_active,
        pr.metadata    AS price_metadata
      FROM paginated_products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      ORDER BY p.created DESC, pr.unit_amount
    `);
    return result.rows;
  }

  async getPricesForProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true ORDER BY unit_amount`,
    );
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`,
    );
    return result.rows[0] ?? null;
  }

  async getCustomerByEmail(email: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.customers WHERE email = ${email} AND deleted IS NOT TRUE LIMIT 1`,
    );
    return result.rows[0] ?? null;
  }

  async getActiveSubscriptionForCustomer(customerId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE customer = ${customerId} AND status IN ('active','trialing','past_due') LIMIT 1`,
    );
    return result.rows[0] ?? null;
  }

  async getUserByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user ?? null;
  }

  async upsertUserByEmail(
    email: string,
    stripeCustomerId: string,
  ) {
    const existing = await this.getUserByEmail(email);
    if (existing) {
      const [updated] = await db
        .update(users)
        .set({ stripeCustomerId })
        .where(eq(users.email, email))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(users)
      .values({ id: crypto.randomUUID(), email, stripeCustomerId })
      .returning();
    return created;
  }
}

export const storage = new Storage();
