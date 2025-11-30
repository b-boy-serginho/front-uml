# 📋 Guía de Instalación - Frontend DiagramCode

Esta guía te ayudará a instalar y ejecutar el frontend de DiagramCode en tu máquina local.

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
  - Descarga desde: [https://nodejs.org/](https://nodejs.org/)
  - Verifica la instalación ejecutando: `node --version`
  
- **npm** (viene incluido con Node.js)
  - Verifica la instalación ejecutando: `npm --version`

- **Git** (opcional, solo si clonas el repositorio)
  - Descarga desde: [https://git-scm.com/](https://git-scm.com/)

## 🚀 Pasos de Instalación

### 1. Obtener el Código

Si tienes el código en una carpeta local, navega hasta ella:

```bash
cd ruta/a/tu/proyecto/uml-class-diagram-main
```

Si necesitas clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd uml-class-diagram-main
```

### 2. Instalar Dependencias

Instala todas las dependencias del proyecto usando npm:

```bash
npm install
```

Este comando descargará e instalará todas las dependencias necesarias listadas en el `package.json`. El proceso puede tardar varios minutos dependiendo de tu conexión a internet.

**Nota:** Si encuentras errores durante la instalación, intenta:
- Limpiar la caché de npm: `npm cache clean --force`
- Eliminar `node_modules` y `package-lock.json`, luego ejecutar `npm install` nuevamente

### 3. Configurar Variables de Entorno

El proyecto utiliza archivos de configuración de entorno. Verifica que los siguientes archivos existan y tengan la configuración correcta:

**Archivo:** `src/environments/environment.ts`
```typescript
export const environment = {
  GOOGLE_GENAI_API_KEY: 'TU_API_KEY_AQUI',
  apiUrl: 'http://localhost:3000',
};
```

**Archivo:** `src/environments/environment.development.ts`
```typescript
export const environment = {
  GOOGLE_GENAI_API_KEY: 'TU_API_KEY_AQUI',
  apiUrl: 'http://localhost:3000',
  production: false
};
```

**⚠️ Importante:**
- Reemplaza `'TU_API_KEY_AQUI'` con tu propia API key de Google Gemini AI
- Asegúrate de que `apiUrl` apunte a la URL correcta de tu backend
- Por defecto, el backend debe estar corriendo en `http://localhost:3000`

### 4. Verificar el Backend

Antes de ejecutar el frontend, asegúrate de que el backend esté corriendo:

- El backend debe estar ejecutándose en el puerto 3000 (o el puerto configurado en `apiUrl`)
- Si el backend está en otro puerto o URL, actualiza el `apiUrl` en los archivos de entorno

## ▶️ Ejecutar el Proyecto

### Modo Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm start
```

O alternativamente:

```bash
ng serve
```

El servidor de desarrollo se iniciará y podrás acceder a la aplicación en:

**http://localhost:4200**

La aplicación se recargará automáticamente cuando realices cambios en el código.

### Modo Producción

Para crear una build de producción:

```bash
npm run build
```

O:

```bash
ng build
```

Los archivos compilados se generarán en la carpeta `dist/`. Puedes servir estos archivos con cualquier servidor web estático.

## 🧪 Comandos Adicionales

### Ejecutar Tests

```bash
npm test
```

### Build en Modo Watch (desarrollo)

```bash
npm run watch
```

Este comando compila el proyecto y se mantiene observando cambios.

## 🔧 Solución de Problemas Comunes

### Error: "Cannot find module"

**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 4200 is already in use"

**Solución:**
El puerto 4200 está ocupado. Puedes:
- Cerrar la aplicación que está usando el puerto
- O usar otro puerto: `ng serve --port 4201`

### Error: "EACCES: permission denied"

**Solución:**
En sistemas Unix/Linux, puede ser un problema de permisos:
```bash
sudo npm install
```

O mejor aún, configura npm para usar un directorio diferente:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
```

### Error de conexión con el backend

**Solución:**
- Verifica que el backend esté corriendo
- Verifica que la URL en `environment.ts` sea correcta
- Verifica que no haya problemas de CORS en el backend
- Revisa la consola del navegador para ver errores específicos

### Problemas con Angular CLI

Si tienes problemas con el comando `ng`:

```bash
npm install -g @angular/cli
```

O usa `npx` para ejecutar comandos sin instalación global:

```bash
npx ng serve
```

## 📁 Estructura del Proyecto

```
uml-class-diagram-main/
├── src/
│   ├── app/
│   │   ├── auth/              # Módulo de autenticación
│   │   ├── pizarra/           # Módulo principal del canvas UML
│   │   ├── projects/          # Gestión de proyectos
│   │   ├── diagrams/          # Gestión de diagramas
│   │   └── share/             # Componentes compartidos
│   ├── environments/          # Configuración de entornos
│   └── index.html            # Punto de entrada HTML
├── package.json              # Dependencias y scripts
├── angular.json              # Configuración de Angular
└── tsconfig.json             # Configuración de TypeScript
```

## 🌐 Navegación de la Aplicación

Una vez que la aplicación esté corriendo, podrás acceder a:

- **Página Principal:** http://localhost:4200/
- **Login:** http://localhost:4200/login
- **Registro:** http://localhost:4200/register
- **Proyectos:** http://localhost:4200/projects (requiere autenticación)

## 🔐 Configuración de API Keys

### Google Gemini AI

Para usar las funcionalidades de IA, necesitas una API key de Google Gemini:

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Reemplaza `'TU_API_KEY_AQUI'` en los archivos de entorno con tu API key

**⚠️ Seguridad:** Nunca subas tus API keys a repositorios públicos. Considera usar variables de entorno o archivos de configuración que estén en `.gitignore`.

## 📝 Notas Adicionales

- El proyecto utiliza **Angular 20.1.0**
- Requiere **TypeScript 5.8.2**
- Utiliza **Socket.IO** para funcionalidades en tiempo real
- Utiliza **Monaco Editor** para visualización de código
- Utiliza **JSZip** para manejo de archivos ZIP

## 🆘 Obtener Ayuda

Si encuentras problemas que no están cubiertos en esta guía:

1. Revisa la consola del navegador (F12) para ver errores
2. Revisa los logs del servidor de desarrollo
3. Verifica que todas las dependencias estén correctamente instaladas
4. Asegúrate de que el backend esté funcionando correctamente

## ✅ Verificación de Instalación

Para verificar que todo está correctamente instalado:

1. ✅ Node.js instalado: `node --version`
2. ✅ npm instalado: `npm --version`
3. ✅ Dependencias instaladas: `ls node_modules` (debe mostrar muchas carpetas)
4. ✅ Servidor corriendo: Abre http://localhost:4200 en tu navegador
5. ✅ Sin errores en consola: Revisa la consola del navegador (F12)

---

**¡Listo!** 🎉 Ahora deberías poder ejecutar el frontend de DiagramCode sin problemas.

