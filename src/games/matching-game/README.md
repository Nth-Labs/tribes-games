# Matching Game Module

This folder contains everything required to run the flip-card matching mini-game.
It includes the React components, a default configuration, and documentation for
how the backend should serve configuration data.

## Folder contents

- `matching-game.js`, `match-card.js`, `results-screen.js` – UI and game logic.
- `matching-game-init.js` – Thin wrapper that fetches and supplies configuration to the game.
- `config/base-config.json` – Canonical configuration object that can be stored in MongoDB.
- `config/index.js` – Helper that enriches the base config with schema metadata for the UI.
- `unique-cards.js` – Convenience helper that exposes the default card list.

## API contract

The game expects a JSON payload that mirrors the shape of
`config/base-config.json`. A minimal payload looks like:

```json
{
  "gameId": "flip-001",
  "gameType": "flip-card",
  "title": "White Tiffin Flip & Match",
  "description": "Players flip cards to match pairs of dishes before they run out of moves.",
  "moveLimit": 5,
  "initialRevealSeconds": 3,
  "cardUpflipSeconds": 1,
  "cardBackImage": "/images/matching-game-assets/white-tiffin-assets/white-tiffin-logo.png",
  "submissionEndpoint": "/api/games/flip-card/flip-001/results",
  "cards": [
    {
      "id": "mee-siam-with-prawns",
      "type": "Mee Siam With Prawns",
      "image": "/images/matching-game-assets/white-tiffin-assets/mee-siam-with-prawns.png",
      "altText": "White Tiffin Mee Siam With Prawns card artwork"
    }
  ]
}
```

The frontend calls the dedicated API using a GET request and expects a JSON
response. Additional metadata can be included, but the fields above must be
present for the current game implementation.

## Editable fields

`config/index.js` exposes a `fieldSchema` describing who can edit each field.
Summarised below:

- **Admin dashboard**
  - `moveLimit` (number)
  - `initialRevealSeconds` (number)
  - `cardUpflipSeconds` (number)
  - `cards` (full CRUD access)
  - `submissionEndpoint`
- **Merchant dashboard**
  - `cardBackImage` (image asset)
  - `cards` (`type`, `image`, and `altText` for individual cards)

The schema can be surfaced directly in form builders or used to drive access
control logic.

## Image requirements

- Card faces: transparent PNG, at least 512 × 512 px.
- Card backs: transparent PNG, square ratio recommended.
- Provide `altText` for accessibility – the frontend will pass it through to
  the rendered `<img>` tags.

## MongoDB storage

We recommend storing the base configuration in a `gameConfigs` collection using
`<gameType>:<gameId>` (e.g. `flip-card:flip-001`) as the document key. The
structure in `config/base-config.json` can be inserted directly. When a new
campaign is created, clone this base record and allow merchants to override only
the fields permitted for their role.
