import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const paths = [
          "/", "/discover", "/creators", "/collections", "/sell", "/about",
          "/how-it-works", "/buyer-protection", "/journal",
          "/creator/amina-qureshi", "/creator/hamza-nastaliq", "/creator/zara-baig",
          "/product/quiet-horizon", "/product/courtyard-i", "/product/ember-and-ivory",
          "/product/silence-in-script", "/product/hu", "/product/dawn-over-karakoram",
          "/product/geometry-of-a-room", "/product/pomegranate-study",
        ];
        const urls = paths.map((p) => `  <url><loc>${BASE_URL}${p}</loc><changefreq>weekly</changefreq></url>`).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
