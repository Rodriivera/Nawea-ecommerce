import { notFound } from "next/navigation";
import { fetchProductBySlugFromDb, fetchRelatedProductsFromDb } from "@/lib/catalog-db";
import { ProductDetailView } from "@/components/shop/ProductDetailView";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlugFromDb(slug);
  if (!product) {
    return { title: "Producto no encontrado — NAWEA" };
  }
  return {
    title: `${product.name} — NAWEA`,
    description: product.description.slice(0, 155),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProductBySlugFromDb(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await fetchRelatedProductsFromDb(product, 4);

  return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
}
