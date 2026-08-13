"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { products, type Product } from "@/data/catalog";
import { fetchProductsFromDb } from "@/lib/catalog-db";
import { createClient } from "@/lib/supabase/client";

export type CartLine = {
  key: string;
  slug: string;
  color: string;
  size: string;
  qty: number;
};

export type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: Record<string, any> | null;
  city: string | null;
  role: "customer" | "admin";
};

type ShopState = {
  cart: CartLine[];
  favorites: string[];
  cartOpen: boolean;
  searchOpen: boolean;
  menuOpen: boolean;
  lastAdded: string | null;
  user: User | null;
  profile: UserProfile | null;
  loadingUser: boolean;
  addToCart: (p: Product, color: string, size: string, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  setCartOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  subtotal: number;
  shipping: number;
  total: number;
  count: number;
  lineProduct: (line: CartLine) => Product;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const ShopContext = createContext<ShopState | null>(null);

const STORAGE = "nawea.shop.v1";

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  const supabase = useMemo(() => createClient(), []);

  // Cargar catálogo dinámico de Supabase DB
  const loadDbCatalog = useCallback(async () => {
    try {
      const prods = await fetchProductsFromDb();
      if (prods && prods.length > 0) {
        setDbProducts(prods);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadDbCatalog();
  }, [loadDbCatalog]);

  // Unión dinámica de catálogo estático y DB
  const allProducts = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.slug, p));
    dbProducts.forEach((p) => map.set(p.slug, p));
    return Array.from(map.values());
  }, [dbProducts]);

  // Cargar estado guardado en localStorage (invitado)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCart(parsed.cart ?? []);
        setFavorites(parsed.favorites ?? []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Guardar carrito y favoritos en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ cart, favorites }));
    } catch {
      /* ignore */
    }
  }, [cart, favorites]);

  // Obtener perfil del usuario
  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, email, phone, address, city, role")
          .eq("id", userId)
          .single();

        if (!error && data) {
          setProfile(data as UserProfile);
        }
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      }
    },
    [supabase],
  );

  // Sincronizar favoritos de la DB
  const syncDbFavorites = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("favorites")
          .select("products(slug)")
          .eq("customer_id", userId);

        if (!error && data) {
          const dbSlugs = data
            .map((item: any) => item.products?.slug)
            .filter((s: string | undefined): s is string => Boolean(s));

          setFavorites((prevFavs) => {
            const combined = Array.from(new Set([...dbSlugs, ...prevFavs]));

            if (prevFavs.length > 0) {
              supabase
                .from("products")
                .select("id, slug")
                .in("slug", prevFavs)
                .then(({ data: prodRows }) => {
                  if (prodRows && prodRows.length > 0) {
                    const newFavRows = prodRows.map((pr) => ({
                      customer_id: userId,
                      product_id: pr.id,
                    }));
                    supabase
                      .from("favorites")
                      .upsert(newFavRows, { onConflict: "customer_id,product_id" });
                  }
                });
            }
            return combined;
          });
        }
      } catch (err) {
        console.error("Error al sincronizar favoritos con Supabase:", err);
      }
    },
    [supabase],
  );

  // Listener para Auth de Supabase
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (mounted) {
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
          await syncDbFavorites(currentUser.id);
        }
        setLoadingUser(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
        await syncDbFavorites(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoadingUser(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, syncDbFavorites]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    toast.info("Sesión cerrada correctamente");
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const locked = cartOpen || searchOpen || menuOpen;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, searchOpen, menuOpen]);

  const addToCart = useCallback((p: Product, color: string, size: string, qty = 1) => {
    const safeColor = color || p.colors?.[0]?.name || "Único";
    const safeSize = size || p.sizes?.[0] || "Único";
    const key = `${p.slug}|${safeColor}|${safeSize}`;

    // Si el producto no estaba en dbProducts, actualizar dbProducts
    setDbProducts((prev) => {
      if (!prev.some((x) => x.slug === p.slug)) {
        return [...prev, p];
      }
      return prev;
    });

    setCart((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l));
      return [...prev, { key, slug: p.slug, color: safeColor, size: safeSize, qty }];
    });
    setLastAdded(p.slug);
    setCartOpen(true);
    toast.success(`Agregado al carrito`, {
      description: `${p.name} · ${safeColor} (${safeSize})`,
    });
    window.setTimeout(() => setLastAdded(null), 1600);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, qty } : l)),
    );
  }, []);

  const removeLine = useCallback(
    (key: string) => {
      setCart((prev) => prev.filter((l) => l.key !== key));
      toast.info("Producto eliminado del carrito");
    },
    [],
  );

  const toggleFavorite = useCallback(
    async (slug: string) => {
      const targetProd = allProducts.find((p) => p.slug === slug);
      const isFav = favorites.includes(slug);

      setFavorites((prev) => {
        return isFav ? prev.filter((s) => s !== slug) : [...prev, slug];
      });

      if (isFav) {
        toast.info(`Eliminado de tus favoritos`, { description: targetProd?.name || slug });
      } else {
        toast.success(`Añadido a tus favoritos`, { description: targetProd?.name || slug });
      }

      if (user) {
        try {
          const { data: prod } = await supabase
            .from("products")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

          if (prod) {
            if (isFav) {
              await supabase
                .from("favorites")
                .delete()
                .match({ customer_id: user.id, product_id: prod.id });
            } else {
              await supabase
                .from("favorites")
                .upsert(
                  { customer_id: user.id, product_id: prod.id },
                  { onConflict: "customer_id,product_id" }
                );
            }
          }
        } catch (err) {
          console.error("Error al actualizar favoritos en DB:", err);
        }
      }
    },
    [allProducts, favorites, user, supabase],
  );

  const lineProduct = useCallback(
    (line: CartLine) => {
      const found = allProducts.find((p) => p.slug === line.slug);
      if (found) return found;

      return {
        id: line.slug,
        code: "NW-0000",
        slug: line.slug,
        name: "Producto",
        category: "accesorios",
        price: 0,
        colors: [{ name: line.color || "Único", hex: "#000000" }],
        sizes: [line.size || "Único"],
        image: "/placeholder.jpg",
        altImage: "/placeholder.jpg",
        description: "",
        features: [],
        materials: "",
        dimensions: "",
        care: "",
        sku: "SKU-0000",
        stock: 1,
        minStock: 1,
        sold: 0,
        createdAt: "",
        status: "Activo",
      } as Product;
    },
    [allProducts],
  );

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, l) => {
        const p = allProducts.find((x) => x.slug === l.slug);
        return sum + (p ? p.price * l.qty : 0);
      }, 0),
    [cart, allProducts],
  );

  const shipping = subtotal === 0 || subtotal >= 120000 ? 0 : 7900;

  const value: ShopState = {
    cart,
    favorites,
    cartOpen,
    searchOpen,
    menuOpen,
    lastAdded,
    user,
    profile,
    loadingUser,
    addToCart,
    setQty,
    removeLine,
    toggleFavorite,
    isFavorite: (slug) => favorites.includes(slug),
    setCartOpen,
    setSearchOpen,
    setMenuOpen,
    subtotal,
    shipping,
    total: subtotal + shipping,
    count: cart.reduce((n, l) => n + l.qty, 0),
    lineProduct,
    signOut,
    refreshProfile,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
