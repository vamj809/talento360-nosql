# Consultas MongoDB clave

Estas consultas resumen el uso NoSQL del proyecto.

## 1. Empleados activos por departamento

```javascript
db.employees.find(
  { department: "Tecnología", active: true },
  { employeeCode: 1, fullName: 1, position: 1, level: 1, managerId: 1 }
).sort({ fullName: 1 });
```

Indice utilizado:

```javascript
db.employees.createIndex({ department: 1, active: 1, fullName: 1 });
```

## 2. Asignaciones pendientes por ciclo

```javascript
db.evaluation_assignments.find(
  { cycleId: ObjectId("<cycleId>"), status: "pending" },
  { evaluatedId: 1, relationType: 1, token: 1, createdAt: 1 }
).sort({ createdAt: 1 });
```

Indice utilizado:

```javascript
db.evaluation_assignments.createIndex({
  cycleId: 1,
  evaluatedId: 1,
  status: 1
});
```

## 3. Pipeline de reporte individual por empleado

```javascript
db.evaluations.aggregate([
  { $match: { evaluatedId: ObjectId("<employeeId>") } },
  {
    $facet: {
      overall: [
        {
          $group: {
            _id: null,
            liderazgo: { $avg: "$scores.liderazgo" },
            comunicacion: { $avg: "$scores.comunicacion" },
            trabajo_equipo: { $avg: "$scores.trabajo_equipo" },
            resultados: { $avg: "$scores.resultados" },
            innovacion: { $avg: "$scores.innovacion" },
            total: { $sum: 1 }
          }
        }
      ],
      byRelation: [
        {
          $group: {
            _id: "$relationType",
            liderazgo: { $avg: "$scores.liderazgo" },
            comunicacion: { $avg: "$scores.comunicacion" },
            trabajo_equipo: { $avg: "$scores.trabajo_equipo" },
            resultados: { $avg: "$scores.resultados" },
            innovacion: { $avg: "$scores.innovacion" },
            total: { $sum: 1 }
          }
        }
      ],
      comments: [
        { $match: { anonymousComment: { $ne: "" } } },
        { $sort: { submittedAt: -1 } },
        { $project: { evaluatorId: 0, tokenHash: 0 } }
      ]
    }
  }
]);
```

Punto de anonimato: la consulta sale de `evaluations`, colección que no contiene `evaluatorId`.

## 4. Pipeline de dashboard agregado por departamento

```javascript
db.evaluations.aggregate([
  {
    $lookup: {
      from: "employees",
      localField: "evaluatedId",
      foreignField: "_id",
      as: "employee"
    }
  },
  { $unwind: "$employee" },
  {
    $group: {
      _id: "$employee.department",
      liderazgo: { $avg: "$scores.liderazgo" },
      comunicacion: { $avg: "$scores.comunicacion" },
      trabajo_equipo: { $avg: "$scores.trabajo_equipo" },
      resultados: { $avg: "$scores.resultados" },
      innovacion: { $avg: "$scores.innovacion" },
      totalEvaluations: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
]);
```

El resultado se cachea en Redis con la llave `talento360:hr-dashboard` por 300 segundos.

## 5. Verificacion de indices

```javascript
db.employees.getIndexes();
db.evaluation_cycles.getIndexes();
db.evaluation_assignments.getIndexes();
db.evaluations.getIndexes();
```

Indices requeridos por el proyecto:

```javascript
db.employees.createIndex({ department: 1, active: 1, fullName: 1 });
db.employees.createIndex({ managerId: 1 });
db.evaluation_cycles.createIndex({ year: 1, status: 1 });
db.evaluation_assignments.createIndex({ cycleId: 1, evaluatedId: 1, status: 1 });
db.evaluation_assignments.createIndex({ tokenHash: 1 }, { unique: true });
db.evaluation_assignments.createIndex({ evaluatorId: 1, cycleId: 1 });
db.evaluations.createIndex({ cycleId: 1, evaluatedId: 1, relationType: 1 });
db.evaluations.createIndex({ cycleId: 1, submittedAt: -1 });
```
