# Guest Menu Customization

## Goal
Remove "Reuniones" (Meetings) and "Docs" (Documents) navigation buttons for users with the 'invitado' (Guest) role.

## Analysis
- **File**: `src/components/mobile/MobileLayout.tsx`
- **Current Logic**: Renders navigation items based on `isAdmin`.
- **Requirement**: Use `user.role === 'invitado'` to conditionally hide specific buttons.
- **Roles**: Confirmed `UserRole` includes `'invitado'`.

## Proposed Changes
1.  **MobileLayout.tsx**:
    -   Define `isGuest = user?.role === 'invitado'`.
    -   Wrap "Reuniones" button logic: `!isGuest && <button...>Reuniones</button>`.
    -   Wrap "Docs" button logic: `!isGuest && <button...>Docs</button>`.

## Verification
-   **Visual Check**:
    -   Login as Guest (using DevMode or creating new guest).
    -   Verify "Reuniones" and "Docs" buttons are failing to appear.
    -   Verify "Chat", "Accesos" (if applicable), and "Perfil" remain.
-   **Regression Check**:
    -   Login as Client -> Should see everything.
    -   Login as Admin -> Should see Admin options.
