# Registro de Horas

App para registrar horas de trabajo por proyecto y empleado. Despliega en **Vercel** y guarda los datos en **Supabase**.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # Rellena con tu Supabase URL y anon key
npm run dev
```

## Publicar en Vercel con Supabase (paso a paso)

### 1. Crear proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) e inicia sesión.
2. **New project** → nombre, contraseña de DB, región → **Create**.
3. En el menú: **SQL Editor** → **New query**.
4. Copia todo el contenido de `supabase-schema.sql` (en esta carpeta), pégalo y pulsa **Run**.
5. Ve a **Project Settings** (engranaje) → **API**. Anota:
   - **Project URL**
   - **anon public** (clave pública)

### 2. Variables de entorno en tu máquina

Crea `prototipo-horas-app/.env.local`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

(Usa la URL y la clave anon de Supabase.)

### 3. Subir el código a GitHub

En la carpeta del proyecto:

```bash
cd ~/Downloads/prototipo-horas-app
git init
git add .
git commit -m "Registro de horas con Supabase"
git branch -M main
```

Crea un repositorio nuevo en [github.com](https://github.com) (por ejemplo `prototipo-horas`) y luego:

```bash
git remote add origin https://github.com/TU_USUARIO/prototipo-horas.git
git push -u origin main
```

(Sustituye `TU_USUARIO` y `prototipo-horas` por los tuyos.)

### 4. Desplegar en Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión (por ejemplo con GitHub).
2. **Add New** → **Project**.
3. Importa el repositorio que acabas de subir.
4. En **Environment Variables** añade:
   - `VITE_SUPABASE_URL` = tu Project URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
5. **Deploy**.

Tu app quedará en una URL tipo `https://prototipo-horas-xxx.vercel.app`. Los datos se guardan en Supabase y son permanentes.

## Sin Supabase

Si no configuras las variables de entorno, la app usa datos de ejemplo en memoria (se pierden al recargar).
