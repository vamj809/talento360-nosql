# Talento360°

Miniaplicación desarrollada para el Proyecto Final de **MBD-106 - Bases de Datos NoSQL**, correspondiente al problema 30 del catálogo: **Plataforma de evaluación de desempeño 360°**.

## Caso empresarial

Una organización realiza anualmente evaluaciones de desempeño 360°, donde cada colaborador puede recibir retroalimentación de jefes, pares y subordinados. El área de Recursos Humanos necesita administrar los ciclos de evaluación, controlar asignaciones, recolectar respuestas anónimas y generar reportes individuales y agregados.

## Stack tecnológico

* Next.js
* MongoDB
* Redis
* Docker Compose

## Arquitectura

```text
Usuario / RRHH
    ↓
Next.js
    ↓
MongoDB
    ↓
Redis (cache dashboard RRHH)
```

## Colecciones principales

| Colección                | Propósito                             |
| ------------------------ | ------------------------------------- |
| `employees`              | Empleados y jerarquía organizacional  |
| `evaluation_cycles`      | Configuración de ciclos de evaluación |
| `evaluation_assignments` | Relación evaluador → evaluado         |
| `evaluations`            | Resultados de evaluaciones anónimas   |

## Características principales

* Modelo jerárquico mediante `managerId`.
* Evaluaciones anónimas.
* Reportes individuales por colaborador.
* Dashboard agregado para RRHH.
* Agregaciones con MongoDB Aggregation Pipeline.
* Cache Redis para consultas analíticas.
* Datos semilla reproducibles.

---

# Ejecución rápida

## Levantar el entorno completo

```bash
docker compose up --build
```

La aplicación estará disponible en:

```text
http://localhost:3000
```

---

# Desarrollo local

## Instalar dependencias

```bash
npm install
```

## Levantar MongoDB y Redis

```bash
docker compose up mongo redis -d
```

## Cargar datos semilla

```bash
npm run seed
```

## Ejecutar la aplicación

```bash
npm run dev
```

---

# Rutas principales

| Ruta            | Descripción                |
| --------------- | -------------------------- |
| `/`             | Página principal           |
| `/cycles`       | Ciclo activo               |
| `/employees`    | Empleados                  |
| `/assignments`  | Asignaciones de evaluación |
| `/evaluate`     | Evaluaciones disponibles   |
| `/reports`      | Reportes individuales      |
| `/dashboard/hr` | Dashboard de RRHH          |
| `/api/health`   | Estado del sistema         |

---

# Datos de demostración

El proceso de seed genera:

* 120 empleados.
* 1 ciclo activo.
* 480 asignaciones.
* 360 evaluaciones completadas.
* 120 evaluaciones pendientes.
* 5 competencias.
* Comentarios anónimos.
* Índices MongoDB para los principales patrones de acceso.

---

# Verificación rápida

## MongoDB

Acceder al contenedor:

```bash
docker compose exec mongo mongosh talento360
```

Consultas de verificación:

```javascript
db.employees.countDocuments()
db.evaluation_assignments.countDocuments()
db.evaluations.countDocuments()
db.evaluation_assignments.getIndexes()
```

## Redis

```bash
docker compose exec redis redis-cli ping
docker compose exec redis redis-cli get talento360:hr-dashboard
```

Visite `/dashboard/hr` al menos una vez para poblar el caché.

## Health Check

```bash
curl http://localhost:3000/api/health
```

---

# Consideraciones del entorno de demostración

* Los tokens de evaluación se muestran en pantallas internas para facilitar la interacción como parte de la demostración.
* Los datos son generados automáticamente mediante seed para garantizar reproducibilidad.
* El dashboard utiliza Redis como caché temporal y MongoDB como fuente principal de datos.
* La aplicación está preparada para ejecutarse localmente mediante Docker Compose.
* Documentación complementaria: `docs/queries.md`
