# Spin The Wheel Module

This directory encapsulates the assets, configuration, and placeholder React
component for the Spin The Wheel experience. The folder is self-contained so it
can be dropped into another repository without additional wiring.

## Folder contents

- `stw-game.js` – Placeholder React component that consumes the configuration.
- `config/base-config.json` – Canonical configuration shape suitable for MongoDB storage.
- `config/index.js` – Adds field metadata and exports the runtime default config.

## API contract

The frontend expects a JSON document that matches `config/base-config.json`. An
example response is shown below:

```json
{
  "gameId": "stw-001",
  "gameType": "spin-the-wheel",
  "title": "Spin the Wheel",
  "description": "Players spin the wheel once per eligible session to receive a random reward.",
  "wheelImage": "/images/stw-game-assets/wheel.png",
  "pointerImage": "/images/stw-game-assets/pointer.png",
  "backgroundImage": "/images/stw-game-assets/background.png",
  "spinButtonImage": "/images/stw-game-assets/spin-button.png",
  "maxSpinsPerUser": 1,
  "spinCooldownSeconds": 86400,
  "submissionEndpoint": "/api/games/spin-the-wheel/stw-001/results",
  "prizeSegments": [
    {
      "id": "voucher-5",
      "label": "$5 Voucher",
      "probability": 0.2,
      "image": "/images/stw-game-assets/segments/voucher-5.png",
      "description": "Discount on next purchase"
    }
  ]
}
```

The backend should merge any merchant overrides with the base configuration
before returning the payload.

## Editable fields

`config/index.js` exposes a `fieldSchema` that can drive dashboard forms:

- **Admin dashboard**: `maxSpinsPerUser`, `spinCooldownSeconds`, full
  management of `prizeSegments`, and `submissionEndpoint`.
- **Merchant dashboard**: creative assets (`wheelImage`, `pointerImage`,
  `backgroundImage`, `spinButtonImage`) and the marketing copy or imagery on
  each `prizeSegments` entry (`label`, `image`, `description`).

## Image requirements

- Wheel and pointer: transparent PNG or SVG, at least 2048 × 2048 px.
- Background: JPG or PNG, 1920 × 1080 px.
- Prize segment tiles: 512 × 512 px PNG with transparency where applicable.

## MongoDB storage

Insert the base config into the `gameConfigs` collection using the key
`spin-the-wheel:stw-001`. Each new campaign can clone this document and override
only the fields allowed by the `fieldSchema`. This keeps the runtime API simple
and ensures the module can be copied between projects without manual tweaks.
