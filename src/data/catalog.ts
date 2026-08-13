import rinoneraImg from "@/assets/p-rinonera.jpg";
import bolsoImg from "@/assets/p-bolso.jpg";
import carteraImg from "@/assets/p-cartera.jpg";
import mochilaImg from "@/assets/p-mochila.jpg";
import accesoriosImg from "@/assets/p-accesorios.jpg";
import editorial1Img from "@/assets/editorial-1.jpg";
import editorial2Img from "@/assets/editorial-2.jpg";
import heroImg from "@/assets/hero.jpg";
import {
  categoriesData,
  productsData,
  type ImageKey,
  type ProductData,
  type CategoryData,
} from "./catalog-data";

const getSrc = (img: unknown): string =>
  typeof img === "string" ? img : (img as { src: string }).src;

const IMAGE_SOURCES: Record<ImageKey, string> = {
  rinonera: getSrc(rinoneraImg),
  bolso: getSrc(bolsoImg),
  cartera: getSrc(carteraImg),
  mochila: getSrc(mochilaImg),
  accesorios: getSrc(accesoriosImg),
  editorial1: getSrc(editorial1Img),
  editorial2: getSrc(editorial2Img),
  hero: getSrc(heroImg),
};

export const IMAGES = { ...IMAGE_SOURCES, heroVideo: "/hero.webm" };

export type Badge = import("./catalog-data").Badge;
export type CategorySlug = import("./catalog-data").CategorySlug;

export type Product = Omit<ProductData, "image" | "altImage"> & {
  image: string;
  altImage: string;
};

export type Category = Omit<CategoryData, "image"> & { image: string };

export const categories: Category[] = categoriesData.map((c) => ({
  ...c,
  image: IMAGE_SOURCES[c.image],
}));

export const products: Product[] = productsData.map((p) => ({
  ...p,
  image: IMAGE_SOURCES[p.image],
  altImage: IMAGE_SOURCES[p.altImage],
}));

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const byCategory = (slug: CategorySlug) => products.filter((p) => p.category === slug);
export const bestSellers = () => [...products].sort((a, b) => b.sold - a.sold).slice(0, 8);
export const newArrivals = () =>
  [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
export const naweaSelects = () =>
  products.filter((p) => ["p05", "p17", "p04", "p10", "p07", "p15", "p01"].includes(p.id));
export const everydayObjects = () =>
  products.filter((p) => p.category === "accesorios" || p.category === "carteras");
export const related = (p: Product) =>
  products.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4);
