# Plan de Refocalización: Solo Contabilidad

El objetivo es eliminar todo el módulo de "Inclusión" (Fundación, Taller de Sillas, Transporte) y dejar el sistema **exclusivamente para Contabilidad e Impuestos**.

## 1. Eliminar Lógica del Chat (`src/lib/chatbot/`)

### `chatTrees.ts`
*   [DELETE] Menú `inclusion_root`
*   [DELETE] Menú `inclusion_workshop`
*   [DELETE] Menú `inclusion_transport`
*   [MODIFY] `invitado_root`: Asegurar que lleve a flujos de contabilidad/ventas.

### `chatEngine.ts`
*   [DELETE] `runBookingAgent` (Agente de Transporte).
*   [DELETE] `ChatState` mode `booking_transport`.
*   [DELETE] Lógica de `handleChat` que detecta intents de transporte.
*   [DELETE] `handleMenuRequest` lógica de role `inclusion`.

### `useChat.ts`
*   [MODIFY] Eliminar lógica de role `inclusion`.

## 2. Limpieza de Tipos y Configuración

### `src/types/index.ts`
*   [MODIFY] Eliminar `UserRole` 'inclusion'.

### `src/lib/responseConfig.ts`
*   [MODIFY] Eliminar prompts específicos de inclusión.

## 3. Limpieza de UI (`src/components/`)
*   [DELETE] `TransportPanel.tsx`, `TransportPanel.css`
*   [DELETE] `WheelchairWorkshopPanel.tsx`
*   [MODIFY] `ClientSidebar.tsx`: Quitar enlaces a Inclusión/Taller.
*   [MODIFY] `DevModeSelector.tsx`: Quitar opción de simular usuario 'inclusion'.

## 4. Archivos a Eliminar (Back-office logic)
*   `src/lib/transportRequests.ts`
*   `src/lib/wheelchairWorkshop.ts`

## 5. Verificación
*   Asegurar que el chat de "Invitado" y "Cliente" funcione perfectamente para temas contables (F29, Renta, Inicio de Actividades).
