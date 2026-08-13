import { createClient } from "@/lib/supabase/client";
import {
  categories as localCategories,
  products as localProducts,
  type Product,
  type Category,
  type CategorySlug,
} from "@/data/catalog";

export async function fetchCategoriesFromDb(): Promise<Category[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return localCategories;
    }

    return data.map((c) => ({
      slug: c.slug as CategorySlug,
      name: c.name,
      index: c.index,
      intro: c.intro,
      image: c.image_url,
    }));
  } catch {
    return localCategories;
  }
}

export async function fetchProductsFromDb(options?: {
  categorySlug?: string;
  status?: string;
  limit?: number;
}): Promise<Product[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from("products")
      .select(`
        *,
        categories!inner(slug, name),
        product_colors(name, hex),
        product_sizes(name),
        product_images(url, alt, position)
      `)
      .eq("status", options?.status ?? "Activo");

    if (options?.categorySlug) {
      query = query.eq("categories.slug", options.categorySlug);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      let filtered = localProducts.filter((p) => p.status === (options?.status ?? "Activo"));
      if (options?.categorySlug) {
        filtered = filtered.filter((p) => p.category === options.categorySlug);
      }
      if (options?.limit) {
        filtered = filtered.slice(0, options.limit);
      }
      return filtered;
    }

    return data.map(mapDbProductToProduct);
  } catch {
    let filtered = localProducts.filter((p) => p.status === (options?.status ?? "Activo"));
    if (options?.categorySlug) {
      filtered = filtered.filter((p) => p.category === options.categorySlug);
    }
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    return filtered;
  }
}

export async function fetchProductBySlugFromDb(slug: string): Promise<Product | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories!inner(slug, name),
        product_colors(name, hex),
        product_sizes(name),
        product_images(url, alt, position)
      `)
      .eq("slug", slug)
      .eq("status", "Activo")
      .single();

    if (error || !data) {
      return localProducts.find((p) => p.slug === slug) ?? null;
    }

    return mapDbProductToProduct(data);
  } catch {
    return localProducts.find((p) => p.slug === slug) ?? null;
  }
}

export async function fetchRelatedProductsFromDb(product: Product, limit = 4): Promise<Product[]> {
  try {
    const allInCat = await fetchProductsFromDb({ categorySlug: product.category });
    const related = allInCat.filter((p) => p.id !== product.id);
    if (related.length >= limit) return related.slice(0, limit);
    const allProds = await fetchProductsFromDb();
    const others = allProds.filter((p) => p.id !== product.id && p.category !== product.category);
    return [...related, ...others].slice(0, limit);
  } catch {
    return localProducts.filter((p) => p.id !== product.id).slice(0, limit);
  }
}

function mapDbProductToProduct(row: any): Product {
  const categorySlug = row.categories?.slug ?? "accesorios";
  const images = (row.product_images ?? []).sort((a: any, b: any) => a.position - b.position);
  const imageUrls: string[] = images.map((img: any) => img.url).filter(Boolean);
  const mainImage = imageUrls[0] ?? "/placeholder.jpg";
  const altImage = imageUrls[1] ?? mainImage;

  const dbColors = Array.isArray(row.product_colors) && row.product_colors.length > 0
    ? row.product_colors
    : [{ name: "Único", hex: "#000000" }];

  const dbSizes = Array.isArray(row.product_sizes) && row.product_sizes.length > 0
    ? row.product_sizes.map((s: any) => s.name)
    : ["Único"];

  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    name: row.name,
    category: categorySlug as CategorySlug,
    price: row.price,
    compareAt: row.compare_at ?? undefined,
    badge: row.badge ?? undefined,
    colors: dbColors,
    sizes: dbSizes,
    image: mainImage,
    altImage: altImage,
    images: imageUrls.length > 0 ? imageUrls : [mainImage],
    description: row.description ?? "",
    features: Array.isArray(row.features) ? row.features : [],
    materials: row.materials ?? "",
    dimensions: row.dimensions ?? "",
    care: row.care ?? "",
    sku: row.sku,
    stock: Math.max(0, row.stock - (row.reserved ?? 0)),
    minStock: row.min_stock ?? 1,
    sold: row.sold ?? 0,
    createdAt: row.created_at ?? "",
    status: row.status ?? "Activo",
  };
}
