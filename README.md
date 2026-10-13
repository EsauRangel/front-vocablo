# Vocablo

Frontend de Vocablo, creado con React, TypeScript y Vite.

## Ejecutar con Docker

Construye la imagen:

```sh
docker build -t front-cogni .
```

El frontend Docker usa `/api` por defecto. Nginx redirige estas peticiones a
`http://back-cogni:3000`, quitando el prefijo `/api`: por ejemplo,
`/api/decks` llega al backend como `/decks`. El navegador no necesita resolver
nombres internos de Docker y las peticiones tienen el mismo origen.

### Usar el mismo Compose que el backend

Agrega este servicio dentro de `services` en el Compose del backend, despues
de construir la imagen del frontend:

```yaml
  front-cogni:
    image: front-cogni:latest
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      BACKEND_HOST: back-cogni
    depends_on:
      - back-cogni
```

Ambos servicios compartiran la red predeterminada del proyecto Compose.
Ejecuta `docker compose up -d` desde el proyecto del backend y abre
<http://localhost:8080>.

### Conectar un contenedor independiente a la red del backend

Consulta el nombre de la red del backend:

```sh
docker inspect back-cogni --format '{{json .NetworkSettings.Networks}}'
```

Reemplaza `NOMBRE_RED_BACKEND` por el nombre de esa red:

```sh
docker run --rm --network NOMBRE_RED_BACKEND -e BACKEND_HOST=back-cogni -p 8080:8080 front-cogni
```

`BACKEND_HOST` es configurable al iniciar el contenedor. Debe ser el nombre o
alias DNS del backend en una red Docker compartida y el backend debe escuchar
en `0.0.0.0:3000`. Nginx vuelve a resolver su direccion cuando cambia.

`VITE_API_URL` se incorpora durante el build. Para usar una API publica sin el
proxy, puedes sobrescribirlo con `--build-arg VITE_API_URL=https://tu-api.example`.
Cambiar esta variable con `docker run -e` no modifica el JavaScript compilado.
El desarrollo local fuera de Docker conserva `http://localhost:3000`.

La imagen sirve la compilación de producción con Nginx sin privilegios y escucha en el puerto `8080`.
