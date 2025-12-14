# Análisis del Sistema Chatbot "Arise"

Este documento detalla el estado actual, arquitectura y hallazgos tras el análisis del código fuente y la base de datos del chatbot.

## 1. Arquitectura del Sistema

El chatbot utiliza un modelo **Híbrido (Jerárquico)**, donde un "Supervisor" en el frontend decide quién responde al usuario.

### Flujo de Decisión (`chatEngine.ts`)
1.  **Comandos Globales:** Se verifican primero palabras clave como "cancelar", "menu", "salir".
2.  **Agentes Activos:** Si el usuario está en un flujo específico (ej. `booking_transport`), el control se pasa a una máquina de estados finitos (Agente).
3.  **Lógica "Idle" (Inactivo):**
    *   **Selección Numérica:** Detecta si el usuario elige una opción del menú por número.
    *   **Intenciones Específicas:** Palabras clave como "agendar traslado" activan agentes.
    *   **Match Estático:** Mapeo simple de palabras clave a menús predefinidos (Tokens -> Menú).
    *   **IA Generativa (Gemini):** Si nada de lo anterior coincide, se invoca a Gemini 2.0 Flash (Experimental) a través de una Edge Function.

### Componentes Clave
*   **`useChat.ts`:** Hook de React que gestiona el estado (mensajes, carga, perfil de usuario), persistencia (carga/guardado en Supabase) y la conexión con el motor de chat.
*   **`chatEngine.ts`:** El "cerebro" lógico. Contiene el orquestador y los sub-agentes.
*   **`chatTrees.ts`:** Define la estructura de menús estáticos y opciones de navegación.
*   **`supabase/functions/gemini-chat`:** Proxy seguro para llamar a la API de Google Gemini sin exponer la API Key en el cliente.

## 2. Estado de la Base de Datos (Supabase)

La infraestructura de datos parece sólida y alineada con el código.

*   **Proyecto:** `MTZ-asistente` (`lcskqvadolwqcrqhxfvz`)
*   **Tablas Verificadas:**
    *   `messages`: Almacena el historial de chat.
    *   `conversations`: Agrupa mensajes por sesión.
    *   `user_profiles`: Información del usuario y roles.
    *   `user_memories`: (Detectada como `user_memories` en DB, llamada correctamente en `memories.ts`). Almacena contexto importante extraído del chat.
    *   `transport_requests`: Existe en la DB, pero **no se está usando en el código activo**.

## 3. Hallazgos y Riesgos Detectados

### 🔴 Críticos / Funcionalidad Faltante
1.  **Transport Booking Mock:** En `chatEngine.ts` (Línea 150), la lógica para guardar una solicitud de transporte está comentada (`// SAVE TO DB (Mock for now...)`). El agente completa el flujo pero **no guarda nada en la base de datos**.
2.  **Manejo de Respuestas JSON:** La función `generateAIResponse` confía en que Gemini devolverá un JSON válido. Aunque hay un intento de limpieza (`replace`), si el modelo falla en el formato, el chatbot lanzará una excepción y mostrará un mensaje de error genérico.

### 🟡 Mejoras Recomendadas
1.  **Modelo Experimental:** Se está usando `gemini-2.0-flash-exp`. Los modelos experimentales pueden ser inestables o tener límites de cuota estrictos (429). Se recomienda tener un fallback automático a `gemini-1.5-flash` si el 2.0 falla.
2.  **Validación de Entrada del Agente:** El agente de transporte tiene validaciones muy básicas (ej. longitud del string). Sería ideal usar la IA para validar fechas y horas de forma más natural.

## 4. Próximos Pasos Sugeridos

1.  **Implementar Persistencia de Transporte:** Conectar el `runBookingAgent` con la tabla `transport_requests`.
2.  **Robustecer Parsing JSON:** Usar un parser más seguro o instruir al modelo con un esquema más estricto (Structured Output si disponible, o re-intentos).
3.  **Pruebas de Estrés:** Verificar cómo se comporta el sistema con el modelo experimental bajo carga.
