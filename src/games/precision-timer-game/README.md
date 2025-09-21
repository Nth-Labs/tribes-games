# Precision Timer Game Module

This folder packages the countdown challenge, along with a colocated template
contract and preview configuration that mirrors the runtime payload.

## Folder contents

- `precision-timer-game.js`, `results-screen.js` – UI and game logic.
- `precision-timer-game-init.js` – React wrapper that loads the preview config.
- `config/template.json` – Canonical `GameTemplate` document for admin/merchant tooling.
- `config/index.js` – Expands the template defaults into preview-friendly config and a sample `/games/list` response.

## Template contract

`config/template.json` defines the editable fields, their scopes, validation, and
default values. The defaults stay strongly typed:

```json
{
  "name": "countdownSeconds",
  "type": "number",
  "scope": "admin",
  "required": true,
  "description": "Number of seconds the countdown should run before players try to stop it."
}
```

Dashboards can render forms directly from this document and rely on
`template.defaults` for initial values.

## Runtime payload

`config/index.js` shows how to serialise the template into the runtime `Game`
document that `/games/list` returns. The helper exports the example via
`precisionTimerConfig.gameDocument`:

```json
{
  "game_id": "precision-001",
  "game_template_name": "precision-timer",
  "merchant_id": "merchant-demo",
  "options": [
    {
      "input_name": "countdownSeconds",
      "input_type": "number",
      "required": true,
      "value": "5"
    }
  ]
}
```

Consumers should continue to parse numeric values from strings when reading the
runtime payload.

## Editable fields

The template encodes role-based access out of the box:

- **Admin dashboard** – `countdownSeconds`, `submissionEndpoint`.
- **Merchant dashboard** – `title`, `subtitle`, `description`, `startButtonLabel`,
  `stopButtonLabel`.

## Storage notes

Persist the template JSON in the template catalog. When creating a game, merge
`template.defaults` with merchant overrides and serialise the result the same way
`config/index.js` does for previews.
