import { useState } from "react";
import { Logo } from "./Logo";

const NAV = [
  { label: "Discover", href: "/discover" },
  { label: "Original Works", href: "/discover?category=original-works" },
  { label: "Prints", href: "/discover?category=prints" },
  { label: "Calligraphy", href: "/discover?category=calligraphy" },
  { label: "Photography", href: "/discover?category=photography" },
  { label: "Creators", href: "/creators" },
  { label: "Collections", href: "/collections" },
];

export function Announcement() {
  return (
    <div style={{ backgroundColor: "var(--ink)", color: "var(--ivory)" }} className="text-[11px] tracking-[0.15em] uppercase">
      <div className="container-editorial flex items-center justify-center gap-6 py-2 overflow-hidden">
        <span className="hidden sm:inline opacity-80">Nationwide delivery across Pakistan</span>
        <span className="hidden md:inline opacity-40">·</span>
        <span className="opacity-80">Protected seller payouts</span>
        <span className="hidden md:inline opacity-40">·</span>
        <a href="/sell" className="hidden md:inline underline-offset-4 hover:underline">
          Apply to sell on ArtDera
        </a>
      </div>
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md" style={{ background: "color-mix(in oklab, var(--ivory) 88%, transparent)" }}>
      <Announcement />
      <div className="hairline">
        <div className="container-editorial flex items-center justify-between h-16">
          <div className="flex items-center gap-10">
            <Logo />
            <nav className="hidden lg:flex items-center gap-7 text-sm">
              {NAV.slice(0, 6).map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-foreground/80 hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-1.5">
            <a href="/discover" aria-label="Search" className="p-2.5 hover:bg-secondary rounded-full transition">
              <SearchIcon />
            </a>
            <a href="/wishlist" aria-label="Wishlist" className="p-2.5 hover:bg-secondary rounded-full transition hidden sm:inline-flex">
              <HeartIcon />
            </a>
            <a href="/auth/login" aria-label="Account" className="p-2.5 hover:bg-secondary rounded-full transition hidden sm:inline-flex">
              <UserIcon />
            </a>
            <a href="/cart" aria-label="Cart" className="p-2.5 hover:bg-secondary rounded-full transition">
              <BagIcon />
            </a>
            <a href="/sell" className="btn-dark ml-2 hidden md:inline-flex">
              Sell on ArtDera
            </a>
            <button
              className="lg:hidden p-2.5 hover:bg-secondary rounded-full"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </div>
      {open && (
        <div className="lg:hidden hairline">
          <div className="container-editorial py-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2 text-base"
              >
                {item.label}
              </a>
            ))}
            <a href="/sell" className="btn-dark mt-3 self-start" onClick={() => setOpen(false)}>
              Sell on ArtDera
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function SearchIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>); }
function HeartIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>); }
function UserIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>); }
function BagIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>); }
function MenuIcon() { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>); }
