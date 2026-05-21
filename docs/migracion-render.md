# Migración: Railway → Render

## ¿Qué estamos migrando?

Solo el **game server** (backend Socket.IO). El frontend (Next.js) se queda en Vercel.

Render va a alojar: `node game-server/dist/index.js` via Docker.

---

## Paso 1: Crear cuenta en Render

1. Andá a https://dashboard.render.com
2. Registrate con GitHub (es lo más rápido)
3. **Importante:** Te va a pedir verificación (teléfono o tarjeta). Es normal que pida tarjeta aunque uses plan free — es para verificar que no sos un bot. Avisame si te rechaza y vemos alternativas.

---

## Paso 2: Conectar el repositorio

El archivo `render.yaml` ya está en el repo. Render lo detecta automáticamente.

1. En el dashboard de Render, click **"New +" → "Blueprint"**
2. Conectá tu cuenta de GitHub
3. Elegí el repo `Leem0nStudio/EpicEarthmmo`
4. Render va a leer `render.yaml` y te va a mostrar el servicio a crear
5. Click **"Apply Blueprint"**

Render va a:
1. Clonar el repo
2. Buildear la imagen Docker usando `Dockerfile`
3. Deployar el contenedor
4. Asignarle una URL: `https://epicearthmmo-game-server.onrender.com`

---

## Paso 3: Configurar variables secretas

Las variables marcadas con `sync: false` en `render.yaml` (SUPABASE_URL, SUPABASE_ANON_KEY) NO se configuran desde el archivo — las tenés que poner a mano:

1. En Render, andá a tu servicio → **"Environment"** 
2. Agregá:
   | Variable | Valor |
   |----------|-------|
   | `SUPABASE_URL` | (el mismo que tenés en `.env.local`) |
   | `SUPABASE_ANON_KEY` | (el mismo que tenés en `.env.local`) |

---

## Paso 4: Actualizar el Frontend

En las Environment Variables de Vercel, cambiá:

```env
NEXT_PUBLIC_GAME_SERVER=https://epicearthmmo-game-server.onrender.com
```

También actualizá `.env.local` para desarrollo:
```env
NEXT_PUBLIC_GAME_SERVER=http://localhost:3001
```

---

## Paso 5: Verificar que funciona

1. Abrí el frontend en Vercel
2. Abrí DevTools (F12) → pestaña **Network**
3. Filtra por "ws" (WebSocket)
4. Si ves conexión al puerto 443 de `epicearthmmo-game-server.onrender.com`, está andando

---

## ⚠️ Importante: Free Tier

Render en plan free tiene estas limitaciones:
- El servicio **se apaga después de 15 minutos sin actividad**
- Cuando alguien se conecta, tarda ~30-60 segundos en "despertar"
- La conexión WebSocket puede fallar la primera vez hasta que el server despierte
- Tenés **750 horas/mes** (un server 24/7 consume ~744h, casi todo el límite)

**Si el server no responde:** esperá 1 minuto y recargá la página. La primera conexión del día siempre tarda.

Para evitar el sleep se puede usar un **cronjob** (ping cada 10 min a la URL) o upgradear al plan Starter ($7/mes).

---

## ¿Y Railway?

Una vez que Render esté funcionando:
1. Dejá Railway por ahora como respaldo
2. Cuando confirmes que Render anda, apagá el servicio en Railway
3. No borres Railway hasta que estés 100% seguro

---

## Troubleshooting

### Error "No Dockerfile found"
Asegurate de que `render.yaml` y `Dockerfile` estén en `main` en GitHub.

### Error de conexión WebSocket
- Verificá que `NEXT_PUBLIC_GAME_SERVER` tenga la URL correcta de Render
- Esperá 1 minuto después del deploy (el server tarda en iniciar)
- Si usás plan free, la primera conexión puede fallar por el sleep

### Error 503 / Health check failing
Esperá 2-3 minutos. Render tarda en buildear y deployar la imagen Docker (~2-3 minutos en el primer deploy).

### Quiero ver los logs
En Render dashboard → servicio → **"Logs"** para ver qué dice el server.
