# Spin the Wheel Game Module

This module contains the spin-the-wheel experience, along with a colocated
`GameTemplate` definition and preview configuration that mirror the runtime API
payload.

## Folder contents

- `stw-game.js` and supporting components – UI and gameplay logic.
- `stw-game-init.js` – Lightweight wrapper that injects the preview config.
- `config/template.json` – Canonical template contract for admin/merchant tooling.
- `config/index.js` – Expands the template defaults into preview-friendly config and a sample `/games/list` document.

## Template contract

`config/template.json` documents every configurable field, its scope, and default
value. Because defaults remain typed, complex data (like prize segments) are easy
to manipulate before being serialised for runtime use:

```json
{
  "name": "prizeSegments",
  "type": "array",
  "scope": "admin",
  "merchantEditableFields": ["label", "image", "description"],
  "item": {
    "type": "object",
    "fields": [
      { "name": "id", "type": "string", "required": true },
      { "name": "probability", "type": "number", "required": true }
    ]
  }
}
```

## Runtime payload

`config/index.js` serialises the template defaults into the shape returned by
`POST /games/list`. The exported `spinTheWheelConfig.gameDocument` matches the
expected runtime contract:

```json
{
  "game_id": "stw-001",
  "game_template_name": "spin-the-wheel",
  "merchant_id": "merchant-demo",
  "options": [
    {
      "input_name": "maxSpinsPerUser",
      "input_type": "number",
      "required": true,
      "value": "1"
    }
  ]
}
```

Structured data such as `prizeSegments` are stringified as part of this
conversion so the storefront continues to receive strings.

## Editable fields

Scope metadata is stored directly on the template:

- **Admin dashboard** – `maxSpinsPerUser`, `spinCooldownSeconds`, `prizeSegments`,
  `submissionEndpoint`.
- **Merchant dashboard** – `title`, `description`, `wheelImage`, `pointerImage`,
  `backgroundImage`, `spinButtonImage`, and selected fields on each prize
  segment.

## Storage notes

Keep `config/template.json` in the template catalog. When a campaign is created,
clone `template.defaults`, collect overrides, and serialise the result into the
runtime `options` array using the approach demonstrated in `config/index.js`.
