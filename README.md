# PlaneaDoc

Plataforma web progresiva para crear, gestionar y exportar planeaciones didácticas docentes.

## Stack

- React + Vite
- Tailwind CSS v4
- Supabase Auth + PostgreSQL + RLS
- React Hook Form + Zod
- Exportación Word y PDF
- PWA básica

## Desarrollo local

```bash
pnpm install
pnpm run dev
```

Variables requeridas:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

## Verificación

```bash
pnpm run lint
pnpm run test
pnpm run build
```

O todo junto:

```bash
pnpm run check
```

## Supabase

Ejecuta primero el esquema base de la base de datos y después:

```txt
docs/supabase-rpc-planners.sql
```

Ese script agrega las funciones RPC transaccionales para crear y actualizar planeaciones con secuencias.

## Despliegue recomendado

Recomendado: Vercel conectado a GitHub.

La rama `main` debe configurarse como rama de producción. Cada push a `main` genera un despliegue productivo.

Consulta:

```txt
docs/deployment.md
```
