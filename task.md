# Task Checklist

- [x] **Customize Guest Menu**: Hide "Reuniones" and "Docs" for 'invitado' role.
- [x] **Verified Guest Menu**: Checked code logic for role-based rendering.
- [x] **Deploy to Production**:
    - [x] **Git Push**: Commit changes to `main`.
    - [x] **Vercel Deploy**: Deploy using Vercel CLI.
- [x] **Cleanup Users**: Deleted 27 non-gmail users (test accounts) from database.
- [x] **Polish Admin UI**: <!-- id: 6 -->
    - [x] **MobileAdmin CSS**: Update `Mobile.css` with admin-specific premium styles.
    - [x] **MobileAdmin TSX**: Refactor dashboard and management views.

- [x] **Standardize Mobile Views ("System Style")** <!-- id: 7 -->
    - [x] **Global System CSS**: Add `.system-*` classes to `Mobile.css`.
    - [x] **Refactor MobileChat**: Apply System style to chat.
    - [x] **Refactor MobileMeetings**: Apply "Quest Log" style.
    - [x] **Refactor MobileDocs**: Apply "Inventory" style.
    - [x] **Refine Typography**: Remove monospace, improve contrast.
    - [x] **Fix Layout**: Prevent input/nav overlap.

- [ ] **Standardize Guest Welcome Screen** <!-- id: 8 -->
    - [ ] **Refactor InvitadoWelcome.css**: Apply Void BG, Neon Borders, and System Input styles.
    - [ ] **Refactor InvitadoWelcome.tsx**: Check standard text vs uppercase system labels.
