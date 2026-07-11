import { createFileRoute } from "@tanstack/react-router";
import { PRODUCTS, formatPKR } from "@/lib/artdera";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — ArtDera" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Cart,
});

function Cart() {
  const items = [PRODUCTS[0], PRODUCTS[3]]; // sample
  const subtotal = items.reduce((s, p) => s + p.price, 0);
  const shipping = 1200;
  const total = subtotal + shipping;

  return (
    <div className="container-editorial py-14">
      <div className="eyebrow">Your cart</div>
      <h1 className="mt-3 font-display text-4xl">Ready when you are.</h1>
      <div className="mt-10 grid lg:grid-cols-[1.5fr_1fr] gap-10">
        <div>
          {items.map((p) => (
            <div key={p.slug} className="flex gap-5 py-6 border-t" style={{ borderColor: "var(--color-border)" }}>
              <div className="w-28 h-32 overflow-hidden rounded flex-shrink-0"><img src={p.images[0]} alt="" className="h-full w-full object-cover"/></div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-xl truncate">{p.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{p.medium} · {p.dimensions}</div>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="inline-flex items-center rounded-full border" style={{ borderColor: "var(--color-border-strong)" }}>
                    <button className="px-3 py-1">−</button><span className="px-2">1</span><button className="px-3 py-1">+</button>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground text-xs">Remove</button>
                  <button className="text-muted-foreground hover:text-foreground text-xs">Save for later</button>
                </div>
              </div>
              <div className="text-right font-semibold">{formatPKR(p.price)}</div>
            </div>
          ))}
        </div>
        <aside className="rounded-xl p-6 border h-fit lg:sticky lg:top-24" style={{ background: "var(--porcelain)", borderColor: "var(--color-border)" }}>
          <div className="font-display text-2xl">Order summary</div>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPKR(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Shipping (est.)</dt><dd>{formatPKR(shipping)}</dd></div>
            <div className="flex justify-between text-muted-foreground"><dt>Tax</dt><dd>Calculated at checkout</dd></div>
          </dl>
          <div className="mt-4 pt-4 border-t flex justify-between font-semibold text-lg" style={{ borderColor: "var(--color-border)" }}>
            <span>Total</span><span>{formatPKR(total)}</span>
          </div>
          <button className="btn-primary w-full py-3.5 mt-6">Checkout</button>
          <div className="mt-4 text-xs text-muted-foreground space-y-1.5">
            <div>· Card, Easypaisa, JazzCash, Raast, Bank transfer</div>
            <div>· Cash on delivery on eligible orders</div>
            <div>· Protected seller payout · 7-day resolution</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
