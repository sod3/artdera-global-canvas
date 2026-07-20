import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  CreditCard,
  Info,
  Landmark,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { ARTWORKS } from "@/marketplace/data";
import { formatPKR } from "@/marketplace/config";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Demo Checkout — ArtDera" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: Checkout,
});
const methods = [
  [CreditCard, "Card", "No card details collected"],
  [Landmark, "Bank transfer", "Instructions after backend connection"],
  [WalletCards, "Digital wallet", "Provider placeholder"],
  [Smartphone, "Raast", "Payment alias placeholder"],
] as const;
function Checkout() {
  const item = ARTWORKS.find((value) => value.status === "Published") ?? ARTWORKS[0];
  const [method, setMethod] = useState("Card");
  const [same, setSame] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);
  const shipping = 3200,
    packaging = 1800,
    discount = 0,
    total = item.price + shipping + packaging - discount;
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!agreed) return;
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (done)
    return (
      <div className="container-editorial flex min-h-[70vh] items-center justify-center py-14">
        <div className="max-w-2xl rounded-3xl bg-[var(--ink)] p-8 text-center text-[var(--ivory)] md:p-12">
          <CheckCircle2 className="mx-auto h-16 w-16 text-[var(--terracotta)]" />
          <div className="eyebrow mt-7 !text-white/45">Demo order placed</div>
          <h1 className="mt-3 font-display text-5xl">
            Your artwork is reserved in this simulation.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/62">
            Order AD-DEMO-2026 was created without charging a card or contacting a courier. Track
            the mock workflow from the buyer account.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href="/account/orders"
              className="btn-primary bg-[var(--terracotta)] !text-[var(--ink)]"
            >
              View Order
            </a>
            <Link to="/discover" className="btn-ghost !border-white/20 !text-white">
              Continue Exploring
            </Link>
          </div>
        </div>
      </div>
    );
  return (
    <form onSubmit={submit} className="container-editorial py-12 lg:py-16">
      <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <div className="flex gap-3">
          <Info className="h-5 w-5 shrink-0" />
          <div>
            <strong>Demo checkout — no real payment will be processed.</strong>
            <p className="mt-1 text-xs leading-relaxed">
              Do not enter card, bank, CNIC or other sensitive financial information. Payment
              options below are non-functional placeholders.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <main className="space-y-6">
          <CheckoutSection title="Contact details">
            <div className="grid gap-4 sm:grid-cols-2">
              <CheckoutField label="Full name">
                <input
                  required
                  autoComplete="name"
                  className="art-field"
                  defaultValue="Hamza Ahmed"
                />
              </CheckoutField>
              <CheckoutField label="Email">
                <input
                  required
                  type="email"
                  autoComplete="email"
                  className="art-field"
                  defaultValue="buyer@artdera.demo"
                />
              </CheckoutField>
              <CheckoutField label="Mobile with country code">
                <input
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  className="art-field"
                  defaultValue="+92 300 555 0168"
                />
              </CheckoutField>
            </div>
          </CheckoutSection>
          <CheckoutSection title="Delivery address">
            <div className="grid gap-4 sm:grid-cols-2">
              <CheckoutField label="Address line" wide>
                <input
                  required
                  autoComplete="street-address"
                  className="art-field"
                  defaultValue="House 18, Street 7, F-7/2"
                />
              </CheckoutField>
              <CheckoutField label="City">
                <input
                  required
                  autoComplete="address-level2"
                  className="art-field"
                  defaultValue="Islamabad"
                />
              </CheckoutField>
              <CheckoutField label="Province">
                <input
                  required
                  autoComplete="address-level1"
                  className="art-field"
                  defaultValue="Islamabad Capital Territory"
                />
              </CheckoutField>
              <CheckoutField label="Postal code">
                <input autoComplete="postal-code" className="art-field" defaultValue="44000" />
              </CheckoutField>
              <CheckoutField label="Country">
                <input readOnly className="art-field bg-[var(--ivory)]" value="Pakistan" />
              </CheckoutField>
            </div>
            <label className="mt-5 flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={same}
                onChange={(event) => setSame(event.target.checked)}
                className="accent-[var(--oxblood)]"
              />
              Billing address is the same
            </label>
            {!same && (
              <div className="mt-4 rounded-xl bg-[var(--ivory)] p-4">
                <CheckoutField label="Billing address">
                  <input className="art-field" placeholder="Enter billing address" />
                </CheckoutField>
              </div>
            )}
          </CheckoutSection>
          <CheckoutSection title="Payment method placeholder">
            <div className="grid gap-3 sm:grid-cols-2">
              {methods.map(([Icon, label, description]) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => setMethod(label)}
                  className={`flex gap-3 rounded-xl border p-4 text-left ${method === label ? "border-[var(--oxblood)] bg-[var(--ivory)]" : "border-[var(--color-border)]"}`}
                >
                  <Icon className="h-5 w-5 text-[var(--indigo)]" />
                  <div>
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{description}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-3 rounded-xl bg-[var(--ivory)] p-4 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              No card number, CVV, bank account or payment alias is requested or saved.
            </div>
          </CheckoutSection>
        </main>
        <aside className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-6 lg:sticky lg:top-28">
          <div className="eyebrow">Your order</div>
          <div className="mt-5 flex gap-4">
            <img
              src={item.images[0].url}
              alt={item.title}
              className="h-28 w-24 rounded-xl object-cover"
            />
            <div>
              <h2 className="font-display text-2xl">{item.title}</h2>
              <div className="mt-1 text-xs text-muted-foreground">{item.creatorName}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {item.dimensions} · {item.medium}
              </div>
              <div className="mt-3 text-sm font-semibold">{formatPKR(item.price)}</div>
            </div>
          </div>
          <dl className="mt-6 divide-y divide-[var(--color-border)] text-sm">
            {[
              ["Artwork", item.price],
              ["Estimated shipping", shipping],
              ["Packaging estimate", packaging],
              ["Discount", -discount],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between py-3">
                <dt>{label}</dt>
                <dd>{formatPKR(Number(value))}</dd>
              </div>
            ))}
          </dl>
          <div className="flex justify-between border-t-2 border-[var(--ink)] pt-4 font-display text-2xl">
            <span>Total</span>
            <span>{formatPKR(total)}</span>
          </div>
          <label className="mt-6 flex items-start gap-3 text-xs leading-relaxed">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1 accent-[var(--oxblood)]"
            />
            <span>
              I agree to the demo order terms, return information and buyer protection policy.
            </span>
          </label>
          <button disabled={!agreed} className="btn-primary mt-5 w-full disabled:opacity-45">
            Place Demo Order
          </button>
          <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">
            Submitting creates browser-only mock order state. No payment, email, courier request or
            seller payout occurs.
          </p>
        </aside>
      </div>
    </form>
  );
}
function CheckoutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5 md:p-6">
      <h2 className="font-display text-3xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
function CheckoutField({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}
