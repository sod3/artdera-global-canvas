import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, CreditCard, Info, Landmark, ShieldCheck, Smartphone, WalletCards } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { DEMO_PAYMENT_MODE, formatPKR } from "@/marketplace/config";
import { useAuth } from "@/marketplace/auth";
import { CartService, CheckoutService, type CartEntry, type CheckoutAddress } from "@/marketplace/services";
import type { PaymentMethod } from "@/marketplace/types";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Secure Checkout — ArtDera" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: Checkout,
});

const methods: Array<[typeof CreditCard, string, PaymentMethod, string]> = [
  [CreditCard, "Card", "card", "Processed by the configured provider"],
  [Landmark, "Bank transfer", "bank-transfer", "Provider instructions follow checkout"],
  [WalletCards, "Easypaisa", "easypaisa", "Mobile wallet payment"],
  [Smartphone, "Raast", "raast", "Instant account-to-account payment"],
];

function Checkout() {
  const { user } = useAuth();
  const [items, setItems] = useState<CartEntry[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [same, setSame] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState<{ numbers: string[]; paid: boolean } | null>(null);

  useEffect(() => {
    if (user?.role !== "buyer") {
      setLoading(false);
      return;
    }
    CartService.get().then((result) => {
      if (result.data) {
        setItems(result.data.items);
        setSubtotal(result.data.subtotal);
      } else setError(result.error?.message ?? "Your cart could not be loaded.");
      setLoading(false);
    });
  }, [user?.id, user?.role]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!agreed || !items.length || submitting) return;
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const shippingAddress: CheckoutAddress = {
      fullName: String(form.get("fullName") ?? ""),
      line1: String(form.get("line1") ?? ""),
      line2: String(form.get("line2") ?? "") || undefined,
      city: String(form.get("city") ?? ""),
      province: String(form.get("province") ?? ""),
      postalCode: String(form.get("postalCode") ?? "") || undefined,
      country: "Pakistan",
      phone: String(form.get("phone") ?? ""),
    };
    const billingAddress = same ? undefined : { ...shippingAddress, line1: String(form.get("billingLine1") ?? "") };
    const result = await CheckoutService.create({ shippingAddress, billingAddress, method });
    if (result.error) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }
    const orders = result.data!.orders;
    if (DEMO_PAYMENT_MODE) {
      for (const entry of orders) {
        const confirmation = await CheckoutService.confirmDemo(entry.payment.id);
        if (confirmation.error) {
          setError(confirmation.error.message);
          setSubmitting(false);
          return;
        }
      }
    }
    setCompleted({ numbers: orders.map((entry) => entry.order.orderNumber), paid: DEMO_PAYMENT_MODE });
    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!user)
    return <div className="container-editorial py-20 text-center"><h1 className="font-display text-5xl">Sign in to checkout.</h1><a href="/auth/login?redirect=/checkout" className="btn-primary mt-6">Sign In</a></div>;
  if (user.role !== "buyer")
    return <div className="container-editorial py-20 text-center"><h1 className="font-display text-5xl">Buyer checkout only.</h1></div>;
  if (completed)
    return (
      <div className="container-editorial flex min-h-[70vh] items-center justify-center py-14">
        <div className="max-w-2xl rounded-3xl bg-[var(--ink)] p-8 text-center text-[var(--ivory)] md:p-12">
          <CheckCircle2 className="mx-auto h-16 w-16 text-[var(--terracotta)]" />
          <div className="eyebrow mt-7 !text-white/45">{completed.paid ? "Payment confirmed" : "Payment initiated"}</div>
          <h1 className="mt-3 font-display text-5xl">Your order is securely recorded.</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/62">
            {completed.paid ? "The development payment adapter confirmed your payment. " : "Complete payment using the configured provider instructions. "}
            {completed.numbers.join(", ")}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href="/account/orders" className="btn-primary bg-[var(--terracotta)] !text-[var(--ink)]">View Order</a>
            <Link to="/discover" className="btn-ghost !border-white/20 !text-white">Continue Exploring</Link>
          </div>
        </div>
      </div>
    );

  const unavailable = items.some((entry) => !entry.available || entry.priceChanged);

  return (
    <form onSubmit={submit} className="container-editorial py-12 lg:py-16">
      {DEMO_PAYMENT_MODE && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <div className="flex gap-3"><Info className="h-5 w-5 shrink-0" /><div><strong>Development payment mode is enabled.</strong><p className="mt-1 text-xs leading-relaxed">No external charge is made. Payment outcomes are recorded through the server-side demo adapter and this mode is rejected in production.</p></div></div>
        </div>
      )}
      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">{error}</div>}
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <main className="space-y-6">
          <CheckoutSection title="Contact details">
            <div className="grid gap-4 sm:grid-cols-2">
              <CheckoutField label="Full name"><input required name="fullName" autoComplete="name" className="art-field" defaultValue={user.fullName} /></CheckoutField>
              <CheckoutField label="Email"><input readOnly type="email" className="art-field bg-[var(--ivory)]" value={user.email} /></CheckoutField>
              <CheckoutField label="Mobile with country code"><input required name="phone" inputMode="tel" autoComplete="tel" className="art-field" defaultValue={user.mobile ?? ""} /></CheckoutField>
            </div>
          </CheckoutSection>
          <CheckoutSection title="Delivery address">
            <div className="grid gap-4 sm:grid-cols-2">
              <CheckoutField label="Address line" wide><input required name="line1" autoComplete="address-line1" className="art-field" /></CheckoutField>
              <CheckoutField label="Apartment, suite or landmark" wide><input name="line2" autoComplete="address-line2" className="art-field" /></CheckoutField>
              <CheckoutField label="City"><input required name="city" autoComplete="address-level2" className="art-field" defaultValue={user.city} /></CheckoutField>
              <CheckoutField label="Province"><input required name="province" autoComplete="address-level1" className="art-field" defaultValue={user.province ?? ""} /></CheckoutField>
              <CheckoutField label="Postal code"><input name="postalCode" autoComplete="postal-code" className="art-field" /></CheckoutField>
              <CheckoutField label="Country"><input readOnly className="art-field bg-[var(--ivory)]" value="Pakistan" /></CheckoutField>
            </div>
            <label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" checked={same} onChange={(event) => setSame(event.target.checked)} className="accent-[var(--oxblood)]" />Billing address is the same</label>
            {!same && <div className="mt-4 rounded-xl bg-[var(--ivory)] p-4"><CheckoutField label="Billing address"><input required name="billingLine1" autoComplete="billing street-address" className="art-field" /></CheckoutField></div>}
          </CheckoutSection>
          <CheckoutSection title="Payment method">
            <div className="grid gap-3 sm:grid-cols-2">
              {methods.map(([Icon, label, value, description]) => <button type="button" key={value} onClick={() => setMethod(value)} className={`flex gap-3 rounded-xl border p-4 text-left ${method === value ? "border-[var(--oxblood)] bg-[var(--ivory)]" : "border-[var(--color-border)]"}`}><Icon className="h-5 w-5 text-[var(--indigo)]" /><div><div className="text-sm font-semibold">{label}</div><div className="mt-1 text-[11px] text-muted-foreground">{description}</div></div></button>)}
            </div>
            <div className="mt-4 flex gap-3 rounded-xl bg-[var(--ivory)] p-4 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" />Sensitive payment credentials are handled by the payment provider, never stored in ArtDera forms.</div>
          </CheckoutSection>
        </main>
        <aside className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-6 lg:sticky lg:top-28">
          <div className="eyebrow">Your order</div>
          {loading ? <p className="mt-5 text-sm text-muted-foreground">Loading your cart…</p> : items.map(({ artwork, quantity }) => <div key={artwork.id} className="mt-5 flex gap-4 border-b border-[var(--color-border)] pb-5"><img src={artwork.images[0]?.url} alt={artwork.title} className="h-28 w-24 rounded-xl object-cover" /><div><h2 className="font-display text-2xl">{artwork.title}</h2><div className="mt-1 text-xs text-muted-foreground">{artwork.creatorName} · Qty {quantity}</div><div className="mt-1 text-xs text-muted-foreground">{artwork.dimensions} · {artwork.medium}</div><div className="mt-3 text-sm font-semibold">{formatPKR((artwork.discountPrice ?? artwork.price) * quantity)}</div></div></div>)}
          <dl className="mt-6 divide-y divide-[var(--color-border)] text-sm"><div className="flex justify-between py-3"><dt>Artwork subtotal</dt><dd>{formatPKR(subtotal)}</dd></div><div className="flex justify-between py-3"><dt>Shipping, packaging & fees</dt><dd>Calculated securely</dd></div></dl>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">The final total is calculated from live shipping rules when the order is submitted and recorded on its invoice.</p>
          <label className="mt-6 flex items-start gap-3 text-xs leading-relaxed"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1 accent-[var(--oxblood)]" /><span>I agree to the order terms, return information and buyer protection policy.</span></label>
          <button disabled={!agreed || !items.length || unavailable || loading || submitting} className="btn-primary mt-5 w-full disabled:opacity-45">{submitting ? "Securing your order…" : "Place Order"}</button>
          {unavailable && <p className="mt-3 text-xs text-[var(--destructive)]">Review price or availability changes in your cart before continuing.</p>}
        </aside>
      </div>
    </form>
  );
}

function CheckoutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-5 md:p-6"><h2 className="font-display text-3xl">{title}</h2><div className="mt-5">{children}</div></section>;
}

function CheckoutField({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "sm:col-span-2" : ""}><span className="eyebrow mb-2 block">{label}</span>{children}</label>;
}
