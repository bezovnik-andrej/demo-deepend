# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Norveo — estimate, build date hint, estimating canvas

- **Expected build month** (`ProjectData.expectedBuildDate`): set it from **Procurement → Estimate → Admin** (month picker). The KPI bar shows a **Build** chip with a **material drift hint** (~% cumulative) from [`src/data/inflationHints.ts`](src/data/inflationHints.ts). The hint is **UI-only**; it does not change line totals.
- **Budget vs actual**: in the same Estimate admin block, use per-line **Budget** inputs and **Set budget = current cost** in the workspace toolbar to seed budgets from current extended cost, then edit unit pricing to see variance.
- **Estimating tool**: in **Design**, switch authoring mode to **Geometry** and choose the **Estimating** tool. Drop a **PNG/JPG** (or use **Load image**) to show a dimmed **plan underlay** behind the pool SVG; clear with **Clear underlay**. v1 keeps the demo pool path; tracing is visual only.
- **Inlet / shelf policy & chat**: see [`docs/auto-engineering-policy.md`](docs/auto-engineering-policy.md). Wall and floor return **quantities** follow `planInlets` in [`src/data/inletPlanning.ts`](src/data/inletPlanning.ts); adjust strategy under **Configurator → Mechanical → Inlet placement**.

## Geocoding (Project Location)

The configurator **Project Location** step calls OpenStreetMap **Nominatim** for address suggestions and reverse geocoding.

- **Local dev and `vite preview`:** requests go to `/api/nominatim`, proxied in [`vite.config.ts`](vite.config.ts) to `nominatim.openstreetmap.org` with a compliant `User-Agent`.
- **Vercel:** [`vercel.json`](vercel.json) rewrites `/api/nominatim/*` to Nominatim **before** the SPA fallback so geocoding is not served `index.html` by mistake.
- **Other production hosts:** set environment variable **`VITE_NOMINATIM_URL`** to your own HTTPS reverse proxy of Nominatim (same path style as the public API). See [`src/utils/geocoding.ts`](src/utils/geocoding.ts) for details.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
