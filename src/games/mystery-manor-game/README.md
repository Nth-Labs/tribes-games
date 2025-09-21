# Mystery Manor Game Module

This directory bundles the hidden-object experience together with a colocated
template contract and preview configuration that match the backend runtime
payload.

## Folder contents

- `mystery-manor-game.js`, supporting components, and assets – UI and gameplay logic.
- `mystery-manor-game-init.js` – Lightweight wrapper that feeds config into the game.
- `config/template.json` – Canonical `GameTemplate` definition for admin and merchant tooling.
- `config/index.js` – Builds preview-friendly config and a sample `/games/list` document directly from the template.

## Template contract

`config/template.json` enumerates every field exposed in the dashboard along
with validation, scope, and nested structures. Defaults stay strongly typed so
complex objects (like hotspots) remain JSON until runtime serialisation:

```json
{
  "name": "items",
  "type": "array",
  "scope": "admin",
  "merchantEditableFields": ["image", "hint", "name"],
  "item": {
    "type": "object",
    "fields": [
      { "name": "id", "type": "string", "required": true },
      { "name": "hotspot", "type": "object", "required": true }
    ]
  }
}
```

## Runtime payload

`config/index.js` demonstrates how to convert the template defaults into the
`Game` document returned by `/games/list`. The helper exports this example via
`mysteryManorConfig.gameDocument`:

```json
{
  "game_id": "mm-001",
  "game_template_name": "mystery-manor",
  "merchant_id": "merchant-demo",
  "options": [
    {
      "input_name": "timerSeconds",
      "input_type": "number",
      "required": true,
      "value": "120"
    }
  ]
}
```

Structured defaults such as the `items` array are stringified when generating the
runtime payload, preserving compatibility with the existing API contract.

## Editable fields

Scope information is embedded in the template:

- **Admin dashboard** – `timerSeconds`, `maxHints`, `items`, `submissionEndpoint`.
- **Merchant dashboard** – `title`, `subtitle`, `description`, `backgroundImage`,
  `sceneImage`, `hintIcon`, plus permitted fields within each item (`image`,
  `hint`, `name`).

## Storage notes

Persist the template JSON in the template catalog. When instantiating a game,
merge `template.defaults` with overrides from the merchant, then serialise the
result into the `options` array as shown in `config/index.js`.
