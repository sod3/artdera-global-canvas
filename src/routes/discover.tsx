import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { CATEGORIES, CREATORS, PRODUCTS, formatPKR } from "@/lib/artdera";
import { ProductCard } from "@/components/site/ProductCard";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { z } from "zod";

const searchSchema = z.object({
  category: z.string().optional(),
  room: z.string().optional(),
  q: z.string().optional(),
  kind: z.string().optional(),
  color: z.string().optional(),
  framed: z.string().optional(),
  max: z.coerce.number().optional().catch(undefined),
  sort: z.string().optional(),
});

export const Route = createFileRoute("/discover")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Discover - ArtDera" },
      {
        name: "description",
        content:
          "Browse original works, prints, calligraphy, photography and decor from independent creators on ArtDera.",
      },
      { property: "og:title", content: "Discover - ArtDera" },
      { property: "og:url", content: "/discover" },
    ],
    links: [{ rel: "canonical", href: "/discover" }],
  }),
  component: Discover,
});

const KINDS = ["Original", "Limited Edition", "Open Edition", "Handmade", "AI-assisted"] as const;
const SORTS = ["Recommended", "Newest", "Price: low to high", "Price: high to low"] as const;
const COLOURS = ["oxblood", "terracotta", "indigo", "ivory", "ink", "stone", "gold"] as const;

function Discover() {
  const search = useSearch({ from: "/discover" });
  const initialSort = SORTS.includes(search.sort as (typeof SORTS)[number])
    ? (search.sort as (typeof SORTS)[number])
    : "Recommended";
  const [category, setCategory] = useState<string | undefined>(search.category);
  const [query, setQuery] = useState(search.q ?? "");
  const [kinds, setKinds] = useState<string[]>(search.kind ? search.kind.split(",") : []);
  const [selectedColour, setSelectedColour] = useState<string | undefined>(search.color);
  const [framedOnly, setFramedOnly] = useState(search.framed === "true");
  const [maxPrice, setMaxPrice] = useState<number>(search.max ?? 300000);
  const [sort, setSort] = useState<(typeof SORTS)[number]>(initialSort);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search.room) params.set("room", search.room);
    if (query.trim()) params.set("q", query.trim());
    if (kinds.length) params.set("kind", kinds.join(","));
    if (selectedColour) params.set("color", selectedColour);
    if (framedOnly) params.set("framed", "true");
    if (maxPrice < 300000) params.set("max", String(maxPrice));
    if (sort !== "Recommended") params.set("sort", sort);
    const next = params.toString() ? `/discover?${params}` : "/discover";
    window.history.replaceState(null, "", next);
  }, [category, framedOnly, kinds, maxPrice, query, search.room, selectedColour, sort]);

  const filtered = useMemo(() => {
    let list = PRODUCTS.slice();
    const q = query.trim().toLowerCase();
    if (category) list = list.filter((p) => p.categorySlug === category);
    if (kinds.length) list = list.filter((p) => kinds.includes(p.kind));
    if (search.room)
      list = list.filter((p) =>
        p.room.some((r) => r.toLowerCase().replace(/ /g, "-") === search.room),
      );
    if (selectedColour) list = list.filter((p) => p.colours.includes(selectedColour));
    if (framedOnly) list = list.filter((p) => p.framed);
    if (q) {
      list = list.filter((p) => {
        const creator = CREATORS.find((c) => c.slug === p.creatorSlug);
        const categoryName = CATEGORIES.find((c) => c.slug === p.categorySlug)?.name;
        return [
          p.title,
          p.description,
          p.medium,
          p.kind,
          p.colours.join(" "),
          creator?.name,
          creator?.location,
          categoryName,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(q));
      });
    }
    list = list.filter((p) => p.price <= maxPrice);
    if (sort === "Newest") list.sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0));
    if (sort === "Price: low to high") list.sort((a, b) => a.price - b.price);
    if (sort === "Price: high to low") list.sort((a, b) => b.price - a.price);
    return list;
  }, [category, framedOnly, kinds, maxPrice, query, search.room, selectedColour, sort]);

  const activeCategory = category ? CATEGORIES.find((c) => c.slug === category) : undefined;
  const applied = [
    category &&
      (["Category", activeCategory?.name ?? category, () => setCategory(undefined)] as const),
    query.trim() && (["Search", query.trim(), () => setQuery("")] as const),
    ...kinds.map(
      (kind) =>
        [
          "Type",
          kind,
          () => setKinds((values) => values.filter((value) => value !== kind)),
        ] as const,
    ),
    selectedColour && (["Colour", selectedColour, () => setSelectedColour(undefined)] as const),
    framedOnly && (["Framing", "Framed", () => setFramedOnly(false)] as const),
    maxPrice < 300000 &&
      (["Price", `Under ${formatPKR(maxPrice)}`, () => setMaxPrice(300000)] as const),
  ].filter(Boolean);

  const filterPanel = (
    <FilterPanel
      category={category}
      setCategory={setCategory}
      kinds={kinds}
      setKinds={setKinds}
      selectedColour={selectedColour}
      setSelectedColour={setSelectedColour}
      framedOnly={framedOnly}
      setFramedOnly={setFramedOnly}
      maxPrice={maxPrice}
      setMaxPrice={setMaxPrice}
      reset={() => {
        setKinds([]);
        setMaxPrice(300000);
        setCategory(undefined);
        setSelectedColour(undefined);
        setFramedOnly(false);
        setQuery("");
      }}
    />
  );

  return (
    <div className="container-editorial py-10 lg:py-14">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="eyebrow">Discover</div>
          <h1 className="mt-3 font-display text-4xl md:text-5xl">
            {activeCategory ? activeCategory.name : "The full marketplace"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "work" : "works"} from verified creators,
            studios and galleries.
          </p>
        </div>
        <div className="flex gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <button type="button" className="btn-ghost lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[86vh] overflow-y-auto rounded-t-2xl bg-[var(--porcelain)]"
            >
              <SheetHeader className="text-left">
                <SheetTitle>Filter ArtDera</SheetTitle>
                <SheetDescription>
                  Refine by category, creation type, colour, framing and price.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">{filterPanel}</div>
            </SheetContent>
          </Sheet>
          <label className="sr-only" htmlFor="sort">
            Sort results
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
            className="rounded-full border bg-transparent px-4 py-2 text-sm"
            style={{ borderColor: "var(--color-border-strong)" }}
          >
            {SORTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <form
        className="mt-8 flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-3 sm:flex-row"
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor="discover-search" className="sr-only">
          Search marketplace
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="discover-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Describe what belongs on your wall..."
            className="min-h-12 w-full rounded-full border border-transparent bg-white/55 pl-11 pr-4 text-sm outline-none focus:border-[var(--oxblood)]"
          />
        </div>
        <button type="button" onClick={() => setQuery("")} className="btn-ghost sm:w-auto">
          Clear Search
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(undefined)}
          className="chip"
          style={!category ? { background: "var(--ink)", color: "var(--ivory)" } : {}}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug === category ? undefined : c.slug)}
            className="chip"
            style={category === c.slug ? { background: "var(--ink)", color: "var(--ivory)" } : {}}
          >
            {c.name}
          </button>
        ))}
      </div>

      {applied.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Applied:</span>
          {applied.map(([label, value, clear]) => (
            <button
              key={`${label}-${value}`}
              type="button"
              onClick={clear}
              className="chip bg-[var(--porcelain)]"
            >
              {label}: {value} <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="sticky top-32 hidden self-start lg:block">{filterPanel}</aside>

        <div>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--porcelain)] p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ivory)]">
                <Filter className="h-5 w-5 text-[var(--oxblood)]" />
              </div>
              <div className="mt-5 font-display text-3xl">No works match those filters.</div>
              <div className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Your walls may need a wider search. Try removing a category, colour or price limit.
              </div>
              <button
                type="button"
                onClick={() => {
                  setKinds([]);
                  setMaxPrice(300000);
                  setCategory(undefined);
                  setSelectedColour(undefined);
                  setFramedOnly(false);
                  setQuery("");
                }}
                className="btn-primary mt-6"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPanel({
  category,
  setCategory,
  kinds,
  setKinds,
  selectedColour,
  setSelectedColour,
  framedOnly,
  setFramedOnly,
  maxPrice,
  setMaxPrice,
  reset,
}: {
  category: string | undefined;
  setCategory: (category: string | undefined) => void;
  kinds: string[];
  setKinds: Dispatch<SetStateAction<string[]>>;
  selectedColour: string | undefined;
  setSelectedColour: (colour: string | undefined) => void;
  framedOnly: boolean;
  setFramedOnly: (framed: boolean) => void;
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  reset: () => void;
}) {
  return (
    <div className="space-y-8 text-sm">
      <FilterGroup title="Category">
        <div className="grid gap-1">
          {CATEGORIES.map((item) => (
            <button
              type="button"
              key={item.slug}
              onClick={() => setCategory(category === item.slug ? undefined : item.slug)}
              className={`rounded-lg px-3 py-2 text-left transition ${category === item.slug ? "bg-[var(--ink)] text-[var(--ivory)]" : "hover:bg-[var(--porcelain)]"}`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Creation type">
        {KINDS.map((k) => (
          <label key={k} className="flex min-h-9 cursor-pointer items-center gap-2 py-1">
            <input
              type="checkbox"
              checked={kinds.includes(k)}
              onChange={() =>
                setKinds((v) => (v.includes(k) ? v.filter((x) => x !== k) : [...v, k]))
              }
              className="accent-[var(--oxblood)]"
            />
            {k}
          </label>
        ))}
      </FilterGroup>
      <FilterGroup title="Colour">
        <div className="flex flex-wrap gap-2">
          {COLOURS.map((colour) => (
            <button
              key={colour}
              type="button"
              onClick={() => setSelectedColour(selectedColour === colour ? undefined : colour)}
              className={`chip capitalize ${selectedColour === colour ? "ring-2 ring-[var(--oxblood)]" : ""}`}
            >
              {colour}
            </button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Framing">
        <label className="flex min-h-10 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={framedOnly}
            onChange={(event) => setFramedOnly(event.target.checked)}
            className="accent-[var(--oxblood)]"
          />
          Framed or ready to hang
        </label>
      </FilterGroup>
      <FilterGroup title={`Max price: ${formatPKR(maxPrice)}`}>
        <input
          type="range"
          min={5000}
          max={300000}
          step={5000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[var(--oxblood)]"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>PKR 5k</span>
          <span>PKR 300k</span>
        </div>
      </FilterGroup>
      <button
        type="button"
        onClick={reset}
        className="text-xs font-semibold text-muted-foreground underline hover:text-foreground"
      >
        Clear all filters
      </button>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-3">{title}</div>
      <div>{children}</div>
    </div>
  );
}
