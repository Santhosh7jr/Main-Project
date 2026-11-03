# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## ADR assessment

The ADR assessment asks for a patient, the patient's problem, and optional current side effects. The server uses Gemini (`gemini_api_key`) to expand search terms, summarize common symptoms for a clearly named condition, and rank a limited list of matching medicine names, database uses, and side-effect overlaps. If the combined model response omits the symptom summary, the server retries with a focused symptom request. It does not send patient identity or medical history. Each result can request an AI-generated medicine description; that request contains only the medicine's database profile. Reports can be saved as clinical notes on the selected patient's record. AI summaries and match estimates are educational only, not diagnoses, calibrated probabilities, or treatment recommendations; clinicians must verify information against authoritative sources and review the full patient context. Configure `gemini_api_key` in `server/.env`; `GEMINI_MODEL` is optional and defaults to `gemini-3.5-flash-lite`. No other AI provider is used.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
