import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Check,
  CreditCard,
  Info,
  Landmark,
  LoaderCircle,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/marketplace/auth";
import { DEMO_PAYMENT_MODE, formatPKR, PLANS } from "@/marketplace/config";
import { PaymentService, SubscriptionService } from "@/marketplace/services";
import type { PaymentMethod } from "@/marketplace/types";

export const Route = createFileRoute("/artist/checkout")({
  head: () => ({
    meta: [
      { title: "Artist Subscription Checkout — ArtDera" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ArtistCheckout,
});

const methods: Array<[PaymentMethod, string, typeof CreditCard]> = [
  ["card", "Card", CreditCard],
  ["bank-transfer", "Bank Transfer", Landmark],
  ["easypaisa", "Easypaisa", Smartphone],
  ["jazzcash", "JazzCash", WalletCards],
  ["raast", "Raast", Building2],
];

function ArtistCheckout() {
  const { user, ready } = useAuth();
  const selection = SubscriptionService.getSelection();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [error, setError] = useState("");
  const plan = selection ? PLANS[selection.planId] : undefined;

  useEffect(() => {
    if (!ready) return;
    if (!user) window.location.replace("/auth/login?return=/artist/checkout");
    else if (!["artist", "gallery"].includes(user.role)) window.location.replace("/account");
    else if (!selection) window.location.replace("/sell/plans?notice=plan-required");
    else if (selection.planId === "free")
      window.location.replace("/artist/onboarding?activated=free");
  }, [ready, selection, user]);

  async function pay(event: FormEvent) {
    event.preventDefault();
    if (!user || !selection) return;
    setProcessing(true);
    setError("");
    const result = await PaymentService.process({ userId: user.id, method, simulateFailure });
    setProcessing(false);
    if (result.error) return setError(result.error.message);
    if (result.data?.status === "Failed") window.location.assign("/artist/payment-failed");
    else window.location.assign("/artist/payment-success");
  }

  if (!ready || !user || !selection || !plan || selection.planId === "free")
    return (
      <div className="container-editorial py-20">
        <div className="mx-auto h-64 max-w-6xl animate-pulse rounded-2xl bg-[var(--porcelain)]" />
      </div>
    );

  return (
    <div className="container-editorial py-10 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="eyebrow">Artist subscription</div>
            <h1 className="mt-2 font-display text-5xl">Complete secure checkout.</h1>
          </div>
          <Link to="/sell/plans" className="btn-ghost">
            Change Plan
          </Link>
        </div>
        {DEMO_PAYMENT_MODE && (
          <div className="mb-7 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <Info className="h-5 w-5 shrink-0" />
            <div>
              <strong>Development payment mode is enabled.</strong>
              <p className="mt-1 text-xs">
                The server-side demo adapter records a test outcome without collecting or sending
                financial credentials. This mode cannot start in production.
              </p>
            </div>
          </div>
        )}
        <div className="grid gap-7 lg:grid-cols-[1.28fr_0.72fr]">
          <form
            onSubmit={pay}
            className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5 sm:p-6 md:p-8"
          >
            <div className="eyebrow">Payment method</div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {methods.map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setMethod(id);
                    setError("");
                  }}
                  className={`flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-2 text-center text-xs font-semibold ${method === id ? "border-[var(--oxblood)] bg-[var(--ivory)] ring-1 ring-[var(--oxblood)]" : "border-[var(--color-border)]"}`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-7 rounded-xl bg-[var(--ivory)] p-5 text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">
                Payment credentials stay with the configured provider.
              </strong>
              <p className="mt-2">
                ArtDera creates a server-side payment intent using the selected method. Card
                numbers, CVV, wallet PINs and online-banking passwords are never requested or stored
                by this application.
              </p>
            </div>
            {DEMO_PAYMENT_MODE && (
              <label className="mt-6 flex items-start gap-3 rounded-xl border border-dashed border-[var(--color-border-strong)] p-4 text-xs leading-relaxed">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(event) => setSimulateFailure(event.target.checked)}
                  className="mt-0.5 accent-[var(--oxblood)]"
                />
                <span>
                  <strong>Development test:</strong> simulate a failed payment and verify recovery.
                </span>
              </label>
            )}
            {error && (
              <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}
            <button
              disabled={processing}
              className="btn-primary mt-6 min-h-12 w-full disabled:cursor-not-allowed disabled:opacity-45"
            >
              {processing ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Creating secure payment…
                </>
              ) : DEMO_PAYMENT_MODE ? (
                "Confirm Development Payment"
              ) : (
                "Continue with Payment Provider"
              )}
            </button>
          </form>
          <aside className="h-fit rounded-2xl bg-[var(--ink)] p-6 text-[var(--ivory)] lg:sticky lg:top-28">
            <div className="eyebrow !text-white/50">Order summary</div>
            <h2 className="mt-3 font-display text-4xl">{plan.name}</h2>
            <p className="mt-1 text-xs capitalize text-white/55">
              {selection.billingCycle} billing
            </p>
            <div className="mt-6 font-display text-4xl">{formatPKR(selection.price)}</div>
            <dl className="mt-6 divide-y divide-white/10 rounded-xl border border-white/10 px-4 text-sm">
              <div className="flex justify-between gap-3 py-3">
                <dt className="text-white/55">Plan price</dt>
                <dd>{formatPKR(selection.price)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-4 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatPKR(selection.price)}</dd>
              </div>
            </dl>
            <div className="mt-5 grid gap-2 text-xs text-white/65">
              <div className="flex justify-between">
                <span>Commission</span>
                <strong>{selection.commission}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Listing limit</span>
                <strong>{selection.listingLimit ?? "Fair-use unlimited"}</strong>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.slice(0, 5).map((feature) => (
                <li key={feature} className="flex gap-2 text-sm text-white/72">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--terracotta)]" />
                  {feature}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
