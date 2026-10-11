import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PageWrapper } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, ExternalLink, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string; interval_count: number } | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  metadata: Record<string, string> | null;
  prices: Price[];
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

function tierOrder(name: string) {
  if (name.toLowerCase().includes("pro")) return 0;
  if (name.toLowerCase().includes("classroom")) return 1;
  return 2;
}

export default function Subscribe() {
  const [location] = useLocation();
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : "",
  );
  const isSuccess = params.get("success") === "1";
  const isCancelled = params.get("cancelled") === "1";

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [manageEmail, setManageEmail] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/stripe/products-with-prices`)
      .then((r) => r.json())
      .then((json: { data: Product[] }) => {
        const sorted = (json.data ?? []).sort(
          (a, b) => tierOrder(a.name) - tierOrder(b.name),
        );
        setProducts(sorted);
        if (sorted.length > 0) {
          setSelectedProductId(sorted[0].id);
          const firstPrice = sorted[0].prices.find(
            (p) => p.recurring?.interval === "month",
          ) ?? sorted[0].prices[0];
          if (firstPrice) setSelectedPriceId(firstPrice.id);
        }
      })
      .catch(() => setProductsError("Could not load products. Please try again."))
      .finally(() => setLoadingProducts(false));
  }, [location]);

  function selectProduct(product: Product) {
    setSelectedProductId(product.id);
    const monthly = product.prices.find((p) => p.recurring?.interval === "month");
    setSelectedPriceId((monthly ?? product.prices[0])?.id ?? null);
    setCheckoutError(null);
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPriceId || !email) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const origin = window.location.origin;
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const resp = await fetch(`${base}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedPriceId,
          email,
          successUrl: `${origin}${base}/subscribe?success=1`,
          cancelUrl: `${origin}${base}/subscribe?cancelled=1`,
        }),
      });
      const data = await resp.json() as { url?: string; error?: string };
      if (!resp.ok || data.error) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url!;
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePortal(e: React.FormEvent) {
    e.preventDefault();
    if (!manageEmail) return;
    setPortalLoading(true);
    setPortalError(null);
    try {
      const origin = window.location.origin;
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const resp = await fetch(`${base}/api/stripe/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: manageEmail,
          returnUrl: `${origin}${base}/subscribe`,
        }),
      });
      const data = await resp.json() as { url?: string; error?: string };
      if (!resp.ok || data.error) throw new Error(data.error ?? "Portal error");
      window.location.href = data.url!;
    } catch (err: unknown) {
      setPortalError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPortalLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <PageWrapper>
        <div className="max-w-lg mx-auto text-center space-y-6 py-16">
          <CheckCircle2 size={56} className="text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold font-display text-primary">
            Subscription confirmed!
          </h1>
          <p className="text-muted-foreground text-lg">
            Thank you for subscribing. You'll receive a confirmation email from
            Stripe shortly. Use the manage portal below to view or update your
            subscription at any time.
          </p>
          <Button asChild size="lg" className="bg-primary text-white">
            <a href={`${BASE}/subscribe`}>Back to Subscribe</a>
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-3 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-display text-primary">
            Subscribe to selectNsolve™
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose a plan and enter your email to get started. Powered by Stripe — no
            account required.
          </p>
          {isCancelled && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 inline-block">
              Checkout was cancelled. No charge was made.
            </p>
          )}
        </div>

        {/* Product selection + checkout */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-display">Choose your plan</h2>

          {loadingProducts && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
              Loading plans…
            </div>
          )}

          {productsError && (
            <p className="text-destructive text-sm">{productsError}</p>
          )}

          {!loadingProducts && products.length === 0 && !productsError && (
            <p className="text-muted-foreground text-sm">
              No plans are available yet. Check back soon.
            </p>
          )}

          {products.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {products.map((product) => {
                const isSelected = selectedProductId === product.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectProduct(product)}
                    className={cn(
                      "text-left rounded-2xl border-2 p-5 space-y-3 transition-all focus:outline-none",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-foreground">{product.name}™</p>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mt-1 leading-snug">
                            {product.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 h-5 w-5 rounded-full border-2 flex-shrink-0",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30",
                        )}
                      />
                    </div>

                    {/* Price options */}
                    <div className="flex flex-wrap gap-2">
                      {product.prices.map((price) => {
                        const label =
                          price.recurring?.interval === "month"
                            ? `${formatAmount(price.unit_amount, price.currency)}/mo`
                            : price.recurring?.interval === "year"
                              ? `${formatAmount(price.unit_amount, price.currency)}/yr`
                              : formatAmount(price.unit_amount, price.currency);
                        const isActive = selectedPriceId === price.id && isSelected;
                        return (
                          <button
                            key={price.id}
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setSelectedProductId(product.id);
                              setSelectedPriceId(price.id);
                              setCheckoutError(null);
                            }}
                            className={cn(
                              "text-xs font-semibold px-3 py-1 rounded-full border transition-colors",
                              isActive
                                ? "bg-primary text-white border-primary"
                                : "bg-background border-border text-muted-foreground hover:border-primary/40",
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Email + checkout */}
          {products.length > 0 && (
            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="checkout-email" className="text-sm font-medium">
                  Your email address
                </label>
                <Input
                  id="checkout-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {checkoutError && (
                <p className="text-destructive text-sm">{checkoutError}</p>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={checkoutLoading || !selectedPriceId}
                className="bg-primary text-white gap-2"
              >
                {checkoutLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CreditCard size={16} />
                )}
                {checkoutLoading ? "Redirecting…" : "Subscribe now"}
                <ExternalLink size={14} className="opacity-60" />
              </Button>
              <p className="text-xs text-muted-foreground">
                You'll be redirected to Stripe's secure checkout page. Cancel
                anytime from the customer portal.
              </p>
            </form>
          )}
        </section>

        {/* Divider */}
        <hr className="border-border" />

        {/* Manage subscription */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-muted-foreground" />
            <h2 className="text-2xl font-bold font-display">Manage your subscription</h2>
          </div>
          <p className="text-muted-foreground">
            Already subscribed? Enter the email you used at checkout to open the
            Stripe customer portal — update payment methods, view invoices, or cancel.
          </p>
          <form onSubmit={handlePortal} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="portal-email" className="text-sm font-medium">
                Subscription email address
              </label>
              <Input
                id="portal-email"
                type="email"
                required
                placeholder="you@example.com"
                value={manageEmail}
                onChange={(e) => setManageEmail(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {portalError && (
              <p className="text-destructive text-sm">{portalError}</p>
            )}
            <Button
              type="submit"
              variant="outline"
              size="lg"
              disabled={portalLoading}
              className="gap-2"
            >
              {portalLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ExternalLink size={16} />
              )}
              {portalLoading ? "Opening portal…" : "Open customer portal"}
            </Button>
          </form>
        </section>
      </div>
    </PageWrapper>
  );
}
