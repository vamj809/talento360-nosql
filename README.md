# Talento360 NoSQL

Mini-aplicacion academica para el proyecto final de MBD-106 - Bases de Datos NoSQL. Resuelve el problema 30: plataforma de evaluacion de desempeno 360 para Recursos Humanos.

## Caso empresarial

Una empresa con cientos de empleados realiza una evaluacion 360 anual. Cada empleado puede recibir evaluaciones de su jefe directo, pares, subordinados y autoevaluacion. RRHH necesita configurar el ciclo, controlar asignaciones, recolectar evaluaciones anonimas, generar reportes individuales y revisar promedios agregados por departamento.

## Stack utilizado

- Next.js App Router con TypeScript.
- MongoDB official Node.js driver.
- Redis con `ioredis` para cache del dashboard RRHH.
- Docker Compose con servicios `app`, `mongo` y `redis`.
- Server Components y Server Actions. No usa Express, Prisma, Mongoose, NextAuth ni roles complejos.

## Arquitectura

```text
Usuario / RRHH
  ↓
Next.js App Router
  ↓
Route handlers / Server components
  ↓
MongoDB Driver
  ↓
MongoDB: empleados, ciclos de evaluación, asignaciones, resultados de evaluación
  ↓
Redis: cache temporal del dashboard RRHH
```

Carpetas principales:

- `app/`: rutas, pantallas y API health.
- `components/`: componentes simples de UI.
- `lib/`: conexion, tipos, colecciones, Redis, formatters y queries.
- `scripts/seed.ts`: carga inicial de datos.
- `docs/queries.md`: consultas MongoDB para defensa.
- `docs/architecture.md`: arquitectura y decisiones tecnicas.

## Modelo de datos resumido

`employees` guarda empleados activos con `managerId` como referencia jerarquica.

`evaluation_cycles` guarda el ciclo activo y las competencias embebidas.

`evaluation_assignments` guarda el control interno de evaluador, evaluado, relacion y token.

`evaluations` guarda la evaluacion anonima sin `evaluatorId`.

## Ejecucion local

Instalar dependencias:

```bash
npm install
```

Levantar MongoDB y Redis:

```bash
docker compose up mongo redis -d
```

Cargar datos:

```bash
npm run seed
```

Modo desarrollo:

```bash
npm run dev
```

Modo entrega completo:

```bash
docker compose up --build
```

El modo completo ejecuta `npm run seed` antes de iniciar Next.js para que la demo sea reproducible.

## Rutas principales

- `http://localhost:3000/`
- `http://localhost:3000/cycles`
- `http://localhost:3000/employees`
- `http://localhost:3000/assignments`
- `http://localhost:3000/evaluate`
- `http://localhost:3000/reports`
- `http://localhost:3000/dashboard/hr`
- `http://localhost:3000/api/health`

## Datos sembrados

El seed crea:

- 120 empleados.
- 1 ciclo activo.
- 480 asignaciones.
- 360 evaluaciones completadas.
- 120 asignaciones pendientes para probar el formulario.
- 5 competencias.
- Comentarios anonimos.
- Indices MongoDB requeridos.

## Verificar MongoDB

```bash
docker compose exec mongo mongosh talento360
```

Dentro de `mongosh`:

```javascript
db.employees.countDocuments();
db.evaluation_assignments.countDocuments();
db.evaluations.countDocuments();
db.evaluation_assignments.getIndexes();
```

## Verificar Redis

```bash
docker compose exec redis redis-cli ping
docker compose exec redis redis-cli get talento360:hr-dashboard
```

Visite `/dashboard/hr` una vez para poblar el cache. La pantalla indica si los datos vinieron de Redis o MongoDB.

## API Health

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "mongo": "connected",
  "redis": "connected",
  "counts": {
    "employees": 120,
    "cycles": 1,
    "assignments": 480,
    "evaluations": 360
  }
}
```

## Queries clave del negocio

Las consultas estan documentadas en `docs/queries.md`:

1. Buscar empleados activos por departamento.
2. Buscar asignaciones pendientes por ciclo.
3. Pipeline de reporte individual por empleado.
4. Pipeline de dashboard agregado por departamento.
5. Verificacion de indices.

## Anonimato tecnico

La coleccion `evaluation_assignments` guarda `evaluatorId` porque RRHH necesita control interno.

La coleccion `evaluations` no guarda `evaluatorId`. El reporte individual solo lee `evaluations`, muestra promedios y comentarios anonimos, y contiene el texto: "La identidad de los evaluadores no se muestra en este reporte."

## Uso de Redis

`getHrDashboard()` intenta leer la llave `talento360:hr-dashboard`. Si existe, devuelve `source: "redis-cache"`. Si no existe, calcula con MongoDB Aggregation, intenta guardar en Redis por 300 segundos y devuelve `source: "mongodb"`.

Si Redis no esta disponible, el helper captura el error y la pantalla sigue funcionando desde MongoDB.

## Capturas sugeridas

Guardar capturas en `docs/screenshots/`:

- Home con estado del sistema.
- `/cycles` con ciclo activo y competencias.
- `/employees` con tabla y jefe.
- `/assignments` con tokens demo.
- `/evaluate/[token]` con formulario pendiente.
- `/reports/[employeeId]` con promedios y texto de anonimato.
- `/dashboard/hr` mostrando fuente MongoDB o Redis.
- `/api/health` con conteos.

## Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "seed": "tsx scripts/seed.ts",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit"
}
```

## Limitaciones conocidas

- No implementa login real ni roles porque el alcance academico prioriza modelado NoSQL, agregaciones y reproducibilidad.
- Los tokens se muestran en pantallas internas para facilitar la demo.
- `docker compose up --build` vuelve a ejecutar el seed y reinicia los datos de demostracion.
