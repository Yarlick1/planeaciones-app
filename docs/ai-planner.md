# Asistente IA para planeaciones

## Qué hace

El asistente guía al docente para crear una planeación nueva.

Primero pide datos base:

- Fecha inicio.
- Fecha fin.
- Materia.
- Grado y grupo.
- Contenido.
- PDA.

Después genera 3 propuestas por paso:

- Problemática general.
- Finalidades del campo formativo.
- Propósito.
- Ejes articuladores.
- Perfil de egreso.
- Secuencia didáctica.

El docente puede elegir o editar cada propuesta. Al finalizar, se guarda usando el mismo RPC transaccional de planeaciones.

## Flujo técnico

```txt
React Wizard
  -> supabase.functions.invoke('generate-planner-step')
  -> Supabase Edge Function
  -> OpenAI Responses API
  -> JSON estructurado
  -> React Wizard
```

## Variables necesarias

En Supabase Secrets:

```bash
supabase secrets set OPENAI_API_KEY=tu_api_key
supabase secrets set OPENAI_MODEL=gpt-5-mini
```

`OPENAI_MODEL` es opcional. Si no existe, la función usa `gpt-5-mini`.

## Desplegar Edge Function

```bash
supabase functions deploy generate-planner-step
```

## Modo de respaldo local

Mientras la Edge Function no esté desplegada, el frontend usa propuestas locales de prueba.

Esto permite validar el flujo completo sin gastar tokens ni bloquear el desarrollo.

## Seguridad

La API key de OpenAI no se guarda en React ni en variables `VITE_*`.

Debe vivir en Supabase Secrets para que no quede expuesta en el navegador.
