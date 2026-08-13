import Link from "next/link";
import { SiteLayout } from "@/components/shop/SiteLayout";

export default function AuthCodeErrorPage() {
  return (
    <SiteLayout>
      <div className="edge min-h-[70vh] flex flex-col items-center justify-center text-center py-20">
        <h1 className="display-xl text-accent">Error de autenticación</h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          Ocurrió un inconveniente al validar tus credenciales de acceso con el proveedor. Por favor volvé a intentarlo.
        </p>
        <Link
          href="/auth/login"
          className="label-sm mt-8 rounded-full bg-foreground px-8 py-4 text-background transition-colors hover:bg-accent"
        >
          Volver a Iniciar Sesión
        </Link>
      </div>
    </SiteLayout>
  );
}
