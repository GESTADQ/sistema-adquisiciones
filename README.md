# Sistema de Gestión de Adquisiciones — UEP-IE / MOPC

Proyecto TAPE (BIRF 9517-PY), financiado por el Banco Mundial.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + RLS) como backend
- Deploy en Vercel

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar con las credenciales reales de Supabase
npm run dev
```

## Estructura

- `src/app/login` — inicio de sesión contra Supabase Auth
- `src/app/planificacion` — primer módulo: Plan de Adquisiciones (tabla `llamado`)
- `src/lib/supabase` — clientes de Supabase (browser, server, proxy de sesión)
- `src/proxy.ts` — protege las rutas privadas (Next.js 16 renombró `middleware.js` a `proxy.js`)

## Nota

Este repo se subió inicialmente vía la interfaz web de GitHub (no `git push`) mientras se resolvía
un problema de autorización del proxy de git de la sesión de Cowork. Por eso falta `package-lock.json`
y algunos assets estáticos (`public/*.svg`, favicon) — se regeneran solos con `npm install` y no afectan
el funcionamiento de la app.

