import art1 from "@/assets/art-1.jpg";
import art2 from "@/assets/art-2.jpg";
import art3 from "@/assets/art-3.jpg";
import art4 from "@/assets/art-4.jpg";
import art5 from "@/assets/art-5.jpg";
import art6 from "@/assets/art-6.jpg";
import creator1 from "@/assets/creator-1.jpg";
import creator2 from "@/assets/creator-2.jpg";
import creator3 from "@/assets/creator-3.jpg";
import heroInterior from "@/assets/hero-interior.jpg";
import heroStudio from "@/assets/hero-studio.jpg";
import roomDining from "@/assets/room-dining.jpg";

export const IMAGES = {
  art1,
  art2,
  art3,
  art4,
  art5,
  art6,
  creator1,
  creator2,
  creator3,
  heroInterior,
  heroStudio,
  roomDining,
};

export type Category = { slug: string; name: string; blurb: string; image: string };
export type Creator = {
  slug: string;
  name: string;
  handle: string;
  location: string;
  discipline: string;
  bio: string;
  verified: boolean;
  portrait: string;
  works: string[];
};
export type Product = {
  slug: string;
  title: string;
  creatorSlug: string;
  categorySlug: string;
  price: number;
  currency: "PKR";
  kind: "Original" | "Limited Edition" | "Open Edition" | "Handmade" | "AI-assisted";
  editionOf?: number;
  medium: string;
  dimensions: string;
  year: number;
  framed: boolean;
  colours: string[];
  room: string[];
  description: string;
  images: string[];
  featured?: boolean;
  new?: boolean;
};
export type EditorialCollection = {
  slug: string;
  name: string;
  blurb: string;
  products: string[];
  cover: string;
};

export const CATEGORIES: Category[] = [];
export const CREATORS: Creator[] = [];
export const PRODUCTS: Product[] = [];
export const COLLECTIONS: EditorialCollection[] = [];

// Room names are presentation filters rather than marketplace records.
export const ROOMS = [
  { slug: "living-room", name: "Living Room", image: heroInterior },
  { slug: "bedroom", name: "Bedroom", image: art1 },
  { slug: "dining", name: "Dining", image: roomDining },
  { slug: "office", name: "Office", image: art4 },
  { slug: "hospitality", name: "Hospitality", image: heroStudio },
  { slug: "small-spaces", name: "Small Spaces", image: art5 },
];

function replace<T>(target: T[], source: T[]) {
  target.splice(0, target.length, ...source);
}

export function hydrateEditorialData(input: {
  categories: Category[];
  creators: Creator[];
  products: Product[];
  collections: EditorialCollection[];
}) {
  replace(CATEGORIES, input.categories);
  replace(CREATORS, input.creators);
  replace(PRODUCTS, input.products);
  replace(COLLECTIONS, input.collections);
}

export function getProduct(slug: string) {
  return PRODUCTS.find((product) => product.slug === slug);
}
export function getCreator(slug: string) {
  return CREATORS.find((creator) => creator.slug === slug);
}
export function getCategory(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug);
}
export function productsByCreator(slug: string) {
  return PRODUCTS.filter((product) => product.creatorSlug === slug);
}
export function productsByCategory(slug: string) {
  return PRODUCTS.filter((product) => product.categorySlug === slug);
}
export function formatPKR(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}
