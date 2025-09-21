# Matching Game Module

This folder contains everything required to run the flip-card matching mini-game.
It includes the React components, a canonical template definition, and a preview
configuration that mirrors the runtime payload served by the backend.

## Folder contents

- `matching-game.js`, `match-card.js`, `results-screen.js` – UI and game logic.
- `matching-game-init.js` – Thin wrapper that fetches and supplies configuration to the game.
- `config/template.json` – Canonical `GameTemplate` contract for admin and merchant tooling.
- `config/index.js` – Builds preview-friendly config and a sample `/games/list` document from the template.
- `unique-cards.js` – Convenience helper that exposes the default card list.

## Template contract

`config/template.json` declares the fields that the dashboard should render. Each
entry records the field name, input type, scope, validation rules, and any nested
structures. Typed defaults are stored alongside the contract so complex values
(like the card deck and theme) remain real JSON:

```json
{
  "name": "cards",
  "type": "array",
  "scope": "admin",
  "merchantEditableFields": ["type", "image", "altText"],
  "item": {
    "type": "object",
    "fields": [
      { "name": "id", "type": "string", "required": true },
      { "name": "type", "type": "string", "required": true },
      { "name": "image", "type": "image", "required": true }
    ]
  }
}
```

These defaults power both the admin preview tools and the storefront fixtures.

## Runtime payload

During preview builds we serialise the template defaults into the shape returned
by `/games/list`. `config/index.js` exports this sample response via
`matchingGameConfig.gameDocument`:

```json
{
  "game_id": "flip-001",
  "game_template_name": "flip-card",
  "merchant_id": "merchant-demo",
  "options": [
    {
      "input_name": "moveLimit",
      "input_type": "number",
      "required": true,
      "value": "5"
    },
    {
      "input_name": "cards",
      "input_type": "array",
      "required": true,
      "value": "[{\"id\":\"mee-siam-with-prawns\",\"type\":\"Mee Siam With Prawns\"}]"
    }
  ]
}
```

The storefront still expects the server to respond with full `Game` documents,
so downstream code should parse stringified JSON for complex fields.

## Editable fields

`template.fields` includes the scope information that used to live in the
`fieldSchema` helper:

- **Admin dashboard**: `moveLimit`, `initialRevealSeconds`, `cardUpflipSeconds`,
  `cards`, `submissionEndpoint`.
- **Merchant dashboard**: `cardBackImage`, `theme`, and card-level overrides for
  `type`, `image`, and `altText`.

The template can be consumed directly by dynamic form builders or access-control
logic.

## Image requirements

- Card faces: transparent PNG, at least 512 × 512 px.
- Card backs: transparent PNG, square ratio recommended.
- Provide `altText` for accessibility – the frontend will pass it through to the
  rendered `<img>` tags.

## Storage notes

Persist the template definition as-is in the template catalog. When a new
campaign is created, clone `template.defaults`, collect overrides from the
merchant, and publish the merged values. The helper in `config/index.js` shows
how to serialise the result into the runtime `options` array.
