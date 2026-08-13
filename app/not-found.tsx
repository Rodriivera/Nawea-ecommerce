import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="display text-[clamp(4rem,18vw,11rem)]">404</h1>
        <h2 className="label-sm mt-4">Página no encontrada</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          La pieza que buscás no existe o cambió de lugar.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="label-xs inline-flex items-center justify-center bg-foreground px-6 py-4 text-background transition-colors hover:bg-accent"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
