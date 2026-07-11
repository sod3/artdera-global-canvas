import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, COLLECTIONS, CREATORS, PRODUCTS, ROOMS, formatPKR, IMAGES } from "@/lib/artdera";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArtDera — Discover Art. Shape Your Space." },
      { name: "description", content: "A curated marketplace for original works, prints, calligraphy, photography and premium wall décor from independent creators and galleries." },
      { property: "og:title", content: "ArtDera — Discover Art. Shape Your Space." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const featured = PRODUCTS.filter((p) => p.featured);
  const editPicks = COLLECTIONS[0].products.map((s) => PRODUCTS.find((p) => p.slug === s)!).filter(Boolean);
  const affordable = PRODUCTS.filter((p) => p.price < 25000);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "var(--ivory)" }}>
        <div className="container-editorial pt-14 pb-20 lg:pt-24 lg:pb-32 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
          <div>
            <div className="eyebrow">A Global Marketplace for Art &amp; Décor</div>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.98] tracking-tight">
              Discover Art. <span style={{ color: "var(--oxblood)" }}>Shape Your Space.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              Explore original works, expressive prints, calligraphy, photography and thoughtfully curated décor from independent creators, studios and galleries — shipped from Pakistan to the world.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/discover" className="btn-primary">Explore the Marketplace</Link>
              <a href="/sell" className="btn-ghost">Sell on ArtDera</a>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-xs text-muted-foreground">
              {["Verified sellers", "Secure payments", "Protected buyer &amp; seller", "AI disclosure required"].map((t) => (
                <span key={t} className="inline-flex items-center gap-2"><Dot /> <span dangerouslySetInnerHTML={{ __html: t }} /></span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-6 grid-rows-6 gap-3 h-[520px] lg:h-[620px]">
              <div className="col-span-4 row-span-4 relative overflow-hidden rounded-lg">
                <img src={IMAGES.heroInterior} alt="Living room with abstract original artwork" className="h-full w-full object-cover" />
              </div>
              <div className="col-span-2 row-span-3 col-start-5 relative overflow-hidden rounded-lg">
                <img src={IMAGES.art1} alt="Original terracotta brushwork" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="col-span-2 row-span-3 col-start-5 row-start-4 relative overflow-hidden rounded-lg">
                <img src={IMAGES.heroStudio} alt="Detail of a painting studio" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="col-span-4 row-span-2 row-start-5 relative overflow-hidden rounded-lg">
                <img src={IMAGES.art3} alt="Fine art photograph of the Karakoram" className="h-full w-full object-cover" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y" style={{ borderColor: "var(--color-border)" }}>
        <div className="container-editorial grid grid-cols-2 md:grid-cols-5 gap-6 py-6 text-xs">
          {[
            ["Verified sellers", "Identity & studio review"],
            ["Secure payments", "Local & international"],
            ["Nationwide delivery", "Careful, tracked shipping"],
            ["Buyer protection", "Applies to eligible orders"],
            ["Originality & AI disclosure", "Every listing labelled"],
          ].map(([t, s]) => (
            <div key={t}>
              <div className="text-foreground font-semibold">{t}</div>
              <div className="text-muted-foreground mt-0.5">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SHOP BY CATEGORY — editorial grid */}
      <section className="container-editorial pt-20">
        <SectionHead
          eyebrow="Browse"
          title="Shop the marketplace"
          subtitle="Six ways in. From one-of-one originals to accessible prints and considered décor."
          cta={["View all", "/discover"]}
        />
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 lg:[grid-template-rows:repeat(2,minmax(0,1fr))]">
          {CATEGORIES.map((c, i) => (
            <a
              key={c.slug}
              href={`/discover?category=${c.slug}`}
              className={`group relative overflow-hidden rounded-lg ${
                i === 0 ? "lg:col-span-2 lg:row-span-2 aspect-[4/5] lg:aspect-auto" : "aspect-[4/5]"
              }`}
            >
              <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 p-4 lg:p-5 text-white">
                <div className="font-display text-lg lg:text-2xl">{c.name}</div>
                {i === 0 && <div className="text-xs opacity-80 mt-1 max-w-xs">{c.blurb}</div>}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* THE ARTDERA EDIT */}
      <section className="container-editorial pt-24">
        <SectionHead
          eyebrow="Curated"
          title="The ArtDera Edit"
          subtitle="A considered selection of works chosen for expressive quality, craftsmanship and the spaces they transform."
          cta={["View the Collection", "/collections/the-artdera-edit"]}
        />
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
          {editPicks.map((p) => (<ProductCard key={p.slug} product={p} />))}
        </div>
      </section>

      {/* ORIGINAL WORKS spotlight */}
      <section className="mt-24" style={{ backgroundColor: "var(--porcelain)" }}>
        <div className="container-editorial py-20 grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="eyebrow">Original works</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">One canvas. One story.<br/>One owner.</h2>
            <p className="mt-5 max-w-lg text-muted-foreground">
              Every original on ArtDera is a single, unrepeatable work. We show you dimensions, medium, year, orientation and the hand that made it — so you can commit with confidence.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-6 max-w-md">
              {[["120+", "Original works"], ["40", "Cities shipped"], ["7-day", "Protected window"]].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display text-3xl">{n}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-tight">{l}</div>
                </div>
              ))}
            </div>
            <a href="/discover?category=original-works" className="btn-primary mt-9">Browse originals</a>
          </div>
          <div className="order-1 lg:order-2 grid grid-cols-5 gap-3 h-[440px]">
            <div className="col-span-3 relative overflow-hidden rounded-lg">
              <img src={IMAGES.art6} alt="Original mixed-media artwork" className="h-full w-full object-cover" loading="lazy"/>
            </div>
            <div className="col-span-2 grid grid-rows-2 gap-3">
              <div className="relative overflow-hidden rounded-lg"><img src={IMAGES.art1} alt="" className="h-full w-full object-cover" loading="lazy"/></div>
              <div className="relative overflow-hidden rounded-lg"><img src={IMAGES.heroStudio} alt="" className="h-full w-full object-cover" loading="lazy"/></div>
            </div>
          </div>
        </div>
      </section>

      {/* ART FOR EVERY SPACE */}
      <section className="container-editorial pt-24">
        <SectionHead eyebrow="By room" title="Art for every space" subtitle="Find work that belongs where you live and work." />
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {ROOMS.map((r) => (
            <a key={r.slug} href={`/discover?room=${r.slug}`} className="group relative overflow-hidden rounded-lg aspect-square">
              <img src={r.image} alt={r.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 text-white text-sm font-semibold">{r.name}</div>
            </a>
          ))}
        </div>
      </section>

      {/* MEET THE CREATORS */}
      <section className="container-editorial pt-24">
        <SectionHead eyebrow="Meet the creators" title="Behind every work is a story" subtitle="Independent artists, printmakers and photographers from across the region." cta={["Meet the Creators", "/creators"]} />
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {CREATORS.map((c) => (
            <Link key={c.slug} to="/creator/$slug" params={{ slug: c.slug }} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                <img src={c.portrait} alt={c.name} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-700" loading="lazy" />
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <div className="font-display text-xl">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.discipline} · {c.location}</div>
                </div>
                {c.verified && <span className="chip" style={{ background: "var(--indigo)", color: "var(--porcelain)" }}>✓ Verified</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* COMMISSIONS */}
      <section className="mt-24" style={{ backgroundColor: "var(--ink)", color: "var(--ivory)" }}>
        <div className="container-editorial py-20">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12">
            <div>
              <div className="eyebrow" style={{ color: "color-mix(in oklab, var(--ivory) 60%, transparent)" }}>Custom Commissions</div>
              <h2 className="mt-3 font-display text-4xl md:text-5xl">Something made<br/>for your wall.</h2>
              <p className="mt-5 opacity-75 max-w-lg text-[15px]">
                Work with a creator on a piece scaled, coloured and composed for your space. A structured, protected process from first sketch to final delivery.
              </p>
              <a href="/discover?category=custom-commissions" className="mt-8 inline-flex btn-primary" style={{ background: "var(--terracotta)", color: "var(--ink)" }}>
                Request a Commission
              </a>
            </div>
            <ol className="grid sm:grid-cols-2 gap-6">
              {[
                ["01", "Share your idea", "Tell us about the space, mood, size and budget."],
                ["02", "Select a creator", "We match you with artists whose work fits your vision."],
                ["03", "Agree on scope", "Approve the concept, price and delivery timeline."],
                ["04", "Follow progress", "See updates as the work develops in studio."],
                ["05", "Approve and pay", "Final approval before the piece ships to you."],
                ["06", "Receive your work", "Delivered carefully, ready to live with."],
              ].map(([n, t, d]) => (
                <li key={n}>
                  <div className="font-display text-2xl opacity-50">{n}</div>
                  <div className="mt-1 font-semibold">{t}</div>
                  <div className="text-sm opacity-70 mt-1">{d}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* AI DISCLOSURE */}
      <section className="container-editorial pt-24">
        <div className="rounded-2xl border p-8 md:p-12 grid md:grid-cols-[1fr_1.5fr] gap-8 items-center" style={{ borderColor: "var(--color-border)", background: "var(--porcelain)" }}>
          <div>
            <div className="eyebrow">AI &amp; emerging creativity</div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">New tools. New expressions.</h2>
          </div>
          <div className="text-[15px] text-muted-foreground">
            <p>
              We welcome responsible AI-assisted work as a distinct category. Every listing declares whether it is <strong className="text-foreground">Original</strong>, <strong className="text-foreground">Handmade</strong>, <strong className="text-foreground">AI-assisted</strong> or <strong className="text-foreground">AI-generated</strong> — so buyers know exactly what they're collecting.
            </p>
            <a href="/authenticity" className="mt-4 inline-block btn-ghost">Read the AI policy</a>
          </div>
        </div>
      </section>

      {/* AFFORDABLE */}
      <section className="container-editorial pt-24">
        <SectionHead eyebrow="Accessible" title="Under PKR 25,000" subtitle="Original and edition works to begin — or extend — a collection." cta={["Shop under PKR 25,000", "/collections/under-25k"]} />
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
          {affordable.slice(0, 4).map((p) => (<ProductCard key={p.slug} product={p} />))}
        </div>
      </section>

      {/* TRADE */}
      <section className="mt-24" style={{ backgroundColor: "var(--indigo)", color: "var(--ivory)" }}>
        <div className="container-editorial py-20 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <div className="eyebrow" style={{ color: "color-mix(in oklab, var(--ivory) 60%, transparent)" }}>Interior designers &amp; business</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Work with ArtDera.</h2>
            <p className="mt-5 max-w-xl opacity-80">
              Sourcing for a hotel, office, restaurant, residence or corporate gifting programme? Our trade team curates original and edition work at scale, with dedicated project support.
            </p>
            <a href="/trade" className="btn-primary mt-8" style={{ background: "var(--ivory)", color: "var(--ink)" }}>Work with us</a>
          </div>
          <div className="grid grid-cols-2 gap-3 h-[380px]">
            <div className="overflow-hidden rounded-lg"><img src={IMAGES.roomDining} alt="Dining room" className="h-full w-full object-cover" loading="lazy"/></div>
            <div className="overflow-hidden rounded-lg"><img src={IMAGES.heroInterior} alt="Living room" className="h-full w-full object-cover" loading="lazy"/></div>
          </div>
        </div>
      </section>

      {/* SELLER INVITE */}
      <section className="container-editorial pt-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[5/4] overflow-hidden rounded-lg">
            <img src={IMAGES.creator1} alt="Artist in her studio" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div>
            <div className="eyebrow">Sell on ArtDera</div>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Your work deserves a wider world.</h2>
            <p className="mt-5 max-w-lg text-muted-foreground">
              Build your storefront, reach serious buyers, and manage products, commissions and orders from one place. Three seller plans, transparent commissions, protected payouts.
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-2xl">
              {[
                ["Starter", "PKR 0/mo", "~15% commission"],
                ["Professional", "from PKR 2,500", "~10–12% commission"],
                ["Gallery", "from PKR 8,000", "~7–9% commission"],
              ].map(([n, p, c]) => (
                <div key={n} className="rounded-lg border p-4" style={{ borderColor: "var(--color-border)" }}>
                  <div className="font-display text-lg">{n}</div>
                  <div className="text-sm mt-1">{p}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c}</div>
                </div>
              ))}
            </div>
            <a href="/sell" className="btn-primary mt-8">Apply to Sell</a>
          </div>
        </div>
      </section>

      {/* JOURNAL */}
      <section className="container-editorial pt-24">
        <SectionHead eyebrow="Journal" title="Stories, guides, quiet ideas" cta={["Read the journal", "/journal"]} />
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            ["Choosing your first original", "A short field guide for new collectors — scale, budget and how to trust your eye.", IMAGES.art1],
            ["Framing calligraphy well", "Materials, mounts and the small choices that let a work breathe.", IMAGES.art2],
            ["Living with photography", "Where fine-art prints belong, and how to hang them.", IMAGES.art3],
          ].map(([t, d, img]) => (
            <a key={t} href="/journal" className="group block">
              <div className="aspect-[4/3] overflow-hidden rounded-lg">
                <img src={img as string} alt="" className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-700" loading="lazy" />
              </div>
              <div className="mt-4 font-display text-xl">{t}</div>
              <div className="text-sm text-muted-foreground mt-1">{d}</div>
            </a>
          ))}
        </div>
      </section>

      {/* BUYER PROTECTION */}
      <section className="container-editorial pt-24 pb-12">
        <div className="rounded-2xl p-8 md:p-12 grid md:grid-cols-[1fr_2fr] gap-10 items-center" style={{ background: "var(--ivory)", border: "1px solid var(--color-border)" }}>
          <div>
            <div className="eyebrow">How ArtDera protects you</div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">Buy with confidence.</h2>
            <a href="/buyer-protection" className="btn-ghost mt-6">Read the details</a>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            {[
              ["Verified sellers", "Identity, studio and portfolio review before a store goes live."],
              ["Protected payouts", "Funds are released to sellers only after a short confirmation window."],
              ["Tracked delivery", "Every order ships with tracking; fragile works are insured above threshold."],
              ["Clear returns & disputes", "A dedicated resolution process, staffed by real people."],
            ].map(([t, d]) => (
              <div key={t}>
                <div className="font-semibold">{t}</div>
                <div className="text-muted-foreground mt-1">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ eyebrow, title, subtitle, cta }: { eyebrow: string; title: string; subtitle?: string; cta?: [string, string] }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="mt-3 font-display text-3xl md:text-4xl lg:text-5xl">{title}</h2>
        {subtitle && <p className="mt-3 text-muted-foreground max-w-xl">{subtitle}</p>}
      </div>
      {cta && (
        <a href={cta[1]} className="btn-ghost">
          {cta[0]}
          <span aria-hidden>→</span>
        </a>
      )}
    </div>
  );
}

function Dot() {
  return <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "var(--terracotta)" }} />;
}
