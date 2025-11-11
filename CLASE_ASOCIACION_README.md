# Implementación de Clase de Asociación en UML

## 📋 Descripción

Se ha implementado la funcionalidad de **Clase de Asociación** en el diagramador UML. Una clase de asociación es una construcción especial en UML que permite modelar atributos y métodos que pertenecen a la relación misma entre dos clases, no a ninguna de las clases individuales.

## 🎨 Representación Visual

La clase de asociación se representa con:
1. **Línea principal**: Conecta las dos clases relacionadas (línea sólida normal)
2. **Línea secundaria**: Conecta el punto medio de la relación con la clase de asociación (línea punteada)
3. **Clase de asociación**: Una clase UML normal con el estereotipo `<<association>>`

```
    Employee ────────────────── Project
                 │
                 │ (línea punteada)
                 │
            ┌─────────┐
            │  Role   │  (Clase de Asociación)
            │<<assoc>>│
            ├─────────┤
            │ title   │
            │ level   │
            └─────────┘
```

## 🔧 Cambios Implementados

### 1. Modelo de Datos (`uml-models.ts`)
- ✅ Añadido campo `associationClassId` a la interfaz `UMLRelation`
- Este campo almacena el ID de la clase que representa la asociación

### 2. Servicio de Diagrama (`uml-diagram.service.ts`)
Nuevos métodos añadidos:
- ✅ `createAssociationClass(relationId)`: Crea una clase de asociación para una relación
- ✅ `removeAssociationClass(relationId)`: Elimina la clase de asociación
- ✅ Actualizado `deleteRelation()`: Ahora elimina también la clase de asociación si existe

### 3. Servicio de Geometría (`geometry-calculator.service.ts`)
Nuevos métodos para cálculos geométricos:
- ✅ `calculateRelationMidpoint()`: Calcula el punto medio de una relación
- ✅ `calculateAssociationClassConnection()`: Calcula los puntos de conexión entre la relación y su clase de asociación

### 4. Componente Canvas (`uml-canvas.component.ts`)
Nuevos métodos:
- ✅ `createAssociationClassForRelation()`: Handler para crear clase de asociación
- ✅ `removeAssociationClassFromRelation()`: Handler para eliminar clase de asociación
- ✅ `getAssociationClassConnectionStart()`: Obtiene el punto de inicio de la línea secundaria
- ✅ `getAssociationClassConnectionEnd()`: Obtiene el punto final de la línea secundaria
- ✅ `hasAssociationClass()`: Verifica si una relación tiene clase de asociación

### 5. Template HTML (`uml-canvas.component.html`)
- ✅ Añadido renderizado de líneas de conexión para clases de asociación
- ✅ Líneas punteadas que conectan el medio de la relación con la clase
- ✅ Conexión de eventos al panel de propiedades

### 6. Panel de Propiedades (`relation-property-panel.component.*`)
- ✅ Añadido botón "Crear Clase de Asociación"
- ✅ Añadido botón "Eliminar Clase de Asociación"
- ✅ Texto de ayuda explicativo
- ✅ Outputs para eventos de creación/eliminación

### 7. Estilos CSS
- ✅ Estilos para los botones de clase de asociación
- ✅ Estilos para la línea punteada de conexión
- ✅ Soporte para tema claro/oscuro

## 🚀 Cómo Usar

### Crear una Clase de Asociación:

1. **Crear una relación normal** entre dos clases
2. **Seleccionar la relación** haciendo clic sobre ella
3. En el **panel de propiedades** que aparece a la derecha
4. Hacer clic en **"Crear Clase de Asociación"**
5. Se creará automáticamente:
   - Una nueva clase con el estereotipo `<<association>>`
   - Una línea punteada conectando la relación con la clase
   - La clase se posiciona cerca del punto medio de la relación

### Editar la Clase de Asociación:

- La clase de asociación es una **clase UML normal**
- Puedes:
  - Cambiar su nombre
  - Añadir atributos (ej: `title: String`, `level: int`)
  - Añadir métodos
  - Moverla arrastrándola
  - Aplicar estereotipos

### Eliminar la Clase de Asociación:

1. Seleccionar la relación
2. En el panel de propiedades
3. Hacer clic en **"Eliminar Clase de Asociación"**
4. Confirmar la acción

**Nota**: Si eliminas la relación principal, la clase de asociación también se eliminará automáticamente.

## 💡 Ejemplo de Uso Real

### Caso: Empleado trabaja en Proyecto

**Clases:**
- `Employee` (Empleado)
- `Project` (Proyecto)

**Relación:** Asociación "works on"

**Clase de Asociación:** `Role`
- Atributos:
  - `title: String` (ej: "Developer", "Manager")
  - `securityLevel: int`
  - `isPartTime: boolean`

Esta estructura modela que un empleado puede trabajar en varios proyectos con diferentes roles y niveles de seguridad en cada uno.

## 🔍 Detalles Técnicos

### Posicionamiento Automático
- La clase se crea en el **punto medio** entre las dos clases relacionadas
- Se desplaza **80px hacia abajo** del punto medio para mejor visualización
- Se puede mover manualmente después de crearla

### Línea de Conexión
- **Tipo**: Línea punteada (`stroke-dasharray: 5,3`)
- **Color**: Gris (#666)
- **Grosor**: 1.5px
- **Interacción**: No clickeable (`pointer-events: none`)

### Cálculo Geométrico
- La línea conecta el **punto medio exacto** de la relación principal
- Se calcula el punto de intersección con el **borde** de la clase de asociación
- Soporta clases de cualquier tamaño (se adapta dinámicamente)

## 📝 Notas Importantes

1. **Una relación puede tener solo una clase de asociación**
2. **La clase de asociación se elimina automáticamente** si se elimina la relación
3. **La línea punteada se actualiza automáticamente** cuando:
   - Se mueven las clases relacionadas
   - Se mueve la clase de asociación
   - La clase de asociación cambia de tamaño (añadir atributos/métodos)

## 🎯 Casos de Uso Comunes

- **Empleado-Proyecto**: Role (título, nivel)
- **Estudiante-Curso**: Enrollment (calificación, fecha)
- **Doctor-Paciente**: Treatment (diagnóstico, medicación)
- **Cliente-Producto**: Purchase (fecha, cantidad, descuento)

## 🐛 Resolución de Problemas

### La línea no aparece
- Verifica que la relación tenga `associationClassId`
- Revisa la consola del navegador por errores

### La clase se crea muy lejos
- Puedes moverla manualmente después de crearla
- El posicionamiento inicial es una estimación basada en el punto medio

### No veo el botón en el panel
- Asegúrate de haber seleccionado una relación (no una clase)
- El botón cambia dependiendo si ya existe o no la clase de asociación
