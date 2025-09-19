# Mystery Manor Module

This folder bundles the configuration and placeholder React UI for the Mystery
Manor hidden-object experience. Everything required for the module lives here so
it can be moved into another codebase as-is.

## Folder contents

- `mystery-manor-game.js` – Placeholder component that consumes the configuration.
- `config/base-config.json` – Canonical document describing scenes, items, and timers.
- `config/index.js` – Runtime config wrapper that adds schema metadata for dashboards.

## API contract

The frontend expects a GET endpoint that returns a JSON payload matching
`config/base-config.json`. A minimal response looks like this:

```json
{
  "gameId": "mm-001",
  "gameType": "mystery-manor",
  "title": "Mystery Manor",
  "subtitle": "Find the hidden artefacts before time runs out",
  "description": "Players explore a static scene and tap hidden objects to solve the manor mystery.",
  "backgroundImage": "/images/mystery-manor-game/background.png",
  "sceneImage": "/images/mystery-manor-game/scene.png",
  "hintIcon": "/images/mystery-manor-game/hint.png",
  "timerSeconds": 120,
  "maxHints": 3,
  "submissionEndpoint": "/api/games/mystery-manor/mm-001/results",
  "items": [
    {
      "id": "silver-key",
      "name": "Silver Key",
      "image": "/images/mystery-manor-game/items/silver-key.png",
      "hotspot": {
        "type": "circle",
        "x": 0.18,
        "y": 0.52,
        "radius": 0.05
      },
      "hint": "Look near the ornate chest."
    }
  ]
}
```

Coordinates inside `hotspot` are normalised (0–1) relative to the scene image.
The backend should ensure the assets it references are accessible to the client.

## Editable fields

Based on the `fieldSchema` in `config/index.js`:

- **Admin dashboard**: manage `timerSeconds`, `maxHints`, the complete `items`
  list (including hotspot coordinates), and the `submissionEndpoint`.
- **Merchant dashboard**: customise marketing copy (`title`, `subtitle`,
  `description`) plus artwork (`backgroundImage`, `sceneImage`, `hintIcon`) and
  per-item creative (`name`, `image`, `hint`).

## Image requirements

- Background and scene: 1920 × 1080 px PNG/JPG, consistent aspect ratio.
- Hint icon: 256 × 256 px PNG with transparency.
- Item art: 256 × 256 px PNG with transparency for best placement results.

## MongoDB storage

Store the base configuration as `mystery-manor:mm-001` inside the
`gameConfigs` collection. Each new campaign can duplicate the document and
override only the merchant-accessible fields. This keeps the runtime module easy
to port while letting backend services manage role-based overrides.
