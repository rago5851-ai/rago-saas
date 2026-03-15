# Subir los cambios a Vercel

## Si el proyecto ya está conectado a Vercel

1. Sube los cambios a Git (GitHub, GitLab o Bitbucket):

   ```bash
   git add .
   git commit -m "Descripción de tus cambios"
   git push origin main
   ```

   Usa `main` o la rama configurada como "Production Branch" en Vercel.

2. Vercel detecta el push y lanza un nuevo deploy. Revisa el progreso en el dashboard (Deployments).

3. Si añadiste variables de entorno nuevas, configúralas en:
   - Vercel Dashboard → tu proyecto → **Settings** → **Environment Variables**
   - Añade cada variable y asígnala a Production (y Preview si quieres). Después hay que **redesplegar** para que apliquen.

---

## Si conectas el proyecto por primera vez

1. Sube el código a un repositorio (GitHub / GitLab / Bitbucket) si aún no está.

2. Entra en [vercel.com](https://vercel.com) e inicia sesión.

3. Importa el proyecto:
   - Add New → Project.
   - Conecta la cuenta del repo si te lo pide.
   - Elige el repositorio (ej. rago-saas).
   - Vercel detectará Next.js automáticamente.

4. Configura las variables de entorno antes de desplegar (ver lista en `.env.example`):
   - En la pantalla de importación, abre **Environment Variables**.
   - Añade todas las que uses (Firebase Admin, API Key, NEXT_PUBLIC_* para Google login).

5. Pulsa Deploy. Al terminar tendrás una URL tipo `tu-proyecto.vercel.app`.

---

## Desplegar desde la terminal (Vercel CLI)

1. Instala Vercel CLI: `npm i -g vercel`
2. En la raíz del proyecto: `vercel` (o `vercel --prod` para producción).
3. Sigue las preguntas. Las variables de entorno se gestionan en el Dashboard de Vercel.

---

**Importante:** Las variables `NEXT_PUBLIC_*` se incluyen en el build del cliente; el resto solo en el servidor. No subas `.env` al repo; usa Environment Variables en el dashboard de Vercel.
