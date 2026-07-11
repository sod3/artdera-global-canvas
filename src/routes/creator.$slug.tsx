import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCreator, productsByCreator } from "@/lib/artdera";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/creator/$slug")({
  loader: ({ params }) => {
    const creator = getCreator(params.slug);
    if (!creator) throw notFound();
    return { creator };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.creator.name} — ArtDera` : "Creator — ArtDera" },
      { name: "description", content: loaderData?.creator.bio.slice(0, 155) },
      { property: "og:title", content: loaderData?.creator.name },
      { property: "og:url", content: loaderData ? `/creator/${loaderData.creator.slug}` : undefined },
      ...(loaderData ? [{ property: "og:image" as const, content: loaderData.creator.portrait }] : []),
    ],
    links: loaderData ? [{ rel: "canonical", href: `/creator/${loaderData.creator.slug}` }] : [],
  }),
  component: CreatorPage,
  notFoundComponent: () => (
    <div className="container-editorial py-24 text-center">
      <h1 className="font-display text-4xl">Creator not found</h1>
      <a href="/creators" className="btn-primary mt-6">Meet the creators</a>
    </div>
  ),
});

function CreatorPage() {
  const { creator } = Route.useLoaderData();
  const works = productsByCreator(creator.slug);

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
              {creator.verified && <span className="chip" style={{ background: "var(--indigo)", color: "var(--porcelain)" }}>✓ Identity verified</span>}
            </div>
            <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground max-w-xl">{creator.bio}</p>
            <div className="mt-8 flex gap-3">
              <button className="btn-primary">Follow studio</button>
              <button className="btn-ghost">Request a commission</button>
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
          {works.map((p) => (<ProductCard key={p.slug} product={p} />))}
        </div>
      </section>
    </div>
  );
}
