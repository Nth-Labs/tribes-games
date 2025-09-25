# Matching Game Module

This folder contains everything required to run the simplified flip-card matching game. The
experience now boots from the same minimal JSON shape the new initialiser API returns, so the
frontend can mirror the MVP payload without extra transformation.

## Folder contents

- `matching-game.js`, `match-card.js`, `results-screen.js` – UI and core game logic.
- `matching-game-init.js` – Thin wrapper that simulates fetching the API response.
- `config/index.js` – Sample payload used during local development.
- `matching-game-theme-preview.js` – Lightweight preview that surfaces the configured colours and
  card art.
- `unique-cards.js` – Fallback deck used when the payload does not specify images.

## Config payload

`config/index.js` exports the shape returned by the API. Every matching-card game now ships the
following base fields:

```json
{
  "game_id": "f6c8f7c4-5ab7-41f2-9a1f-abc123xyz456",
  "game_template_id": "flip-card-new-uuid",
  "distribution_info": {
    "type": "score_threshold",
    "endpoint": "/api/games/flip-card/claim/score-threshold"
  },
  "title": "Azure Breeze Flip Challenge",
  "subtitle": "Match the pairs before you run out of moves.",
  "move_limit": 8,
  "initial_reveal_seconds": 3,
  "card_upflip_seconds": 1.2,
  "primary_color": "#fdfaf5",
  "secondary_color": "#7DD3FC",
  "tertiary_color": "#FDE0AB",
  "card_back_image": "/images/matching-game-assets/card-back.png",
  "image_1": "/images/matching-game-assets/white-tiffin-assets/mee-siam-with-prawns.png",
  "image_2": "/images/matching-game-assets/white-tiffin-assets/local-trio.png",
  "image_3": "/images/matching-game-assets/white-tiffin-assets/nasi-lemak-beef.png",
  "image_4": "/images/matching-game-assets/white-tiffin-assets/chicken-curry.png",
  "image_5": "/images/matching-game-assets/white-tiffin-assets/trio-snack-platter.png",
  "image_6": "/images/matching-game-assets/white-tiffin-assets/fish-maw-seafood-soup.png",
  "image_7": "/images/matching-game-assets/pokemon-assets/bulbasaur.png",
  "image_8": "/images/matching-game-assets/pokemon-assets/arcanine.png"
}
```

The UI consumes the snake_case fields directly. Card data is derived from the enumerated `image_n`
entries, and defaults to the fallback deck if none are supplied.

## Theming

MVP styling keeps to three colours. `primary_color`, `secondary_color`, and `tertiary_color`
respectively drive the backdrop, accent, and support tones. The React components expand those values
into a minimal theme so the game renders consistently even when the payload omits optional fields.

## Assets

Card art should be transparent PNGs. The example payload references the sample assets stored under
`public/images/matching-game-assets/`. Update those paths (or the files themselves) to match the
campaign you are shipping.
