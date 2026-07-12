import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist - ArtDera" },
      {
        name: "description",
        content: "Save artworks, prints and decor you are considering on ArtDera.",
      },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  return (
    <div className="container-editorial py-16">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--porcelain)] shadow-[var(--shadow-soft)]">
          <Heart className="h-6 w-6 text-[var(--oxblood)]" />
        </div>
        <div className="eyebrow mt-8">Wishlist</div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl">Your walls are waiting.</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Save original works, prints and decor while you compare scale, colour and placement for
          your space.
        </p>
        <a href="/discover" className="btn-primary mt-7">
          Explore Art
        </a>
      </div>
    </div>
  );
}
