import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { CATEGORIES, PRODUCTS, formatPKR } from "@/lib/artdera";
import { ProductCard } from "@/components/site/ProductCard";
import { z } from "zod";

const searchSchema = z.object({
  category: z.string().optional(),
  room: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/discover")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Discover — ArtDera" },
      { name: "description", content: "Browse original works, prints, calligraphy, photography and décor from independent creators on ArtDera." },
      { property: "og:title", content: "Discover — ArtDera" },
      { property: "og:url", content: "/discover" },
    ],
    links: [{ rel: "canonical", href: "/discover" }],
  }),
  component: Discover,
});

const KINDS = ["Original", "Limited Edition", "Open Edition", "Handmade", "AI-assisted"] as const;
const SORTS = ["Recommended", "Newest", "Price: low to high", "Price: high to low"] as const;

function Discover() {
  const search = useSearch({ from: "/discover" });
  const [category, setCategory] = useState<string | undefined>(search.category);
  const [kinds, setKinds] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(300000);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Recommended");

  const filtered = useMemo(() => {
    let list = PRODUCTS.slice();
    if (category) list = list.filter((p) => p.categorySlug === category);
    if (kinds.length) list = list.filter((p) => kinds.includes(p.kind));
    if (search.room) list = list.filter((p) => p.room.some((r) => r.toLowerCase().replace(/ /g, "-") === search.room));
    list = list.filter((p) => p.price <= maxPrice);
    if (sort === "Newest") list.sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0));
    if (sort === "Price: low to high") list.sort((a, b) => a.price - b.price);
    if (sort === "Price: high to low") list.sort((a, b) => b.price - a.price);
    return list;
  }, [category, kinds, maxPrice, sort, search.room]);

  const activeCategory = category ? CATEGORIES.find((c) => c.slug === category) : undefined;

  return (
    <div className="container-editorial py-12 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Discover</div>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            {activeCategory ? activeCategory.name : "The full marketplace"}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm">
            {filtered.length} {filtered.length === 1 ? "work" : "works"} · showing curated pieces from verified creators
          </p>
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded-full border px-4 py-2 text-sm bg-transparent" style={{ borderColor: "var(--color-border-strong)" }}>
          {SORTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Category chips */}
      <div className="mt-8 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(undefined)}
          className={`chip ${!category ? "text-white" : ""}`}
          style={!category ? { background: "var(--ink)", color: "var(--ivory)" } : {}}
        >All</button>
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug === category ? undefined : c.slug)}
            className="chip"
            style={category === c.slug ? { background: "var(--ink)", color: "var(--ivory)" } : {}}
          >{c.name}</button>
        ))}
      </div>

      <div className="mt-10 grid lg:grid-cols-[240px_1fr] gap-10">
        {/* Filters */}
        <aside className="space-y-8 text-sm">
          <FilterGroup title="Kind">
            {KINDS.map((k) => (
              <label key={k} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kinds.includes(k)}
                  onChange={() => setKinds((v) => v.includes(k) ? v.filter((x) => x !== k) : [...v, k])}
                  className="accent-[var(--oxblood)]"
                />
                {k}
              </label>
            ))}
          </FilterGroup>
          <FilterGroup title={`Max price: ${formatPKR(maxPrice)}`}>
            <input type="range" min={5000} max={300000} step={5000} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[var(--oxblood)]" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>PKR 5k</span><span>PKR 300k</span>
            </div>
          </FilterGroup>
          <button onClick={() => { setKinds([]); setMaxPrice(300000); setCategory(undefined); }} className="text-xs underline text-muted-foreground hover:text-foreground">Reset filters</button>
        </aside>

        {/* Grid */}
        <div>
          {filtered.length === 0 ? (
            <div className="rounded-lg border p-12 text-center" style={{ borderColor: "var(--color-border)" }}>
              <div className="font-display text-2xl">No works match those filters.</div>
              <div className="text-sm text-muted-foreground mt-2">Try widening your price range or removing a category.</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-12">
              {filtered.map((p) => (<ProductCard key={p.slug} product={p} />))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-3">{title}</div>
      <div>{children}</div>
    </div>
  );
}
