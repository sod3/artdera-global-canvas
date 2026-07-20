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
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/marketplace/auth";
import { DEMO_MODE, formatPKR, PLANS } from "@/marketplace/config";
import { PaymentService, SubscriptionService } from "@/marketplace/services";
import type { PaymentMethod } from "@/marketplace/types";

export const Route = createFileRoute("/artist/checkout")({
  head: () => ({
    meta: [{ title: "Demo Artist Checkout — ArtDera" }, { name: "robots", content: "noindex" }],
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
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvv: "", address: "" });
  const [wallet, setWallet] = useState({ number: "", name: "" });
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState("");
  const plan = selection ? PLANS[selection.planId] : undefined;

  useEffect(() => {
    if (!ready) return;
    if (!user) window.location.replace("/auth/login?return=/artist/checkout");
    else if (!["artist", "gallery"].includes(user.role)) window.location.replace("/account");
    else if (!selection) window.location.replace("/sell/plans?notice=plan-required");
    else if (selection.planId === "free")
      window.location.replace("/artist/onboarding?activated=free");
  }, [ready, selection, user]);

  const methodValid = useMemo(() => {
    if (method === "card")
      return (
        card.name.trim().length > 1 &&
        card.number.replace(/\s/g, "") === "4242424242424242" &&
        card.expiry === "12/30" &&
        card.cvv === "123" &&
        card.address.trim().length > 5
      );
    if (method === "easypaisa" || method === "jazzcash")
      return /^\+?[\d\s-]{10,18}$/.test(wallet.number) && wallet.name.trim().length > 1;
    if (method === "bank-transfer") return reference.trim().length >= 4 && Boolean(receipt);
    return reference.trim().length >= 4;
  }, [card, method, receipt, reference, wallet]);

  async function pay(event: FormEvent, pendingReview = false) {
    event.preventDefault();
    if (!user || !selection || !methodValid) {
      setError("Complete the demo payment fields using the provided test details.");
      return;
    }
    setProcessing(true);
    setError("");
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const result = PaymentService.process({
      userId: user.id,
      method,
      simulateFailure,
      pendingReview,
    });
    setProcessing(false);
    if (result.error) return setError(result.error.message);
    if (result.data?.status === "Failed") window.location.assign("/artist/payment-failed");
    else window.location.assign("/artist/payment-success");
  }

  if (!ready || !user || !selection || !plan || selection.planId === "free") return <Loading />;
  return (
    <div className="container-editorial py-10 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="eyebrow">Artist subscription</div>
            <h1 className="mt-2 font-display text-5xl">Complete demo checkout.</h1>
          </div>
          <Link to="/sell/plans" className="btn-ghost">
            Change Plan
          </Link>
        </div>
        <div className="mb-7 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <Info className="h-5 w-5 shrink-0" />
          <div>
            <strong>Demo checkout — no real payment will be processed.</strong>
            <p className="mt-1 text-xs">
              Use only the test details shown. ArtDera does not save card numbers, CVV, wallet
              details or receipt files.
            </p>
          </div>
        </div>
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
            <div className="mt-7">
              {method === "card" && <CardFields value={card} onChange={setCard} />}
              {(method === "easypaisa" || method === "jazzcash") && (
                <WalletFields
                  name={method === "easypaisa" ? "Easypaisa" : "JazzCash"}
                  value={wallet}
                  onChange={setWallet}
                />
              )}
              {method === "bank-transfer" && (
                <BankFields
                  reference={reference}
                  setReference={setReference}
                  receipt={receipt}
                  setReceipt={setReceipt}
                />
              )}
              {method === "raast" && (
                <RaastFields
                  amount={selection.price}
                  reference={reference}
                  setReference={setReference}
                />
              )}
            </div>
            {DEMO_MODE && (
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
            {method === "bank-transfer" && DEMO_MODE ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={(event) => pay(event as unknown as FormEvent, false)}
                  className="btn-primary"
                >
                  Mark Payment as Approved
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={(event) => pay(event as unknown as FormEvent, true)}
                  className="btn-ghost"
                >
                  Mark Payment as Pending
                </button>
              </div>
            ) : (
              <button
                disabled={processing || !methodValid}
                className="btn-primary mt-6 min-h-12 w-full disabled:cursor-not-allowed disabled:opacity-45"
              >
                {processing ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Processing demo payment…
                  </>
                ) : (
                  `Confirm ${method === "card" ? "Demo Payment" : "Payment"}`
                )}
              </button>
            )}
          </form>
          <aside className="h-fit rounded-2xl bg-[var(--ink)] p-6 text-[var(--ivory)] lg:sticky lg:top-28">
            <div className="eyebrow !text-white/50">Order summary</div>
            <h2 className="mt-3 font-display text-4xl">{plan.name}</h2>
            <p className="mt-1 text-xs capitalize text-white/55">
              {selection.billingCycle} billing
            </p>
            <div className="mt-6 font-display text-4xl">{formatPKR(selection.price)}</div>
            <dl className="mt-6 divide-y divide-white/10 rounded-xl border border-white/10 px-4 text-sm">
              {[
                ["Plan price", formatPKR(selection.price)],
                ["Tax placeholder", formatPKR(0)],
                ["Discount placeholder", formatPKR(0)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 py-3">
                  <dt className="text-white/55">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
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

function CardFields({
  value,
  onChange,
}: {
  value: { name: string; number: string; expiry: string; cvv: string; address: string };
  onChange: (value: {
    name: string;
    number: string;
    expiry: string;
    cvv: string;
    address: string;
  }) => void;
}) {
  const set = (key: keyof typeof value, next: string) => onChange({ ...value, [key]: next });
  return (
    <div>
      <div className="rounded-xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
        <strong>Use the provided demo card. Do not enter real payment details.</strong>
        <div className="mt-2 font-mono">4242 4242 4242 4242 · 12/30 · 123</div>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Cardholder name">
          <input
            className="art-field"
            autoComplete="off"
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Card number">
          <input
            className="art-field"
            inputMode="numeric"
            autoComplete="off"
            placeholder="4242 4242 4242 4242"
            value={value.number}
            onChange={(e) => set("number", e.target.value.replace(/[^\d\s]/g, "").slice(0, 19))}
          />
        </Field>
        <Field label="Expiry">
          <input
            className="art-field"
            autoComplete="off"
            placeholder="12/30"
            value={value.expiry}
            onChange={(e) => set("expiry", e.target.value.slice(0, 5))}
          />
        </Field>
        <Field label="CVV">
          <input
            className="art-field"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="123"
            value={value.cvv}
            onChange={(e) => set("cvv", e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Billing address">
            <textarea
              className="art-field"
              rows={3}
              autoComplete="off"
              value={value.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function WalletFields({
  name,
  value,
  onChange,
}: {
  name: string;
  value: { number: string; name: string };
  onChange: (value: { number: string; name: string }) => void;
}) {
  return (
    <div>
      <div className="rounded-xl bg-[var(--ivory)] p-4 text-xs text-muted-foreground">
        Demo {name} simulation. Use a fictional number such as +92 300 000 0000.
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Mobile-wallet number">
          <input
            className="art-field"
            autoComplete="off"
            placeholder="+92 300 000 0000"
            value={value.number}
            onChange={(e) => onChange({ ...value, number: e.target.value })}
          />
        </Field>
        <Field label="Account-holder name">
          <input
            className="art-field"
            autoComplete="off"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

function BankFields({
  reference,
  setReference,
  receipt,
  setReceipt,
}: {
  reference: string;
  setReference: (value: string) => void;
  receipt: string;
  setReceipt: (value: string) => void;
}) {
  return (
    <div>
      <div className="rounded-xl bg-[var(--ivory)] p-4 text-sm">
        <strong>ArtDera Demo Bank</strong>
        <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
          <span>Account title: ArtDera Demo Only</span>
          <span>IBAN: PK00 DEMO 0000 0000 0000</span>
          <span>This is fictional and cannot receive funds.</span>
        </div>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Transfer reference">
          <input
            className="art-field"
            autoComplete="off"
            placeholder="DEMO-REF-1001"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </Field>
        <Field label="Receipt simulation">
          <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[var(--color-border-strong)] px-3 text-center text-xs font-semibold">
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="sr-only"
              onChange={(e) => setReceipt(e.target.files?.[0]?.name ?? "")}
            />
            {receipt || "Choose demo receipt"}
          </label>
        </Field>
      </div>
    </div>
  );
}

function RaastFields({
  amount,
  reference,
  setReference,
}: {
  amount: number;
  reference: string;
  setReference: (value: string) => void;
}) {
  return (
    <div>
      <div className="rounded-xl bg-[var(--ivory)] p-4 text-sm">
        <strong>Mock Raast ID: artdera.demo@raast</strong>
        <div className="mt-1 text-xs text-muted-foreground">
          Demo amount: {formatPKR(amount)}. This ID is fictional.
        </div>
      </div>
      <div className="mt-5">
        <Field label="Demo Raast reference">
          <input
            className="art-field"
            autoComplete="off"
            placeholder="RAAST-DEMO-1001"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}
function Loading() {
  return (
    <div className="container-editorial py-20">
      <div className="mx-auto h-64 max-w-6xl animate-pulse rounded-2xl bg-[var(--porcelain)]" />
    </div>
  );
}
