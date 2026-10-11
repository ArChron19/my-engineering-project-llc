import { getUncachableStripeClient } from "./stripeClient.js";

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  console.log("Checking for existing selectNsolve products...");

  // ─── selectNsolve Pro™ ──────────────────────────────────────────────────────
  const existingPro = await stripe.products.search({
    query: "name:'selectNsolve Pro' AND active:'true'",
  });

  if (existingPro.data.length > 0) {
    console.log("selectNsolve Pro already exists:", existingPro.data[0].id);
  } else {
    const pro = await stripe.products.create({
      name: "selectNsolve Pro",
      description:
        "AI-managed multi-variable equation solving. Up to 30 variables simultaneously — no manual intervention required.",
      metadata: { tier: "pro", slug: "selectnsolve-pro" },
    });
    console.log("Created selectNsolve Pro:", pro.id);

    const proMonthly = await stripe.prices.create({
      product: pro.id,
      unit_amount: 799,
      currency: "usd",
      recurring: { interval: "month" },
      nickname: "Pro Monthly",
      metadata: { billing: "monthly" },
    });
    console.log("  Monthly price ($7.99/mo):", proMonthly.id);

    const proYearly = await stripe.prices.create({
      product: pro.id,
      unit_amount: 5900,
      currency: "usd",
      recurring: { interval: "year" },
      nickname: "Pro Annual",
      metadata: { billing: "annual" },
    });
    console.log("  Annual price ($59/yr):", proYearly.id);
  }

  // ─── selectNsolve Classroom™ ────────────────────────────────────────────────
  const existingClassroom = await stripe.products.search({
    query: "name:'selectNsolve Classroom' AND active:'true'",
  });

  if (existingClassroom.data.length > 0) {
    console.log(
      "selectNsolve Classroom already exists:",
      existingClassroom.data[0].id,
    );
  } else {
    const classroom = await stripe.products.create({
      name: "selectNsolve Classroom",
      description:
        "35 student seats, shared libraries, instructor dashboard, and dedicated onboarding for educators.",
      metadata: { tier: "classroom", slug: "selectnsolve-classroom" },
    });
    console.log("Created selectNsolve Classroom:", classroom.id);

    const classroomAnnual = await stripe.prices.create({
      product: classroom.id,
      unit_amount: 17900,
      currency: "usd",
      recurring: { interval: "year" },
      nickname: "Classroom Annual",
      metadata: { billing: "annual" },
    });
    console.log("  Annual price ($179/yr):", classroomAnnual.id);
  }

  console.log("\nDone. Webhooks will sync products to the database automatically.");
}

seedProducts().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
