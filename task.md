# Task: Enforce Google Auth & Manual Admin Promotion

- [x] **Restrict Authentication to Google Only** <!-- id: 0 -->
    - [x] Modify `src/components/Auth.tsx` to remove Guest/Phone login forms.
    - [x] Ensure only the "Entrar con Google" button remains.
- [x] **Disable Self-Service Role Promotion** <!-- id: 1 -->
    - [x] Modify `src/components/InvitadoWelcome.tsx` to remove the "Are you a client?" flow.
    - [x] Simplify `InvitadoWelcome` to optionally collect a Phone Number (for contact) or just a welcome message, then finish.
    - [x] Ensure no automatic role change to `cliente` happens in the codebase.
- [x] **Verification** <!-- id: 2 -->
    - [x] Verify Login screen shows only Google.
    - [x] Verify new user flow lands on Guest Chat.
    - [x] Verify Admin Panel can promote user.

- [ ] **Unify Mobile Styles (Guest, Client, Prov)** <!-- id: 3 -->
    - [x] **Global Tokens**: Promote premium mobile tokens from `Mobile.css` to `index.css` (root).
    - [x] **Guest View**: Refactor `InvitadoWelcome.tsx/.css` to use premium tokens and `glass-header`.
    - [x] **Provider/Admin View**: Ensure `MobileAdmin.tsx` uses correct classes and variables.
    - [x] **Client View**: Verify `MobileChat.tsx` alignment.

- [x] **Customize Guest Menu** <!-- id: 4 -->
    - [x] **MobileLayout**: Hide 'Reuniones' and 'Docs' buttons if user role is 'invitado'.

- [ ] **Deploy to Production** <!-- id: 5 -->
    - [ ] **Git Push**: Commit and push changes to GitHub.
    - [ ] **Vercel Deploy**: Deploy update using Vercel CLI.
