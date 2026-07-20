import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { ARTWORKS } from "@/marketplace/data";
import { formatPKR } from "@/marketplace/config";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "Your Cart — ArtDera" }, { name: "robots", content: "noindex" }],
  }),
  component: Cart,
});
function Cart() {
  const [items, setItems] = useState(
    ARTWORKS.filter((item) => item.status === "Published")
      .slice(0, 2)
      .map((item) => ({ ...item, cartQuantity: 1 })),
  );
  const subtotal = items.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  const shipping = items.length ? 3200 : 0;
  const packaging = items.length ? 1800 : 0;
  const total = subtotal + shipping + packaging;
  return (
    <div className="container-editorial py-12 lg:py-16">
      <div className="eyebrow">Your cart</div>
      <h1 className="mt-3 font-display text-5xl">Art chosen for your space.</h1>
      <div className="mt-9 grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <main>
          {items.length ? (
            <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {items.map((item) => (
                <article key={item.id} className="grid gap-5 py-6 sm:grid-cols-[120px_1fr_auto]">
                  <a href={`/product/${item.slug}`}>
                    <img
                      src={item.images[0].url}
                      alt={item.title}
                      className="aspect-[4/5] w-full rounded-xl object-cover"
                    />
                  </a>
                  <div>
                    <a
                      href={`/product/${item.slug}`}
                      className="font-display text-2xl hover:underline"
                    >
                      {item.title}
                    </a>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.creatorName} · {item.medium}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.dimensions} · {item.framed ? "Framed" : "Unframed"}
                    </div>
                    <div className="mt-4 inline-flex items-center rounded-full border border-[var(--color-border-strong)]">
                      <button
                        onClick={() =>
                          setItems((values) =>
                            values.map((value) =>
                              value.id === item.id
                                ? { ...value, cartQuantity: Math.max(1, value.cartQuantity - 1) }
                                : value,
                            ),
                          )
                        }
                        className="flex h-10 w-10 items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-8 text-center text-sm">{item.cartQuantity}</span>
                      <button
                        onClick={() =>
                          setItems((values) =>
                            values.map((value) =>
                              value.id === item.id
                                ? { ...value, cartQuantity: value.cartQuantity + 1 }
                                : value,
                            ),
                          )
                        }
                        className="flex h-10 w-10 items-center justify-center"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-row items-start justify-between gap-4 sm:flex-col sm:items-end">
                    <strong>{formatPKR(item.price * item.cartQuantity)}</strong>
                    <div className="flex gap-2">
                      <button
                        className="flex h-10 w-10 items-center justify-center rounded-full border"
                        aria-label="Save for later"
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setItems((values) => values.filter((value) => value.id !== item.id))
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-full border text-[var(--destructive)]"
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-12 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-[var(--oxblood)]" />
              <h2 className="mt-5 font-display text-4xl">Your cart is empty.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Explore original work, prints and carefully chosen decor.
              </p>
              <Link to="/discover" className="btn-primary mt-6">
                Explore Art
              </Link>
            </div>
          )}
          <div className="mt-6 flex gap-3 rounded-xl bg-[var(--porcelain)] p-4 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--indigo)]" />
            Seller contact details remain protected before an order. Checkout is a frontend
            simulation and never processes a payment.
          </div>
        </main>
        <aside className="h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-6 lg:sticky lg:top-28">
          <div className="font-display text-3xl">Order summary</div>
          <dl className="mt-6 divide-y divide-[var(--color-border)] text-sm">
            {[
              ["Artwork subtotal", subtotal],
              ["Estimated shipping", shipping],
              ["Estimated packaging", packaging],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between py-3">
                <dt>{label}</dt>
                <dd>{formatPKR(Number(value))}</dd>
              </div>
            ))}
          </dl>
          <div className="flex justify-between border-t-2 border-[var(--ink)] pt-4 font-display text-2xl">
            <span>Estimated total</span>
            <span>{formatPKR(total)}</span>
          </div>
          <Link
            to="/checkout"
            className={`btn-primary mt-6 w-full ${!items.length ? "pointer-events-none opacity-45" : ""}`}
          >
            Continue to Demo Checkout
          </Link>
          <div className="mt-5 space-y-3 text-xs text-muted-foreground">
            <div className="flex gap-2">
              <Truck className="h-4 w-4" />
              Shipping values are estimates.
            </div>
            <div className="flex gap-2">
              <ShieldCheck className="h-4 w-4" />
              No real payment is processed.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
