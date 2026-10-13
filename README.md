# Vocablo

Frontend de Vocablo, creado con React, TypeScript y Vite.

## Ejecutar con Docker

Construye la imagen y define la URL del API que el navegador podrá alcanzar:

```sh
docker build --build-arg VITE_API_URL=http://localhost:3000 -t front-cogni .
docker run --rm -p 8080:8080 front-cogni
```

Abre <http://localhost:8080>. `VITE_API_URL` se incorpora durante el build; usa la URL pública o accesible desde el navegador para tu backend. Si no se especifica, el frontend conserva su valor predeterminado `http://localhost:3000`.

La imagen sirve la compilación de producción con Nginx sin privilegios y escucha en el puerto `8080`.
