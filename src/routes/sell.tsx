import { createFileRoute } from "@tanstack/react-router";
import { IMAGES } from "@/lib/artdera";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell on ArtDera — A Global Marketplace for Art & Décor" },
      {
        name: "description",
        content:
          "Apply to sell on ArtDera. Independent creators, studios and galleries — three plans, transparent commissions, protected payouts.",
      },
      { property: "og:title", content: "Sell on ArtDera" },
      { property: "og:url", content: "/sell" },
      { property: "og:image", content: IMAGES.creator1 },
    ],
    links: [{ rel: "canonical", href: "/sell" }],
  }),
  component: Sell,
});

function Sell() {
  return (
    <div>
      <section style={{ background: "var(--ink)", color: "var(--ivory)" }}>
        <div className="container-editorial py-20 lg:py-28 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <div
              className="eyebrow"
              style={{ color: "color-mix(in oklab, var(--ivory) 60%, transparent)" }}
            >
              Sell on ArtDera
            </div>
            <h1 className="mt-4 font-display text-5xl md:text-7xl leading-[0.95]">
              Your work deserves
              <br />
              <span style={{ color: "var(--terracotta)" }}>a wider world.</span>
            </h1>
            <p className="mt-6 max-w-lg opacity-80 text-[15px]">
              Build a beautiful storefront on a marketplace built for art. Reach serious buyers
              across Pakistan today — and internationally as we expand.
            </p>
            <a
              href="#apply"
              className="btn-primary mt-8"
              style={{ background: "var(--terracotta)", color: "var(--ink)" }}
            >
              Apply to Sell
            </a>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-lg">
            <img src={IMAGES.creator1} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="container-editorial py-20">
        <div className="grid md:grid-cols-3 gap-10">
          {[
            [
              "A curated audience",
              "Buyers who come for art — not for the lowest price. Fewer, better leads.",
            ],
            [
              "Protected payouts",
              "You get paid after delivery confirmation, without carrying payment risk.",
            ],
            [
              "Real merchandising",
              "Curator-selected features, editorial journal placement and email support for growth.",
            ],
          ].map(([t, d]) => (
            <div key={t}>
              <div className="font-display text-2xl">{t}</div>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="container-editorial pb-12">
        <div className="eyebrow">Seller plans</div>
        <h2 className="mt-3 font-display text-4xl md:text-5xl">Three ways to sell.</h2>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Start free. Upgrade when you're ready for more reach, better commissions and richer tools.
        </p>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[
            {
              n: "Starter",
              price: "PKR 0",
              per: "/month",
              commission: "~15% commission",
              perks: [
                "Standard seller profile",
                "Up to 20 active listings",
                "Basic analytics",
                "Product approval required",
              ],
              cta: "Start free",
            },
            {
              n: "Professional",
              price: "PKR 2,500",
              per: "/month",
              commission: "~10–12% commission",
              featured: true,
              perks: [
                "Up to 200 listings",
                "Advanced analytics",
                "Promotional tools",
                "Custom storefront sections",
                "Priority review",
              ],
              cta: "Go professional",
            },
            {
              n: "Gallery",
              price: "PKR 8,000",
              per: "/month",
              commission: "~7–9% commission",
              perks: [
                "Unlimited or configurable listings",
                "Multi-artist roster & bulk uploads",
                "Team accounts",
                "Verified Gallery application",
                "Priority support & corporate leads",
              ],
              cta: "Apply for Gallery",
            },
          ].map((p) => (
            <div
              key={p.n}
              className={`rounded-2xl p-7 border ${p.featured ? "" : "bg-background"}`}
              style={{
                borderColor: p.featured ? "var(--ink)" : "var(--color-border)",
                background: p.featured ? "var(--ink)" : "var(--card)",
                color: p.featured ? "var(--ivory)" : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-2xl">{p.n}</div>
                {p.featured && (
                  <span
                    className="chip"
                    style={{ background: "var(--terracotta)", color: "var(--ink)" }}
                  >
                    Most popular
                  </span>
                )}
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl">{p.price}</span>
                <span className="opacity-70 text-sm">{p.per}</span>
              </div>
              <div className="text-xs opacity-70 mt-1">{p.commission}</div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.perks.map((k) => (
                  <li key={k} className="flex gap-2">
                    <span>✓</span> {k}
                  </li>
                ))}
              </ul>
              <button
                className={p.featured ? "btn-primary mt-7 w-full" : "btn-ghost mt-7 w-full"}
                style={p.featured ? { background: "var(--terracotta)", color: "var(--ink)" } : {}}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Plans and commissions are configurable during launch and may be adjusted by the ArtDera
          team as we grow. Current listing allowances shown; final prices confirmed at checkout.
        </p>
      </section>

      {/* Process */}
      <section className="container-editorial py-16">
        <div className="eyebrow">How it works</div>
        <h2 className="mt-3 font-display text-4xl">From application to first sale.</h2>
        <ol className="mt-10 grid md:grid-cols-4 gap-6">
          {[
            [
              "01",
              "Apply",
              "Tell us about your practice, upload sample work and identity documents.",
            ],
            [
              "02",
              "Get verified",
              "We review portfolios and identity — usually within 3 business days.",
            ],
            [
              "03",
              "Set up your store",
              "Add products, shipping profiles and policies. First listings are curator-approved.",
            ],
            [
              "04",
              "Start selling",
              "Accept orders, ship carefully, and get paid on our protected payout schedule.",
            ],
          ].map(([n, t, d]) => (
            <li key={n}>
              <div className="font-display text-2xl text-muted-foreground">{n}</div>
              <div className="mt-1 font-semibold">{t}</div>
              <div className="text-sm text-muted-foreground mt-1">{d}</div>
            </li>
          ))}
        </ol>
      </section>

      {/* Application form (visual) */}
      <section id="apply" className="mt-8" style={{ background: "var(--porcelain)" }}>
        <div className="container-editorial py-20 grid lg:grid-cols-[1fr_1.3fr] gap-12">
          <div>
            <div className="eyebrow">Apply</div>
            <h2 className="mt-3 font-display text-4xl">Tell us about your practice.</h2>
            <p className="mt-3 text-muted-foreground">
              Fill this out and we'll be in touch within a few business days. This form is a
              placeholder; enable Lovable Cloud to accept live applications.
            </p>
          </div>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Enable Lovable Cloud to receive applications");
            }}
          >
            <Field label="Full name" name="name" required />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email" name="email" type="email" required />
              <Field label="Phone (WhatsApp)" name="phone" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Studio / display name" name="studio" required />
              <Field label="City" name="city" required />
            </div>
            <div>
              <label className="eyebrow block mb-2">Seller type</label>
              <select
                className="w-full rounded-md border bg-transparent px-4 py-3 text-sm"
                style={{ borderColor: "var(--color-border-strong)" }}
              >
                {[
                  "Independent creator",
                  "Store",
                  "Gallery",
                  "Printmaker",
                  "Photographer",
                  "Studio",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <Field label="Portfolio link (Instagram, website, Behance)" name="portfolio" />
            <div>
              <label className="eyebrow block mb-2">Brief about your work</label>
              <textarea
                rows={4}
                className="w-full rounded-md border bg-transparent px-4 py-3 text-sm"
                style={{ borderColor: "var(--color-border-strong)" }}
              />
            </div>
            <label className="text-xs text-muted-foreground flex gap-2">
              <input type="checkbox" required /> I agree to ArtDera's seller agreement, copyright
              declaration and AI disclosure policy.
            </label>
            <button className="btn-primary mt-2 justify-self-start">Submit application</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="eyebrow block mb-2" htmlFor={name}>
        {label}
        {required && " *"}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-md border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
        style={{ borderColor: "var(--color-border-strong)" }}
      />
    </div>
  );
}
