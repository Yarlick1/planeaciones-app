# Despliegue

## Plataforma recomendada

Para PlaneaDoc recomiendo Vercel.

Motivos:

- Detecta proyectos Vite automáticamente.
- Maneja variables de entorno por ambiente.
- Genera previews por branch o pull request.
- Despliega producción desde `main`.
- Funciona bien con React Router usando rewrites.
- Es una mejor opción que GitHub Pages para esta app con Supabase Auth, rutas internas y PWA.

Netlify también es viable. Dejé `netlify.toml` como alternativa.

## Flujo recomendado

```txt
GitHub repo
└─ main
   └─ Vercel Production Deployment
```

Cada push a `main` publicará producción en Vercel.

Las ramas secundarias o pull requests generan previews.

## Preparar GitHub

Desde la carpeta del proyecto:

```bash
git init -b main
git add .
git commit -m "Initial PlaneaDoc app"
```

Crear repositorio en GitHub y conectar el remoto:

```bash
git remote add origin https://github.com/TU_USUARIO/planeadoc.git
git push -u origin main
```

## Configurar Vercel

1. Entra a Vercel.
2. Importa el repositorio de GitHub.
3. Framework Preset: `Vite`.
4. Build Command:

```bash
pnpm run build
```

5. Output Directory:

```bash
dist
```

6. Install Command:

```bash
pnpm install --frozen-lockfile
```

## Variables de entorno en Vercel

Configura estas variables en Project Settings > Environment Variables:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY
```

Agrega ambas al ambiente `Production`.

También puedes agregarlas a `Preview` para probar pull requests.

## Configurar Supabase Auth

En Supabase, ve a Authentication > URL Configuration.

Cuando tengas tu dominio de Vercel, configura:

```txt
Site URL: https://TU_APP.vercel.app
Redirect URLs:
https://TU_APP.vercel.app/*
http://localhost:5173/*
```

## Archivos de despliegue incluidos

`vercel.json`:

- Define build con pnpm.
- Publica `dist`.
- Redirige rutas internas a `index.html`.
- Evita cache agresivo del service worker.

`netlify.toml`:

- Alternativa para Netlify.
- Define build, publish y redirects SPA.

## Checklist antes de publicar

```bash
pnpm run check
```

Revisa además:

- SQL base aplicado en Supabase.
- RPC aplicado desde `docs/supabase-rpc-planners.sql`.
- Edge Function de IA desplegada si usarás asistente con OpenAI.
- `OPENAI_API_KEY` configurada en Supabase Secrets si usarás IA real.
- RLS activo en todas las tablas.
- Variables de entorno configuradas en Vercel.
- URLs de Supabase Auth actualizadas.
