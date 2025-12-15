---
trigger: always_on
---

You are an expert in TypeScript, React Native, Expo Router, and Fintech UI development. You are building "Antigravity," an open-source tax filing application.

# Core Principles
- **Accuracy First:** Financial logic must be distinct from UI logic. Never mix tax calculation business logic inside UI components.
- **Data Inheritance:** The architecture must support "cascading data." Data entered in Federal forms (Context/Store) must be available to auto-fill State forms.
- **Privacy by Design:** PII (SSN, Income) must never be logged to console or non-secure storage.

# Tech Stack Decisions (Strict)
- **Framework:** Expo (Managed Workflow).
- **Navigation:** Expo Router (File-based routing).
- **Styling:** NativeWind (Tailwind CSS) or Restyle. Do not use plain stylesheets.
- **State Management:** Zustand (for global tax store) + React Query (for API).
- **Forms:** React Hook Form + Zod (Schema Validation).
- **Math:** `decimal.js` or `big.js`. **NEVER use native JavaScript `number` for currency math.**

# Project Structure
- `app/`: Routes and layout (Expo Router).
- `components/`: Reusable UI (Buttons, Cards).
- `features/`: Domain-specific modules (e.g., `features/federal`, `features/state-ny`).
- `lib/tax-logic/`: Pure TypeScript functions for tax calculations (0 dependencies on React).
- `stores/`: Zustand stores for maintaining the tax return session.

# TypeScript & Syntax
- Use `interface` for props and data models.
- Use `const` with arrow functions for components.
- Use explicit return types for all tax calculation functions.
- Strict Mode is mandatory. No `any`.

# Tax Logic & Data Flow (Critical)
- **Floating Point Safety:** All currency calculations must use the designated Math library.
  - ❌ `const tax = income * 0.15`
  - ✅ `const tax = income.times(0.15)`
- **State Form Inheritance:**
  - State forms must subscribe to the Federal store.
  - Implement a `usePreFill` hook pattern: On mount, check if a field in the State form exists in the Federal store. If yes, populate it.
  - If the user edits a pre-filled State value, flag it as `dirty/override`.

# UI & UX Pattern
- **Wizard Pattern:** Use step-by-step wizard layouts for complex sections.
- **Keyboard Handling:** All forms must use `KeyboardAvoidingView` and `dismiss` on tap outside.
- **Auto-Format:** Use masking for SSN `XXX-XX-XXXX` and Currency `$1,000.00`.
- **Accessibility:** All form inputs must have `accessibilityLabel` and `accessibilityHint`.

# Performance & Storage
- Use `mmkv` for encrypted local storage (persisting draft returns).
- Debounce heavy tax re-calculations (don't recalculate on every keystroke).

# Error Handling
- **Validation:** Zod schemas must handle specific tax constraints (e.g., "Age cannot be negative", "SSN must be 9 digits").
- **Boundaries:** Wrap major form sections (Federal/State) in Error Boundaries to prevent app crashes from bad input.

# Testing
- Unit test all `lib/tax-logic` functions with strict edge cases (e.g., $0 income, negative numbers).