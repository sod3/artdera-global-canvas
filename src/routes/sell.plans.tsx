import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronDown, Info, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  annualSavings,
  PLAN_ORDER,
  SUBSCRIPTION_PLANS,
  validBillingCycle,
} from "@/config/subscription-plans";
import { formatPKR } from "@/marketplace/config";
import { SubscriptionService } from "@/marketplace/services";
import type { PlanId } from "@/marketplace/types";

export const Route = createFileRoute("/sell/plans")({
  head: () => ({
    meta: [
      { title: "Seller Subscription Plans — ArtDera" },
      {
        name: "description",
        content: "Compare ArtDera Free, Professional, Pro Plus and Gallery seller plans.",
      },
    ],
  }),
  component: PlansPage,
});

type ComparisonRow = { label: string; values: Record<PlanId, string> };

const planValues = (value: (planId: PlanId) => string): Record<PlanId, string> => ({
  free: value("free"),
  professional: value("professional"),
  "pro-plus": value("pro-plus"),
  gallery: value("gallery"),
});

const comparison: ComparisonRow[] = [
  {
    label: "Monthly price",
    values: planValues((id) => formatPKR(SUBSCRIPTION_PLANS[id].monthlyPrice)),
  },
  {
    label: "Annual price",
    values: planValues((id) =>
      SUBSCRIPTION_PLANS[id].annualPrice ? formatPKR(SUBSCRIPTION_PLANS[id].annualPrice!) : "—",
    ),
  },
  {
    label: "Listing limit",
    values: planValues((id) =>
      SUBSCRIPTION_PLANS[id].listingLimit === null
        ? "Fair-use unlimited"
        : `${SUBSCRIPTION_PLANS[id].listingLimit} active`,
    ),
  },
  { label: "Commission", values: planValues((id) => `${SUBSCRIPTION_PLANS[id].commission}%`) },
  {
    label: "Profile type",
    values: {
      free: "Basic",
      professional: "Professional",
      "pro-plus": "Premium artist",
      gallery: "Gallery storefront",
    },
  },
  {
    label: "Verification",
    values: {
      free: "Review available",
      professional: "Review included",
      "pro-plus": "Review included",
      gallery: "Gallery review",
    },
  },
  {
    label: "Analytics",
    values: {
      free: "Basic",
      professional: "Detailed",
      "pro-plus": "Advanced",
      gallery: "Advanced reports",
    },
  },
  {
    label: "Portfolio link",
    values: { free: "—", professional: "Included", "pro-plus": "Included", gallery: "Included" },
  },
  {
    label: "Store URL",
    values: {
      free: "Standard",
      professional: "Standard",
      "pro-plus": "Premium",
      gallery: "Gallery URL",
    },
  },
  {
    label: "Customer tools",
    values: { free: "—", professional: "—", "pro-plus": "Included", gallery: "CRM included" },
  },
  {
    label: "Gallery tools",
    values: { free: "—", professional: "—", "pro-plus": "—", gallery: "Included" },
  },
  {
    label: "Staff accounts",
    values: { free: "—", professional: "—", "pro-plus": "—", gallery: "3–10" },
  },
  {
    label: "International tools",
    values: { free: "—", professional: "Limited", "pro-plus": "Included", gallery: "Included" },
  },
  {
    label: "Priority support",
    values: { free: "—", professional: "Included", "pro-plus": "Included", gallery: "Included" },
  },
  {
    label: "Payout time",
    values: {
      free: "7–10 working days",
      professional: "5–7 working days",
      "pro-plus": "Priority policy",
      gallery: "Gallery policy",
    },
  },
  {
    label: "Promotion tools",
    values: {
      free: "Included",
      professional: "Included",
      "pro-plus": "Included",
      gallery: "Included",
    },
  },
  {
    label: "Inventory tools",
    values: { free: "—", professional: "—", "pro-plus": "—", gallery: "Included" },
  },
  {
    label: "Reports",
    values: {
      free: "Basic",
      professional: "Detailed",
      "pro-plus": "Advanced",
      gallery: "Gallery reports",
    },
  },
];

function PlansPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [selected, setSelected] = useState<PlanId | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setBilling(SubscriptionService.preferredBilling());
    setSelected(SubscriptionService.getSelection()?.planId ?? null);
    if (new URLSearchParams(window.location.search).has("notice"))
      setNotice("Choose a valid plan and billing cycle to continue your artist setup.");
  }, []);

  function changeBilling(value: "monthly" | "annual") {
    setBilling(value);
    SubscriptionService.setPreferredBilling(value);
  }

  function choose(planId: PlanId) {
    const cycle = validBillingCycle(planId, billing);
    SubscriptionService.selectPlan(planId, cycle);
    setSelected(planId);
    window.location.assign(`/artist/signup?plan=${planId}&billing=${cycle}`);
  }

  return (
    <div className="container-editorial overflow-x-clip py-12 lg:py-16">
      <header className="mx-auto max-w-4xl text-center">
        <div className="eyebrow">Artist subscriptions</div>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl md:text-6xl">
          Choose the Right Plan for Your Art Business
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Start free or choose a professional plan with more listings, analytics and business tools.
          You can upgrade or change your plan later.
        </p>
        <div
          className="mx-auto mt-7 inline-flex max-w-full rounded-full border border-[var(--color-border)] bg-[var(--porcelain)] p-1"
          aria-label="Billing cycle"
        >
          {(["monthly", "annual"] as const).map((cycle) => (
            <button
              key={cycle}
              type="button"
              aria-pressed={billing === cycle}
              onClick={() => changeBilling(cycle)}
              className={`min-h-11 rounded-full px-5 text-sm font-semibold capitalize transition ${billing === cycle ? "bg-[var(--ink)] text-[var(--ivory)]" : "text-muted-foreground"}`}
            >
              {cycle}
            </button>
          ))}
        </div>
      </header>

      {notice && (
        <div
          role="status"
          className="mx-auto mt-7 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-950"
        >
          {notice}
        </div>
      )}

      <section
        className="mt-12 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Subscription plans"
      >
        {PLAN_ORDER.map((planId) => {
          const plan = SUBSCRIPTION_PLANS[planId];
          const cycle = validBillingCycle(planId, billing);
          const price =
            cycle === "annual" && plan.annualPrice ? plan.annualPrice : plan.monthlyPrice;
          const savings = cycle === "annual" ? annualSavings(planId) : 0;
          const featured = plan.recommended;
          return (
            <article
              key={planId}
              data-plan-card={planId}
              className={`relative flex min-h-[530px] min-w-0 flex-col rounded-2xl border p-6 opacity-100 ${featured ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ivory)] shadow-[var(--shadow-lift)]" : "border-[var(--color-border)] bg-[var(--porcelain)]"} ${selected === planId ? "ring-2 ring-[var(--terracotta)] ring-offset-2" : ""}`}
            >
              {featured && (
                <span className="absolute -top-3 left-5 rounded-full bg-[var(--terracotta)] px-3 py-1 text-xs font-bold text-[var(--ink)]">
                  Most Popular
                </span>
              )}
              <h2 className="font-display text-3xl">{plan.name}</h2>
              <div className="mt-5 flex min-w-0 flex-wrap items-baseline gap-x-1">
                <span className="font-display text-4xl leading-none">{formatPKR(price)}</span>
                <span className={`text-xs ${featured ? "text-white/60" : "text-muted-foreground"}`}>
                  {planId === "free" ? "forever" : cycle === "annual" ? "/year" : "/month"}
                </span>
              </div>
              {billing === "annual" && !plan.annualPrice && planId !== "free" && (
                <p
                  className={`mt-2 text-xs ${featured ? "text-white/60" : "text-muted-foreground"}`}
                >
                  Monthly billing only
                </p>
              )}
              {savings > 0 && (
                <p className="mt-2 text-xs font-semibold text-emerald-600">
                  Save {formatPKR(savings)} annually
                </p>
              )}
              <dl
                className={`mt-5 grid gap-2 border-y py-4 text-xs ${featured ? "border-white/12 text-white/72" : "border-[var(--color-border)] text-muted-foreground"}`}
              >
                <div className="flex justify-between gap-3">
                  <dt>Commission</dt>
                  <dd className="font-semibold">{plan.commission}%</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Listings</dt>
                  <dd className="text-right font-semibold">
                    {plan.listingLimit ?? "Fair-use unlimited"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Payout</dt>
                  <dd className="text-right font-semibold">{plan.payoutTime}</dd>
                </div>
              </dl>
              <ul className="mt-5 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm leading-relaxed">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-[var(--terracotta)]" : "text-[var(--oxblood)]"}`}
                    />
                    <span className="min-w-0">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => choose(planId)}
                className={`mt-7 min-h-12 w-full ${featured ? "btn-primary bg-[var(--terracotta)] !text-[var(--ink)]" : "btn-ghost"}`}
              >
                {plan.buttonLabel}
              </button>
              {planId === "gallery" && (
                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                  Zero ArtDera sales commission. Payment processing, taxes, shipping and optional
                  services may be charged separately when real services are connected.
                </p>
              )}
            </article>
          );
        })}
      </section>

      <section className="mt-16">
        <div className="eyebrow">Full comparison</div>
        <h2 className="mt-3 font-display text-4xl">Compare every detail.</h2>
        <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] md:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--ivory)]">
              <tr>
                <th className="p-4">Feature</th>
                {PLAN_ORDER.map((id) => (
                  <th key={id} className="p-4">
                    {SUBSCRIPTION_PLANS[id].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.label} className="border-b border-[var(--color-border)] last:border-0">
                  <th className="p-4 font-semibold">{row.label}</th>
                  {PLAN_ORDER.map((id) => (
                    <td key={id} className="p-4 text-muted-foreground">
                      {row.values[id] === "—" ? <Minus className="h-4 w-4" /> : row.values[id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 space-y-3 md:hidden">
          {PLAN_ORDER.map((id) => (
            <details
              key={id}
              className="group rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-2xl">
                {SUBSCRIPTION_PLANS[id].name}
                <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
              </summary>
              <dl className="mt-5 divide-y divide-[var(--color-border)]">
                {comparison.map((row) => (
                  <div key={row.label} className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="font-semibold">{row.label}</dt>
                    <dd className="text-right text-muted-foreground">{row.values[id]}</dd>
                  </div>
                ))}
              </dl>
              <button type="button" onClick={() => choose(id)} className="btn-primary mt-5 w-full">
                {SUBSCRIPTION_PLANS[id].buttonLabel}
              </button>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-10 flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--porcelain)] p-4 text-xs leading-relaxed text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 text-[var(--indigo)]" />
        <p>
          Verification is reviewed separately from subscription choice. Paid plans proceed to
          server-validated checkout after account verification.
        </p>
      </div>
      <div className="mt-8 text-center text-sm">
        <Link to="/sell" className="font-semibold underline">
          Back to Sell on ArtDera
        </Link>
      </div>
    </div>
  );
}
