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
  art1, art2, art3, art4, art5, art6,
  creator1, creator2, creator3,
  heroInterior, heroStudio, roomDining,
};

export type Category = {
  slug: string;
  name: string;
  blurb: string;
  image: string;
};

export const CATEGORIES: Category[] = [
  { slug: "original-works", name: "Original Works", blurb: "One-of-one pieces from studios across the region.", image: art1 },
  { slug: "prints", name: "Prints", blurb: "Limited and open editions on museum-grade paper.", image: art4 },
  { slug: "calligraphy", name: "Calligraphy", blurb: "Contemporary and classical script traditions.", image: art2 },
  { slug: "photography", name: "Photography", blurb: "Fine art photography, hand-printed and signed.", image: art3 },
  { slug: "wall-decor", name: "Wall Décor", blurb: "Considered objects that complete a wall.", image: art6 },
  { slug: "custom-commissions", name: "Custom Commissions", blurb: "Work with a creator on something made for you.", image: art5 },
];

export type Creator = {
  slug: string;
  name: string;
  handle: string;
  location: string;
  discipline: string;
  bio: string;
  verified: boolean;
  portrait: string;
  works: string[]; // product slugs
};

export const CREATORS: Creator[] = [
  {
    slug: "amina-qureshi",
    name: "Amina Qureshi",
    handle: "@amina.studio",
    location: "Lahore, Pakistan",
    discipline: "Abstract painting, mixed media",
    bio: "Amina works with earth pigments and oil on linen, drawing on the domestic textures of Walled City courtyards. Her practice explores memory, negative space and the quiet weight of colour.",
    verified: true,
    portrait: creator1,
    works: ["quiet-horizon", "courtyard-i", "ember-and-ivory"],
  },
  {
    slug: "hamza-nastaliq",
    name: "Hamza Nastaliq",
    handle: "@hamza.nastaliq",
    location: "Karachi, Pakistan",
    discipline: "Calligraphy, ink on paper",
    bio: "Hamza practices Nastaliq and free-form script, letting words dissolve into gesture. Each work is hand-inked on aged wasli paper and finished with a personal seal.",
    verified: true,
    portrait: creator2,
    works: ["silence-in-script", "hu"],
  },
  {
    slug: "zara-baig",
    name: "Zara Baig",
    handle: "@zara.frames",
    location: "Islamabad, Pakistan",
    discipline: "Fine art photography",
    bio: "Zara photographs the northern mountains at first and last light, printing in small signed editions on Hahnemühle rag.",
    verified: true,
    portrait: creator3,
    works: ["dawn-over-karakoram"],
  },
];

export type Product = {
  slug: string;
  title: string;
  creatorSlug: string;
  categorySlug: string;
  price: number; // PKR
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

export const PRODUCTS: Product[] = [
  {
    slug: "quiet-horizon",
    title: "Quiet Horizon, No. 4",
    creatorSlug: "amina-qureshi",
    categorySlug: "original-works",
    price: 185000,
    currency: "PKR",
    kind: "Original",
    medium: "Oil and earth pigment on linen",
    dimensions: "90 × 110 cm",
    year: 2025,
    framed: false,
    colours: ["oxblood", "ivory"],
    room: ["Living room", "Hospitality"],
    description:
      "A single terracotta stroke drifting across an ivory field. Painted in one session at first light, the work is about restraint — how much can be said with almost nothing.",
    images: [art1, roomDining],
    featured: true,
    new: true,
  },
  {
    slug: "courtyard-i",
    title: "Courtyard I",
    creatorSlug: "amina-qureshi",
    categorySlug: "original-works",
    price: 240000,
    currency: "PKR",
    kind: "Original",
    medium: "Mixed media on linen with gold leaf",
    dimensions: "100 × 80 cm",
    year: 2025,
    framed: false,
    colours: ["oxblood", "ivory", "gold"],
    room: ["Living room", "Dining"],
    description:
      "A study of a Walled City courtyard rendered in plaster, oxblood wash and applied gold leaf. Part of the ongoing Domestic Interior series.",
    images: [art6],
    featured: true,
  },
  {
    slug: "ember-and-ivory",
    title: "Ember & Ivory (Study)",
    creatorSlug: "amina-qureshi",
    categorySlug: "prints",
    price: 18500,
    currency: "PKR",
    kind: "Limited Edition",
    editionOf: 40,
    medium: "Giclée on 310gsm Hahnemühle rag",
    dimensions: "50 × 70 cm",
    year: 2025,
    framed: false,
    colours: ["oxblood", "ivory"],
    room: ["Bedroom", "Office"],
    description:
      "A signed and numbered giclée edition of the Ember & Ivory study, printed with archival pigment inks. Each print is stamped, signed and includes a certificate of edition.",
    images: [art1],
    new: true,
  },
  {
    slug: "silence-in-script",
    title: "Silence, in Script",
    creatorSlug: "hamza-nastaliq",
    categorySlug: "calligraphy",
    price: 62000,
    currency: "PKR",
    kind: "Original",
    medium: "Sumi ink on aged wasli paper",
    dimensions: "40 × 55 cm",
    year: 2025,
    framed: true,
    colours: ["ink", "ivory"],
    room: ["Office", "Living room"],
    description:
      "A single word inked in free-form Nastaliq, allowed to breathe on hand-finished wasli. Framed in warm oak with museum glass.",
    images: [art2],
    featured: true,
  },
  {
    slug: "hu",
    title: "Hu — کن",
    creatorSlug: "hamza-nastaliq",
    categorySlug: "calligraphy",
    price: 14000,
    currency: "PKR",
    kind: "Open Edition",
    medium: "Fine art print on cotton rag",
    dimensions: "30 × 40 cm",
    year: 2024,
    framed: false,
    colours: ["ink", "ivory"],
    room: ["Bedroom", "Small spaces"],
    description:
      "An accessible open edition of Hamza's Hu study, printed on natural cotton rag. Stamped by the studio; unframed.",
    images: [art2],
  },
  {
    slug: "dawn-over-karakoram",
    title: "Dawn over Karakoram",
    creatorSlug: "zara-baig",
    categorySlug: "photography",
    price: 42000,
    currency: "PKR",
    kind: "Limited Edition",
    editionOf: 12,
    medium: "Archival pigment print on Hahnemühle Photo Rag",
    dimensions: "60 × 45 cm",
    year: 2024,
    framed: false,
    colours: ["indigo", "ivory"],
    room: ["Living room", "Hospitality", "Office"],
    description:
      "First light on the Karakoram range, photographed on a medium-format film camera and hand-printed in an edition of twelve. Signed and numbered on the verso.",
    images: [art3],
    featured: true,
  },
  {
    slug: "geometry-of-a-room",
    title: "Geometry of a Room",
    creatorSlug: "amina-qureshi",
    categorySlug: "prints",
    price: 9500,
    currency: "PKR",
    kind: "Open Edition",
    medium: "Giclée print on matte paper",
    dimensions: "40 × 50 cm",
    year: 2025,
    framed: false,
    colours: ["terracotta", "indigo", "stone"],
    room: ["Bedroom", "Small spaces", "Office"],
    description:
      "A quiet geometric print in muted stone, deep indigo and burnished terracotta — designed to sit softly in smaller spaces.",
    images: [art4],
    new: true,
  },
  {
    slug: "pomegranate-study",
    title: "Pomegranate Study",
    creatorSlug: "amina-qureshi",
    categorySlug: "wall-decor",
    price: 12000,
    currency: "PKR",
    kind: "Limited Edition",
    editionOf: 60,
    medium: "Ink and watercolour print on cotton rag",
    dimensions: "30 × 40 cm",
    year: 2025,
    framed: false,
    colours: ["oxblood", "ivory"],
    room: ["Dining", "Small spaces"],
    description:
      "A botanical ink and watercolour study of pomegranate, a recurring motif in Amina's studio. Printed on cotton rag and stamped by the studio.",
    images: [art5],
  },
];

export const COLLECTIONS = [
  {
    slug: "the-artdera-edit",
    name: "The ArtDera Edit",
    blurb:
      "A considered selection of works chosen for expressive quality, craftsmanship and the spaces they transform.",
    products: ["quiet-horizon", "silence-in-script", "dawn-over-karakoram", "courtyard-i"],
    cover: art1,
  },
  {
    slug: "under-25k",
    name: "Under PKR 25,000",
    blurb: "Original and edition works to begin — or extend — a collection.",
    products: ["ember-and-ivory", "hu", "geometry-of-a-room", "pomegranate-study"],
    cover: art4,
  },
];

export const ROOMS = [
  { slug: "living-room", name: "Living Room", image: heroInterior },
  { slug: "bedroom", name: "Bedroom", image: art1 },
  { slug: "dining", name: "Dining", image: roomDining },
  { slug: "office", name: "Office", image: art4 },
  { slug: "hospitality", name: "Hospitality", image: heroStudio },
  { slug: "small-spaces", name: "Small Spaces", image: art5 },
];

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}
export function getCreator(slug: string) {
  return CREATORS.find((c) => c.slug === slug);
}
export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}
export function productsByCreator(slug: string) {
  return PRODUCTS.filter((p) => p.creatorSlug === slug);
}
export function productsByCategory(slug: string) {
  return PRODUCTS.filter((p) => p.categorySlug === slug);
}
export function formatPKR(n: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);
}
