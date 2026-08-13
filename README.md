# NAWEA — E-Commerce & Management Platform

Plataforma e-commerce y sistema de gestión integral para **NAWEA**, marca de diseño independiente en Buenos Aires especializada en riñoneras, bolsos, carteras, mochilas y accesorios.

---

## 📌 ¿Qué es?

**NAWEA E-Commerce** es una solución web integral compuesta por dos pilares principales:

1. **Tienda Pública (Front-Store)**: Una vitrina digital con una estética *editorial high-fashion*, caracterizada por un diseño minimalista, bordes rectos (*zero-radius corners*), paleta tipográfica refinada (*Bricolage Grotesque* y *DM Sans*) y una experiencia de usuario fluida para navegación de catálogo, filtrado por categorías, lista de deseos, carrito interactivo y proceso de pago.
2. **Panel de Administración (Admin Dashboard)**: Un entorno de gestión interna para administrar productos, categorías, inventario, pedidos, clientes, cupones/promociones y métricas analíticas del negocio en tiempo real.

---

## 💡 ¿Qué problema resuelve?

- **Experiencia de marca diferenciada**: Reemplaza las plantillas genéricas de e-commerce por una interfaz minimalista, elegante y visualmente impactante alineada a la identidad de marca de NAWEA.
- **Gestión centralizada del negocio**: Elimina la fragmentación de herramientas al consolidar en un solo lugar la tienda del cliente y la administración operativa (inventario, catálogo, pedidos y analítica).
- **Flujo de compra optimizado**: Mejora la tasa de conversión con un carrito lateral (drawer), búsqueda instantánea, navegación por categorías y checkout integrado con pasarelas de pago locales (Mercado Pago).
- **Seguridad y escalabilidad**: Proporciona autenticación de usuarios, acceso restringido por roles y persistencia de datos segura mediante la integración con Supabase y políticas de seguridad a nivel de filas (RLS).

---

## 🛠️ Stack Técnico

### Frontend & UI
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilos & Diseño System**: [Tailwind CSS v4](https://tailwindcss.com/), variables CSS en OKLCH (`--cream`, `--ink`, `--stone`), tipografía editorial de Google Fonts (*Bricolage Grotesque* y *DM Sans*).
- **Componentes de Interfaz**: Primitivas accesibles basadas en [Radix UI](https://www.radix-ui.com/) y [shadcn/ui], iconos con [Lucide React](https://lucide.dev/), notificaciones tostada con [Sonner](https://sonner.emilkowal.si/), carruseles con [Embla Carousel](https://www.embla-carousel.com/).
- **Visualización de Datos**: [Recharts](https://recharts.org/) (para gráficos interactivos en el panel de administración).

### Estado & Lógica de Negocio
- **Estado Global Cliente**: React Context (`ShopProvider` para carrito de compras, wishlist y drawers de interfaz).
- **Gestión de Peticiones & Caching**: [TanStack React Query v5](https://tanstack.com/query) (`@tanstack/react-query`).
- **Formularios & Validación**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) (`@hookform/resolvers`).

### Backend, Base de Datos & Pagos
- **BaaS / Base de Datos**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`, `@supabase/ssr`) sobre PostgreSQL con Row Level Security (RLS).
- **Pasarela de Pagos**: SDK oficial de [Mercado Pago](https://www.mercadopago.com.ar/developers) (`mercadopago`).

---

## 🚀 Instrucciones para correrlo localmente

### Prerequisitos
- **Node.js** v18.0 o superior (o [Bun](https://bun.sh/))
- Gestor de paquetes (**npm** o **bun**)

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/nawea-ecommerce.git
cd nawea-ecommerce
```

### 2. Instalar dependencias
Con npm:
```bash
npm install
```

O con Bun:
```bash
bun install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env.local
```

Completa las credenciales necesarias en `.env.local`:
```env
# Supabase (dashboard > Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# Aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=tu_access_token
MERCADO_PAGO_WEBHOOK_SECRET=tu_webhook_secret
```

### 4. Iniciar el servidor de desarrollo
Con npm:
```bash
npm run dev
```

O con Bun:
```bash
bun dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para interactuar con la aplicación.

### 5. Comandos de verificación y construcción
- **Verificación de tipos (TypeScript)**: `npx tsc --noEmit`
- **Linter (ESLint)**: `npm run lint`
- **Compilación de producción**: `npm run build`

---

## 📁 Estructura del Proyecto

```text
nawea-ecommerce/
├── app/                        # Rutas y páginas (Next.js App Router)
│   ├── admin/                  # Panel de administración interno
│   │   ├── analytics/          # Reportes y gráficos de ventas
│   │   ├── categorias/         # ABM de categorías
│   │   ├── clientes/           # Gestión de base de datos de clientes
│   │   ├── dashboard/          # Resumen de métricas principales
│   │   ├── inventario/         # Control y ajuste de stock
│   │   ├── pedidos/            # Listado y detalle de órdenes
│   │   ├── productos/          # Catálogo interno y alta de productos
│   │   └── promociones/        # Gestión de cupones y ofertas
│   ├── api/                    # Endpoints de API (Mercado Pago, Webhooks, etc.)
│   ├── auth/                   # Rutas de autenticación (Login, Registro, Callback)
│   ├── cambios/                # Políticas de cambios y devoluciones
│   ├── catalogo/               # Catálogo completo de productos
│   ├── categoria/[slug]/       # Productos filtrados por categoría
│   ├── checkout/               # Proceso de pago y orden
│   ├── contacto/               # Formulario de contacto
│   ├── cuenta/                 # Perfil del usuario y mis pedidos
│   ├── cuidados/               # Guía de cuidado de artículos
│   ├── envios/                 # Información sobre envíos
│   ├── producto/[slug]/        # Vista detallada de un producto
│   ├── shop/                   # Vista alternativa de tienda
│   ├── globals.css             # Tokens de diseño OKLCH, Tailwind CSS v4 y utilidades
│   ├── layout.tsx              # Layout raíz con fuentes Google Fonts y Providers globales
│   └── page.tsx                # Landing Page principal
├── src/                        # Código fuente modular
│   ├── components/             # Componentes React
│   │   ├── admin/              # Componentes del dashboard (Sidebar, Header, Widgets)
│   │   ├── shop/               # Componentes del e-commerce (Header, ProductCard, CartDrawer)
│   │   └── ui/                 # Primitivas UI reutilizables (shadcn/ui + Radix UI)
│   ├── data/                   # Mock data estático de reserva (`catalog.ts`, `admin.ts`)
│   ├── hooks/                  # Custom React Hooks
│   ├── lib/                    # Utilidades compartidas (`utils.ts`, `format.ts`)
│   ├── store/                  # Estado cliente (`shop.tsx` para carrito, wishlist, drawers)
│   └── types/                  # Definiciones de interfaces e id de TypeScript
├── public/                     # Recursos estáticos (Logos, favicons e imágenes)
├── supabase/                   # Migraciones, esquemas SQL y configuración de Supabase
├── AGENTS.md                   # Documentación de reglas y convenciones de desarrollo
└── package.json                # Dependencias y scripts del proyecto
```

---

## 📄 Licencia

Este proyecto es propiedad privada de **NAWEA**. Todos los derechos reservados.
