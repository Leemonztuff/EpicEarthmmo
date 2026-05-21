# Migración: Railway → Northflank

## ¿Qué estamos migrando?

Solo el **game server** (backend Socket.IO). El frontend (Next.js) se queda en Vercel.

**Railway** aloja: `node game-server/dist/index.js`
**Northflank** va a alojar: lo mismo, pero via Docker.

No hay que tocar Vercel ni el frontend.

---

## Paso 1: Crear cuenta en Northflank

1. Andá a https://app.northflank.com
2. Registrate (GitHub login es lo más rápido)
3. Conectá tu GitHub repo (`Leem0nStudio/EpicEarthmmo`)

---

## Paso 2: Crear el servicio

1. En el dashboard de Northflank, click **"Create" → "Service"**
2. Elegí **"Docker"** como tipo de build
3. Conectá tu repositorio de GitHub
4. Elegí la branch `main`
5. Configuración del build:
   - **Dockerfile path**: `./Dockerfile`
   - **Docker Build Context**: `/` (raíz del repo, default)
6. Configuración del servicio:
   - **Service name**: `epicearthmmo-game-server`
   - **Port**: `3001`
   - **Memory**: 512 MB (suficiente)
7. Click **"Create Service"**

Northflank va a:
1. Clonar el repo
2. Buildear la imagen Docker usando el `Dockerfile`
3. Subir la imagen a su registry
4. Deployar el contenedor
5. Asignarle una URL: `https://epicearthmmo-game-server-xxxx.northflank.app`

Esa URL es la que necesitás para el paso siguiente.

---

## Paso 3: Configurar Variables de Entorno

En la pestaña **"Environment"** del servicio en Northflank, agregá:

| Variable | Valor |
|----------|-------|
| `PORT` | `3001` |
| `SUPABASE_URL` | (el mismo que tenés en Railway/.env.local) |
| `SUPABASE_ANON_KEY` | (el mismo que tenés en Railway/.env.local) |
| `CORS_ORIGIN` | `https://epicearthmmo.vercel.app` (o tu dominio de Vercel) |

---

## Paso 4: Actualizar el Frontend

En tu proyecto de Vercel (o en `.env.local`), cambiá:

**.env.local** (desarrollo local):
```env
NEXT_PUBLIC_GAME_SERVER=http://localhost:3001
```

**Vercel Environment Variables** (producción):
```env
NEXT_PUBLIC_GAME_SERVER=https://epicearthmmo-game-server-xxxx.northflank.app
```

Reemplazá `xxxx` con el ID que te dé Northflank.

---

## Paso 5: Verificar que funciona

1. Abrí el frontend en Vercel
2. Abrí las DevTools (F12) → pestaña Network
3. Filtra por "ws" (WebSocket)
4. Si ves una conexión exitosa al puerto 3001, está andando

---

## Si algo sale mal

### Error: Docker build falla en Northflank
Asegurate de que el archivo `Dockerfile` esté en `main` en GitHub.
Los archivos que creé:

```
📁 raíz del repo
├── Dockerfile          ← build del game server
├── .dockerignore       ← excluye basura del build
├── docs/migracion-northflank.md  ← esta guía
```

### Error: "shared/data not found"
En el `Dockerfile`, la línea `COPY --from=builder /app/shared/data ./shared/data` copia los JSON. Si falta, el server no arranca.

### Error: conexión WebSocket falla
- Verificá que `NEXT_PUBLIC_GAME_SERVER` apunte a la URL correcta de Northflank
- Verificá que el puerto expuesto sea `3001`
- Verificá que no haya CORS bloqueando (necesitás `CORS_ORIGIN`)

---

## ¿Y Railway?

Una vez que Northflank esté funcionando:

1. No borres Railway todavía — mantenelo como respaldo
2. Cuando estés seguro de que Northflank funciona:
   - Apagá el servicio en Railway (o ponelo en modo "sleep")
   - Actualizá la URL en Vercel si no lo hiciste antes
   - Borrá la integración de Railway si querés

---

## Comparativa: Railway vs Dockerfile directo

| | Railway | Northflank (Docker) |
|---|---|---|
| Config | `nixpacks.toml` + `railway.json` | `Dockerfile` |
| Build | Nixpacks (automático) | Docker build |
| Control | Menos control | Control total |
| Healthcheck | `healthcheckPath` en `railway.json` | `HEALTHCHECK` en `Dockerfile` |
| Escalado | Manual | Manual (igual) |

El Dockerfile te da control total sobre qué entra en la imagen. Railway automatizaba eso con Nixpacks, pero Northflank también soporta buildpacks si preferís — la ventaja de Docker es que funcionaría igual en cualquier otro provider (Fly.io, Railway de nuevo, tu propio server, etc.).
