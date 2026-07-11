import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/artdera";
import { CREATORS, formatPKR } from "@/lib/artdera";

export function ProductCard({ product }: { product: Product }) {
  const creator = CREATORS.find((c) => c.slug === product.creatorSlug);
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-md bg-secondary aspect-[4/5]">
        <img
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.kind === "Original" && (
            <span className="chip" style={{ background: "var(--ink)", color: "var(--ivory)" }}>Original</span>
          )}
          {product.kind === "Limited Edition" && (
            <span className="chip" style={{ background: "var(--porcelain)", color: "var(--ink)" }}>
              Ed. {product.editionOf}
            </span>
          )}
          {product.new && (
            <span className="chip" style={{ background: "var(--terracotta)", color: "var(--ink)" }}>New</span>
          )}
        </div>
      </div>
      <div className="mt-3.5">
        <div className="text-[13px] text-muted-foreground">
          {creator?.name}
        </div>
        <div className="mt-0.5 font-display text-lg leading-snug">{product.title}</div>
        <div className="mt-1 text-sm">
          <span className="font-semibold">{formatPKR(product.price)}</span>
          <span className="text-muted-foreground"> · {product.medium.split(" on ")[0]}</span>
        </div>
      </div>
    </Link>
  );
}
