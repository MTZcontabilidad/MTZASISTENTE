# Guía de Menús Interactivos y Trámites

## 📋 Resumen

El sistema de chatbot ahora incluye menús interactivos con botones que permiten a los clientes:

- Acceder directamente a trámites gubernamentales (SII, PreviRed, Tesorería)
- Ver imágenes de guía cuando están disponibles
- Contactar por WhatsApp con un solo clic
- Acceder a documentos y servicios de forma rápida

## 🎯 Características Implementadas

### 1. **Detección Automática de Trámites**

Cuando un usuario menciona palabras relacionadas con trámites, el sistema automáticamente genera un menú interactivo con botones para acceder directamente a los portales gubernamentales.

**Palabras clave que activan menús:**

- **SII**: "sii", "impuestos internos", "declaración", "iva", "factura", "boleta", "rut"
- **PreviRed**: "previred", "cotizaciones", "previsional", "finiquito"
- **Tesorería**: "tesorería", "pago", "certificado tributario"
- **Genérico**: "trámite", "proceso", "guía", "cómo hacer"

### 2. **Estructura de Trámites**

Los trámites están organizados en el archivo `src/config/tramites.ts`:

```typescript
export interface TramiteInfo {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  categoria: "sii" | "previred" | "tesoreria" | "otro";
  icon?: string;
  requiere_autenticacion?: boolean;
  guia_imagen?: string;
}
```

### 3. **Menús Interactivos**

Los menús incluyen:

- **Título y descripción** claros
- **Botones con iconos** para cada opción
- **Imágenes de guía** (cuando están disponibles)
- **Acceso directo** a portales y servicios

## 📝 Cómo Agregar Nuevos Trámites

### Paso 1: Editar `src/config/tramites.ts`

Agrega el nuevo trámite al array correspondiente:

```typescript
export const TRAMITES_SII: TramiteInfo[] = [
  // ... trámites existentes
  {
    id: "sii-nuevo-tramite",
    nombre: "Nuevo Trámite SII",
    descripcion: "Descripción del trámite",
    url: "https://www.sii.cl/nuevo-tramite",
    categoria: "sii",
    icon: "🆕",
    requiere_autenticacion: true,
  },
];
```

### Paso 2: Actualizar Detección (si es necesario)

Si el nuevo trámite requiere palabras clave específicas, edita la función `detectarTramiteRequest` en `src/lib/responseEngine.ts`:

```typescript
if (inputLower.includes("nueva-palabra-clave")) {
  const tramites = getTramitesPorCategoria("sii");
  // ...
}
```

## 🖼️ Agregar Imágenes de Guía

### Opción 1: Imágenes Locales

1. Coloca las imágenes en la carpeta `public/images/`
2. Actualiza `generarMenuTramites` en `src/config/tramites.ts`:

```typescript
if (categoria === "sii") {
  guideImage = "/images/guia-sii.png";
}
```

### Opción 2: URLs Externas

```typescript
guideImage = "https://ejemplo.com/guia-sii.png";
```

## 🔗 Enlaces de Contacto

La información de contacto principal está configurada en:

- **WhatsApp**: +56990062213 (Carlos Alejandro Villagra Farias)
- **Dirección**: Juan Martinez 616, Iquique

Estos datos se incluyen automáticamente en las respuestas del chatbot.

## 🎨 Personalización de Menús

### Crear Menús Personalizados

Los menús se pueden crear dinámicamente usando la función `generarMenuTramites`:

```typescript
import {
  generarMenuTramites,
  getTramitesPorCategoria,
} from "../config/tramites";

const menuSII = generarMenuTramites(getTramitesPorCategoria("sii"), "sii");
```

### Estructura de Opciones de Menú

```typescript
{
  id: 'opcion-unica',
  label: '📋 Nombre de la Opción',
  action: 'open_url' | 'get_document' | 'show_info' | 'show_menu' | 'list_documents',
  params: {
    url: 'https://...',
    url_type: 'tramite',
    // otros parámetros según la acción
  },
  icon: '📋',
}
```

## 🚀 Acciones Disponibles en Menús

### `open_url`

Abre un enlace en una nueva pestaña. Soporta:

- URLs directas
- WhatsApp (usando `url_type: 'whatsapp'`)
- Trámites gubernamentales (con confirmación)

### `get_document`

Obtiene un documento del tipo especificado del cliente.

### `list_documents`

Muestra una lista de documentos disponibles del cliente.

### `show_info`

Muestra información sobre un servicio o tema.

### `show_menu`

Muestra otro menú (actualmente muestra instrucciones al usuario).

## 📱 Ejemplos de Uso

### Usuario escribe: "necesito ayuda con el SII"

**Respuesta automática:**

- Texto explicativo
- Menú con botones para:
  - Portal SII
  - Consulta RUT
  - Declaración de Renta
  - Facturación Electrónica
  - etc.

### Usuario escribe: "quiero ver mis documentos"

**Respuesta automática:**

- Menú con opciones para listar documentos por tipo

### Usuario escribe: "contacto"

**Respuesta automática:**

- Información de contacto completa
- Botón para WhatsApp directo

## 🔧 Archivos Modificados

1. **`src/config/tramites.ts`** - Nueva configuración de trámites
2. **`src/config/links.ts`** - Actualizado WhatsApp
3. **`src/lib/responseConfig.ts`** - Plantillas de respuestas mejoradas
4. **`src/lib/responseEngine.ts`** - Detección automática de trámites
5. **`src/components/InteractiveMenu.tsx`** - Soporte para imágenes y mejoras
6. **`src/components/InteractiveMenu.css`** - Estilos para imágenes y títulos
7. **`src/components/ChatInterface.tsx`** - Integración de nuevas características

## 📌 Próximos Pasos Sugeridos

1. **Agregar más trámites**: Completa los enlaces reales de SII, PreviRed y Tesorería
2. **Crear imágenes de guía**: Diseña guías visuales para cada categoría de trámite
3. **Expandir menús de servicios**: Agrega más opciones en el menú de servicios
4. **Mejorar navegación entre menús**: Implementa navegación fluida entre diferentes menús
5. **Agregar más categorías**: Incluye otros servicios gubernamentales si es necesario

## 💡 Tips

- Los menús se generan automáticamente cuando se detectan palabras clave
- Las imágenes de guía son opcionales pero mejoran la experiencia del usuario
- Todos los enlaces se abren en nuevas pestañas para no interrumpir la conversación
- Los trámites que requieren autenticación se marcan con `requiere_autenticacion: true`

