export const colors = {
    association: '#333333',      // Negro para asociación
    aggregation: '#4CAF50',      // Verde para agregación
    composition: '#F44336',      // Rojo para composición
    inheritance: '#2196F3',      // Azul para herencia
    realization: '#FF9800',      // Naranja para realización
    dependency: '#9C27B0',        // Púrpura para dependencia
    associationClass: '#3F51B5'   // Azul oscuro para clase de asociación
};


export const descriptions = {
    association: 'Relación básica entre clases',
    aggregation: 'Relación "tiene-un" débil (parte puede existir sin el todo)',
    composition: 'Relación "tiene-un" fuerte (parte no puede existir sin el todo)',
    inheritance: 'Relación "es-un" (herencia de clase)',
    realization: 'Implementación de interface',
    dependency: 'Una clase usa otra clase',
    associationClass: 'Relación que también es una clase'
};