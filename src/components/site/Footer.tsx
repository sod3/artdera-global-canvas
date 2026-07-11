import { Logo } from "./Logo";

const COLS = [
  {
    title: "Marketplace",
    links: [
      ["Discover", "/discover"],
      ["Original Works", "/discover?category=original-works"],
      ["Prints", "/discover?category=prints"],
      ["Calligraphy", "/discover?category=calligraphy"],
      ["Photography", "/discover?category=photography"],
      ["Custom Commissions", "/discover?category=custom-commissions"],
    ],
  },
  {
    title: "Buyers",
    links: [
      ["How it works", "/how-it-works"],
      ["Buyer protection", "/buyer-protection"],
      ["Interior designers", "/trade"],
      ["Corporate & hospitality", "/trade"],
      ["Gift a work", "/discover"],
      ["Help centre", "/help"],
    ],
  },
  {
    title: "Sellers",
    links: [
      ["Sell on ArtDera", "/sell"],
      ["Seller plans", "/sell#plans"],
      ["Authenticity & AI policy", "/authenticity"],
      ["Success stories", "/journal"],
      ["Seller support", "/help"],
    ],
  },
  {
    title: "ArtDera",
    links: [
      ["About", "/about"],
      ["Journal", "/journal"],
      ["Press", "/about"],
      ["Contact", "/help"],
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--ink)", color: "var(--ivory)" }} className="mt-24">
      <div className="container-editorial py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr_1.2fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed opacity-70">
              A Global Marketplace for Art &amp; Décor. A trusted meeting place for independent creators, galleries and considered buyers.
            </p>
            <div className="mt-6 flex gap-3">
              {["Instagram", "Behance", "LinkedIn"].map((s) => (
                <a key={s} href="#" className="text-xs uppercase tracking-[0.15em] opacity-70 hover:opacity-100 border border-white/15 rounded-full px-3 py-1.5">
                  {s}
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {COLS.map((c) => (
              <div key={c.title}>
                <div className="eyebrow" style={{ color: "color-mix(in oklab, var(--ivory) 60%, transparent)" }}>
                  {c.title}
                </div>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {c.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="opacity-80 hover:opacity-100">{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div>
            <h4 className="font-display text-2xl">A more beautiful inbox.</h4>
            <p className="mt-2 text-sm opacity-70">New collections, creator stories and quiet inspiration — sent monthly.</p>
            <form className="mt-5 flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="flex-1 bg-transparent border border-white/20 rounded-full px-4 py-2.5 text-sm outline-none focus:border-white/60"
              />
              <button type="submit" className="rounded-full px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--terracotta)", color: "var(--ink)" }}>
                Join
              </button>
            </form>
            <div className="mt-6 text-xs opacity-60 space-y-1">
              <div>Ship to: Pakistan · PKR</div>
              <div>Language: English</div>
            </div>
          </div>
        </div>
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs opacity-60">
          <div>© {new Date().getFullYear()} ArtDera. A Global Marketplace for Art &amp; Décor.</div>
          <div className="flex flex-wrap gap-4">
            <a href="/legal/terms">Terms</a>
            <a href="/legal/privacy">Privacy</a>
            <a href="/legal/cookies">Cookies</a>
            <a href="/legal/copyright">Copyright</a>
            <a href="/legal/ai-policy">AI Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
