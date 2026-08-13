"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Plus, X, Upload, Trash2, Edit3, Image as ImageIcon, AlertCircle, CheckCircle } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminUI";
import { ScrollReveal } from "@/components/shop/ScrollReveal";
import { createClient } from "@/lib/supabase/client";
import { saveCategoryAction, deleteCategoryAction } from "@/lib/admin-actions";
import { cn } from "@/lib/utils";

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  index: string | null;
  intro: string | null;
  image_url: string | null;
  sort_order: number;
  products_count?: number;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [intro, setIntro] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [indexStr, setIndexStr] = useState("");

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const loadCategories = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("categories")
      .select("*, products(id)")
      .order("sort_order", { ascending: true });

    if (!error && data) {
      const formatted = data.map((c: any) => ({
        ...c,
        products_count: Array.isArray(c.products) ? c.products.length : 0,
      }));
      setCategories(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openNewForm = () => {
    if (categories.length >= 6) {
      setError("Se ha alcanzado el límite máximo de 6 categorías en la tienda.");
      return;
    }
    setEditingCategory(null);
    setName("");
    setSlug("");
    setIntro("");
    setImageUrl("");
    setIndexStr(String(categories.length + 1).padStart(2, "0"));
    setError(null);
    setShowForm(true);
  };

  const openEditForm = (cat: CategoryRow) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIntro(cat.intro || "");
    setImageUrl(cat.image_url || "");
    setIndexStr(cat.index || "01");
    setError(null);
    setShowForm(true);
  };

  // Carga de foto de categoría desde PC a Supabase Storage
  const handleFileUploadFromPC = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadErr) {
        console.warn("Falló carga en Storage, usando preview directa:", uploadErr);
        setImageUrl(URL.createObjectURL(file));
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          setImageUrl(publicUrlData.publicUrl);
        }
      }
    } catch (err: any) {
      setError("Error al cargar la imagen desde la PC");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !slug) {
      setError("El nombre y el slug son requeridos.");
      return;
    }

    if (!editingCategory && categories.length >= 6) {
      setError("No podés crear más de 6 categorías (límite máximo alcanzado).");
      return;
    }

    const payload = {
      id: editingCategory ? editingCategory.id : undefined,
      name: name.trim(),
      slug: slug.toLowerCase().trim(),
      intro: intro.trim(),
      image_url: imageUrl || "/placeholder.jpg",
      index: indexStr || "01",
    };

    startTransition(async () => {
      try {
        await saveCategoryAction(payload);
        const msg = editingCategory ? "Categoría actualizada." : "Nueva categoría creada.";
        setSuccess(msg);
        toast.success(msg, { description: name });
        setShowForm(false);
        await loadCategories();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.message || "Error al guardar la categoría");
        toast.error("Error al guardar categoría", { description: err.message });
      }
    });
  };

  const handleDelete = (category: CategoryRow) => {
    if (category.products_count && category.products_count > 0) {
      toast.error(`No se puede eliminar la categoría "${category.name}"`, {
        description: `Tiene ${category.products_count} productos asociados.`,
      });
      return;
    }

    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
    setError(null);

    startTransition(async () => {
      try {
        await deleteCategoryAction(category.id);
        const msg = `Categoría "${category.name}" eliminada.`;
        setSuccess(msg);
        toast.success(msg);
        await loadCategories();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.message || "Error al eliminar la categoría");
        toast.error("Error al eliminar categoría", { description: err.message });
      }
    });
  };

  const maxLimitReached = categories.length >= 6;

  return (
    <AdminPage
      title="Categorías"
      subtitle={`${categories.length} de 6 categorías creadas`}
      actions={
        <button
          type="button"
          disabled={maxLimitReached}
          onClick={openNewForm}
          className={cn(
            "label-xs px-5 py-3 transition-colors cursor-pointer rounded-full font-bold flex items-center gap-2",
            maxLimitReached
              ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
              : "bg-foreground text-background hover:bg-accent",
          )}
          title={maxLimitReached ? "Límite máximo de 6 categorías alcanzado" : "Crear categoría"}
        >
          <Plus className="h-4 w-4" /> Nueva categoría
        </button>
      }
    >
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* BANNER INFORMATIVO DE LÍMITE */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-border bg-card p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="label-xs rounded-full bg-cream px-3 py-1 font-bold">
            {categories.length} / 6 Activas
          </span>
          <p className="text-xs text-muted-foreground">
            {maxLimitReached
              ? "Has alcanzado el límite máximo de 6 categorías configuradas."
              : `Podés agregar ${6 - categories.length} categoría(s) más.`}
          </p>
        </div>
      </div>

      {/* GRILLA DE CATEGORÍAS */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Cargando categorías...</div>
      ) : categories.length === 0 ? (
        <div className="py-12 text-center border border-border bg-card rounded-2xl text-sm text-muted-foreground">
          No hay categorías registradas.
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto pr-2 pb-2 rounded-2xl">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((c, i) => (
              <ScrollReveal key={c.id} variant="fade-up" delay={i * 100} duration={750} className="border border-border bg-card rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
                <div>
                  <div className="aspect-[16/9] overflow-hidden bg-cream relative">
                    <img
                      src={c.image_url || "/placeholder.jpg"}
                      alt={c.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {c.index && (
                      <span className="label-xs absolute top-3 right-3 bg-background/90 px-2.5 py-1 rounded-full font-bold shadow-xs">
                        {c.index}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="display text-xl font-bold">{c.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">/categoria/{c.slug}</p>
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                      {c.intro || "Sin descripción corta agregada."}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0  border-border mt-4 flex items-center justify-between">
                  <span className="label-xs font-semibold">{c.products_count ?? 0} productos</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openEditForm(c)}
                      className="label-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      className="label-xs text-red-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}

      {/* MODAL OVERLAY PARA CREAR / EDITAR CATEGORÍA */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-card border border-border p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-6">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="label-xs text-accent">Gestión de Categorías</span>
                <h2 className="display-md text-2xl mt-1">
                  {editingCategory ? `Editar "${editingCategory.name}"` : "Nueva Categoría"}
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
              
              {/* Carga de Foto desde PC */}
              <div className="border border-border bg-cream/40 p-4 rounded-2xl space-y-3">
                <label className="label-xs text-foreground font-bold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-accent" /> Foto de la Categoría
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {imageUrl ? (
                    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-border bg-background">
                      <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full hover:bg-red-600 cursor-pointer"
                        title="Quitar imagen"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-32 shrink-0 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
                      Sin foto
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <label className="flex items-center justify-center gap-2 border border-border rounded-full py-2 px-4 text-xs font-semibold text-foreground cursor-pointer hover:bg-card transition-colors bg-background">
                      <Upload className="h-3.5 w-3.5" /> Subir foto desde la PC
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUploadFromPC}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="O pegar URL pública de la foto..."
                      className="w-full rounded-full border border-border bg-background px-4 py-2 text-xs outline-none focus:border-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Campos */}
              <div className="space-y-4">
                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Nombre de la Categoría *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingCategory) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }}
                    placeholder="Ej. Carteras, Riñoneras..."
                    required
                    className="w-full border-b border-input bg-transparent py-2 text-sm outline-none font-semibold focus:border-foreground"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                    <label className="label-xs text-muted-foreground block mb-1">Índice (Ej. 01, 02)</label>
                    <input
                      type="text"
                      value={indexStr}
                      onChange={(e) => setIndexStr(e.target.value)}
                      className="w-full border-b border-input bg-transparent py-2 text-sm outline-none font-mono focus:border-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-xs text-muted-foreground block mb-1">Descripción / Texto corto</label>
                  <textarea
                    rows={3}
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                    placeholder="Breve presentación de la colección de productos..."
                    className="w-full border border-input rounded-xl bg-transparent p-3 text-sm outline-none focus:border-foreground"
                  />
                </div>
              </div>

              {/* Acciones */}
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
                  {isPending ? "Guardando..." : "Guardar Categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
