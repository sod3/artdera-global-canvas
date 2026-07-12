import { Facebook, Instagram, Linkedin, type LucideIcon } from "lucide-react";
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
    title: "Buyer Help",
    links: [
      ["How it works", "/how-it-works"],
      ["Buyer protection", "/buyer-protection"],
      ["Wishlist", "/wishlist"],
      ["Messages", "/messages"],
      ["Cart", "/cart"],
      ["Help centre", "/help"],
    ],
  },
  {
    title: "Seller Resources",
    links: [
      ["Sell on ArtDera", "/sell"],
      ["Seller plans", "/sell#plans"],
      ["Commissions", "/discover?category=custom-commissions"],
      ["Creator stories", "/journal"],
      ["Seller support", "/help"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Creators", "/creators"],
      ["Collections", "/collections"],
      ["Journal", "/journal"],
      ["Business services", "/trade"],
    ],
  },
];

export function Footer() {
  return (
    <footer
      style={{ backgroundColor: "var(--ink)", color: "var(--ivory)" }}
      className="relative mt-24 overflow-hidden"
    >
      <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 font-display text-[22vw] leading-none text-white/[0.035]">
        ArtDera
      </div>
      <div className="container-editorial relative py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr_1fr]">
          <div>
            <Logo variant="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/66">
              A Global Marketplace for Art &amp; Decor. A trusted meeting place for independent
              creators, galleries and considered buyers.
            </p>
            <div className="mt-6 flex gap-2">
              {socialLinks.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/45 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {COLS.map((col) => (
              <div key={col.title}>
                <div className="eyebrow text-white/48">{col.title}</div>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-white/72 transition hover:text-white">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-display text-3xl">A More Beautiful Inbox</h4>
            <p className="mt-2 text-sm leading-relaxed text-white/66">
              New collections, creator stories and inspiration for meaningful spaces.
            </p>
            <form className="mt-5 flex gap-2" onSubmit={(event) => event.preventDefault()}>
              <label className="sr-only" htmlFor="footer-email">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                required
                placeholder="you@example.com"
                className="min-h-11 min-w-0 flex-1 rounded-full border border-white/18 bg-transparent px-4 text-sm outline-none placeholder:text-white/35 focus:border-white/60"
              />
              <button
                type="submit"
                className="min-h-11 rounded-full px-4 text-sm font-semibold"
                style={{ background: "var(--terracotta)", color: "var(--ink)" }}
              >
                Join
              </button>
            </form>
            <div className="mt-6 grid gap-2 text-xs text-white/62">
              <FooterSelect label="Ship to" value="Pakistan" />
              <FooterSelect label="Currency" value="PKR" />
              <FooterSelect label="Language" value="English" />
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50">
          <div>© {new Date().getFullYear()} ArtDera. Discover Art. Shape Your Space.</div>
          <div className="flex flex-wrap gap-4">
            <a href="/legal/terms" className="hover:text-white">
              Terms
            </a>
            <a href="/legal/privacy" className="hover:text-white">
              Privacy
            </a>
            <a href="/legal/cookies" className="hover:text-white">
              Cookies
            </a>
            <a href="/legal/copyright" className="hover:text-white">
              Copyright
            </a>
            <a href="/legal/ai-policy" className="hover:text-white">
              AI Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

const socialLinks: Array<{ label: string; Icon: LucideIcon }> = [
  { label: "Instagram", Icon: Instagram },
  { label: "Facebook", Icon: Facebook },
  { label: "LinkedIn", Icon: Linkedin },
];

function FooterSelect({ label, value }: { label: string; value: string }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-full border border-white/12 px-3 py-2">
      <span>{label}</span>
      <select defaultValue={value} className="bg-transparent text-right text-white outline-none">
        <option>{value}</option>
      </select>
    </label>
  );
}
