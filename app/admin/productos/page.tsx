"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Search, Filter, X, Upload, Trash2, Plus, Image as ImageIcon, CheckCircle, Edit3, AlertCircle, PackageCheck } from "lucide-react";
import { AdminPage, StatusPill } from "@/components/admin/AdminUI";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { saveProductAction, deleteProductAction } from "@/lib/admin-actions";

type CategoryItem = {
  id: string;
  slug: string;
  name: string;
};

type ProductRow = {
  id: string;
  code: string;
  slug: string;
  name: string;
  category_id: string;
  price: number;
  compare_at: number | null;
  badge: string | null;
  description: string;
  features: string[];
  materials: string;
  dimensions: string;
  care: string;
  sku: string;
  stock: number;
  reserved: number;
  min_stock: number;
  status: string;
  categories?: { name: string; slug: string };
  product_images?: Array<{ url: string; position: number }>;
  product_colors?: Array<{ name: string; hex: string }>;
  product_sizes?: Array<{ name: string }>;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [categoryFilter, setCategoryFilter] = useState("TODOS");

  // Product Form State
  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState(10000);
  const [compareAt, setCompareAt] = useState<string>("");
  const [badge, setBadge] = useState<string>("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState(10);
  const [minStock, setMinStock] = useState(1);
  const [status, setStatus] = useState("Activo");
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [care, setCare] = useState("");
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [manualUrl, setManualUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);

    const { data: cats } = await supabase.from("categories").select("id, slug, name").order("name");
    if (cats) {
      setCategories(cats);
      if (!categoryId && cats[0]) setCategoryId(cats[0].id);
    }

    const { data: prods } = await supabase
      .from("products")
      .select("*, categories(name, slug), product_images(url, position), product_colors(name, hex), product_sizes(name)")
      .order("created_at", { ascending: false });

    if (prods) setProducts(prods as unknown as ProductRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewForm = () => {
    setEditingProduct(null);
    setCode(`NW-${Date.now().toString().slice(-4)}`);
    setSlug("");
    setName("");
    setPrice(10000);
    setCompareAt("");
    setBadge("");
    setSku(`SKU-${Date.now().toString().slice(-4)}`);
    setStock(10);
    setMinStock(1);
    setStatus("Activo");
    setDescription("");
    setMaterials("Cuero 100% vacuno seleccionado");
    setDimensions("25 cm x 18 cm x 8 cm");
    setCare("Limpieza con paño suave y seco");
    setImagesList([]);
    setManualUrl("");
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (p: ProductRow) => {
    setEditingProduct(p);
    setCode(p.code);
    setSlug(p.slug);
    setName(p.name);
    setCategoryId(p.category_id);
    setPrice(p.price);
    setCompareAt(p.compare_at ? String(p.compare_at) : "");
    setBadge(p.badge || "");
    setSku(p.sku);
    setStock(p.stock);
    setMinStock(p.min_stock);
    setStatus(p.status);
    setDescription(p.description || "");
    setMaterials(p.materials || "");
    setDimensions(p.dimensions || "");
    setCare(p.care || "");

    const existingUrls = p.product_images
      ?.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((img) => img.url) || [];

    setImagesList(existingUrls);
    setManualUrl("");
    setError(null);
    setShowForm(true);
  };

  // Carga de imágenes directamente desde el PC a Supabase Storage
  const handleFileUploadFromPC = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from("product-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadErr) {
          console.warn("Falló carga en Supabase Storage, usando vista directa:", uploadErr);
          const localUrl = URL.createObjectURL(file);
          uploadedUrls.push(localUrl);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            uploadedUrls.push(publicUrlData.publicUrl);
          }
        }
      } catch (err: any) {
        console.error("Error al procesar archivo:", err);
      }
    }

    setImagesList((prev) => [...prev, ...uploadedUrls]);
    setUploading(false);
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    setImagesList((prev) => [...prev, manualUrl.trim()]);
    setManualUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setImagesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name || !slug || !code || !categoryId) {
      setError("Completá todos los campos obligatorios (*)");
      return;
    }

    const formattedImages = imagesList.map((url, index) => ({
      url,
      alt: `${name} ${index + 1}`,
      position: index,
    }));

    const payload = {
      id: editingProduct ? editingProduct.id : undefined,
      code,
      slug: slug.toLowerCase().trim(),
      name,
      category_id: categoryId,
      price,
      compare_at: compareAt ? Number(compareAt) : null,
      badge: badge || null,
      description,
      sku,
      stock,
      min_stock: minStock,
      status,
      features: ["Producción artesanal", "Material premium", "Garantía de satisfacción"],
      materials: materials || "Materiales Seleccionados",
      dimensions: dimensions || "Estándar",
      care: care || "Limpieza con paño seco",
      colors: [{ name: "Negro", hex: "#000000" }],
      sizes: [{ name: "Único" }],
      images: formattedImages,
    };

    startTransition(async () => {
      try {
        await saveProductAction(payload);
        setSuccess(true);
        toast.success(editingProduct ? `Producto "${name}" actualizado` : `Producto "${name}" creado exitosamente`);
        setShowForm(false);
        await loadData();
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        setError(err.message || "Error al guardar el producto");
        toast.error("Error al guardar el producto", { description: err.message });
      }
    });
  };

  const handleDelete = (productId: string, productName: string) => {
    if (!confirm(`¿Eliminar la pieza "${productName}"?`)) return;
    setError(null);

    startTransition(async () => {
      try {
        await deleteProductAction(productId);
        toast.success(`Producto "${productName}" eliminado`);
        await loadData();
      } catch (err: any) {
        setError(err.message || "Error al eliminar el producto");
        toast.error("Error al eliminar el producto", { description: err.message });
      }
    });
  };

  // Productos filtrados para la tabla
  const list = useMemo(() => {
    return products.filter((p) => {
      const matchStatus = statusFilter === "TODOS" || p.status === statusFilter;
      const matchCategory = categoryFilter === "TODOS" || p.category_id === categoryFilter;

      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query);

      return matchStatus && matchCategory && matchSearch;
    });
  }, [products, statusFilter, categoryFilter, searchQuery]);

  return (
    <AdminPage
      title="Productos"
      subtitle={`${list.length} de ${products.length} piezas en el catálogo`}
      actions={
        <button
          type="button"
          onClick={openNewForm}
          className="label-xs bg-foreground px-5 py-3 text-background transition-colors hover:bg-accent cursor-pointer rounded-full font-bold flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Nuevo producto
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400">
          Producto guardado exitosamente.
        </div>
      )}

      {/* FILTROS Y BÚSQUEDA */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU o código..."
              className="w-full rounded-full border border-border bg-card pl-11 pr-10 py-2.5 text-sm outline-none focus:border-foreground transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="label-xs rounded-full border border-border bg-card px-4 py-2.5 outline-none focus:border-foreground cursor-pointer"
            >
              <option value="TODOS">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pestañas por Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-2xl bg-card border border-border no-scrollbar w-full">
          {["TODOS", "Activo", "Borrador", "Archivado"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                "label-xs px-3.5 py-1.5 sm:px-4 sm:py-2 transition-all rounded-2xl shrink-0 cursor-pointer text-xs ",
                statusFilter === st ? "bg-foreground text-background  shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA CON SCROLL VERTICAL FIJO (EVITA CUALQUIER DESFASE DE INTERFAZ) */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando catálogo...</div>
      ) : list.length === 0 ? (
        <div className="py-12 text-center border border-border bg-card rounded-2xl text-sm text-muted-foreground">
          No se encontraron productos con los filtros seleccionados.
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto overflow-x-auto border border-border bg-card rounded-2xl shadow-sm">
          <table className="w-full min-w-[820px] text-sm border-collapse">
            <thead className="sticky top-0 bg-card z-10 border-b border-border shadow-xs">
              <tr>
                {["", "Producto", "Categoría", "Precio", "Stock", "Estado", "Acciones"].map((h, i) => (
                  <th key={i} className="label-xs px-4 py-3.5 text-left text-muted-foreground bg-card">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-cream/70 transition-colors">
                  <td className="py-3 pl-4">
                    <img
                      src={p.product_images?.[0]?.url || "/placeholder.jpg"}
                      alt=""
                      className="h-12 w-10 overflow-hidden bg-cream object-cover rounded-md"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground font-semibold">
                    {p.categories?.name || "Sin categoría"}
                  </td>
                  <td className="px-4 py-4 font-bold tabular-nums">
                    {money(p.price)}
                    {p.compare_at && (
                      <span className="block text-xs font-normal text-muted-foreground line-through">
                        {money(p.compare_at)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 tabular-nums font-semibold">{p.stock}</td>
                  <td className="px-4 py-4">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEditForm(p)}
                        className="label-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        className="label-xs text-red-400 hover:underline cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL OVERLAY PARA CREAR / EDITAR PRODUCTO */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-card border border-border p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-6">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="label-xs text-accent">Gestión de Catálogo</span>
                <h2 className="display-md text-2xl mt-1">
                  {editingProduct ? `Editar "${editingProduct.name}"` : "Crear Nuevo Producto"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              {/* SECCIÓN 1: CARGA DE IMÁGENES DESDE PC */}
              <div className="border border-border bg-cream/40 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="label-xs text-foreground font-bold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-accent" /> Imágenes del Producto
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Subí fotos desde tu computadora o pegá enlaces directos.
                    </p>
                  </div>
                  {uploading && <span className="text-xs text-accent animate-pulse font-medium">Subiendo archivo...</span>}
                </div>

                {/* Zona de Drop & Carga desde PC */}
                <div className="grid gap-4 sm:grid-cols-[1fr_1.5fr]">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:border-foreground hover:bg-card transition-all group">
                    <Upload className="h-8 w-8 text-muted-foreground group-hover:text-foreground mb-2 transition-colors" />
                    <span className="label-xs text-foreground font-semibold">Subir fotos desde la PC</span>
                    <span className="text-[11px] text-muted-foreground mt-1">PNG, JPG, WEBP hasta 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUploadFromPC}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>

                  <div className="space-y-2">
                    <label className="label-xs text-muted-foreground block">O agregar enlace URL directo</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-xs outline-none focus:border-foreground"
                      />
                      <button
                        type="button"
                        onClick={handleAddManualUrl}
                        className="label-xs rounded-full border border-foreground bg-foreground px-4 py-2 text-background hover:bg-accent cursor-pointer"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Galería de imágenes cargadas */}
                {imagesList.length > 0 && (
                  <div className="pt-2">
                    <span className="label-xs text-muted-foreground block mb-2">Imágenes cargadas ({imagesList.length}):</span>
                    <div className="flex flex-wrap gap-3">
                      {imagesList.map((url, i) => (
                        <div key={i} className="relative group h-20 w-16 overflow-hidden rounded-xl border border-border bg-background">
                          <img src={url} alt={`Preview ${i}`} className="h-full w-full object-cover" />
                          {i === 0 && (
                            <span className="absolute bottom-0 inset-x-0 bg-foreground/80 text-background text-[9px] text-center font-bold py-0.5">
                              Principal
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                            title="Eliminar foto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: CAMPOS DEL PRODUCTO */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Nombre de la pieza *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingProduct) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }}
                    required
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none font-medium focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Slug (URL) *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none font-mono focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Código Interno *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none font-mono focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Categoría *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none cursor-pointer focus:border-foreground"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Precio ($) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    required
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none font-semibold focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Precio Comparativo ($)</label>
                  <input
                    type="number"
                    value={compareAt}
                    onChange={(e) => setCompareAt(e.target.value)}
                    placeholder="Opcional"
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">SKU *</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none font-mono focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Stock Inicial *</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    required
                    disabled={Boolean(editingProduct)}
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none disabled:opacity-50 font-semibold focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Estado de Publicación</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none cursor-pointer focus:border-foreground"
                  >
                    <option value="Activo">Activo (Visible en tienda)</option>
                    <option value="Borrador">Borrador (Oculto)</option>
                    <option value="Archivado">Archivado</option>
                  </select>
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Materiales</label>
                  <input
                    type="text"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    placeholder="Ej: Cuero 100% vacuno seleccionado"
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Dimensiones / Medidas</label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    placeholder="Ej: 25 cm x 18 cm x 8 cm"
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Cuidados Recomendados</label>
                  <input
                    type="text"
                    value={care}
                    onChange={(e) => setCare(e.target.value)}
                    placeholder="Ej: Limpiar con paño suave y seco"
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none focus:border-foreground"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="label-xs text-muted-foreground block mb-1">Descripción de la Pieza</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalles sobre materiales, confección y corte..."
                    className="w-full border border-input rounded-xl bg-transparent p-3 text-sm outline-none focus:border-foreground"
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="label-xs border border-border px-6 py-3 rounded-full hover:border-foreground cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || uploading}
                  className="label-sm bg-foreground text-background px-8 py-3 rounded-full hover:bg-accent cursor-pointer disabled:opacity-50 font-bold transition-colors"
                >
                  {isPending ? "Guardando..." : "Guardar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
