import { createFileRoute } from "@tanstack/react-router";
import { getCreator, productsByCreator } from "@/lib/artdera";
import { ProductCard } from "@/components/site/ProductCard";
import { toast } from "sonner";
import { useAuth } from "@/marketplace/auth";
import { ARTWORKS, STORES } from "@/marketplace/data";
import { FollowService, MessageService } from "@/marketplace/services";

export const Route = createFileRoute("/creator/$slug")({
  head: ({ params }) => {
    const creator = getCreator(params.slug);
    return {
      meta: [
        { title: creator ? `${creator.name} — ArtDera` : "Creator — ArtDera" },
        { name: "description", content: creator?.bio.slice(0, 155) },
        { property: "og:title", content: creator?.name },
        { property: "og:url", content: creator ? `/creator/${creator.slug}` : undefined },
        ...(creator ? [{ property: "og:image" as const, content: creator.portrait }] : []),
      ],
      links: creator ? [{ rel: "canonical", href: `/creator/${creator.slug}` }] : [],
    };
  },
  component: CreatorPage,
  notFoundComponent: () => (
    <div className="container-editorial py-24 text-center">
      <h1 className="font-display text-4xl">Creator not found</h1>
      <a href="/creators" className="btn-primary mt-6">
        Meet the creators
      </a>
    </div>
  ),
});

function CreatorPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const creator = getCreator(slug);
  if (!creator)
    return <div className="container-editorial py-24 text-center"><h1 className="font-display text-4xl">Creator not found</h1><a href="/creators" className="btn-primary mt-6">Meet the creators</a></div>;
  const works = productsByCreator(creator.slug);
  const firstArtwork = ARTWORKS.find((artwork) => works.some((work) => work.slug === artwork.slug));
  const store = STORES.find((item) => item.slug === creator.slug) ?? STORES.find((item) => item.id === firstArtwork?.storeId);
  const requireAccount = () => {
    if (!user) {
      window.location.assign(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return false;
    }
    return true;
  };

  return (
    <div>
      <section style={{ background: "var(--porcelain)" }}>
        <div className="container-editorial py-16 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <div className="eyebrow">Creator profile</div>
            <h1 className="mt-3 font-display text-5xl md:text-6xl">{creator.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="chip">{creator.discipline}</span>
              <span className="chip">{creator.location}</span>
              {creator.verified && (
                <span
                  className="chip"
                  style={{ background: "var(--indigo)", color: "var(--porcelain)" }}
                >
                  ✓ Identity verified
                </span>
              )}
            </div>
            <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground max-w-xl">
              {creator.bio}
            </p>
            <div className="mt-8 flex gap-3">
              <button onClick={() => void (async () => { if (!requireAccount() || !store) return; const result = await FollowService.follow(store.id); result.error ? toast.error(result.error.message) : toast.success("Studio followed"); })()} className="btn-primary">Follow studio</button>
              <button onClick={() => void (async () => { if (!requireAccount() || !store) return; const result = await MessageService.createConversation(store.id, firstArtwork?.id, "Commission request: I would like to discuss a custom work."); if (result.error) toast.error(result.error.message); else window.location.assign(`/messages?conversation=${result.data!.id}`); })()} className="btn-ghost">Request a commission</button>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                [works.length.toString(), "Works available"],
                ["100%", "On-time fulfilment"],
                ["< 24h", "Response time"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display text-3xl">{n}</div>
                  <div className="text-xs text-muted-foreground mt-1">{l}</div>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
            <img src={creator.portrait} alt={creator.name} className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="container-editorial py-16">
        <div className="eyebrow">Work</div>
        <h2 className="mt-3 font-display text-3xl">Selected pieces from the studio</h2>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-12">
          {works.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
