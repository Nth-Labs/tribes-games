# Precision Timer Module

This directory houses the configuration and React implementation for the
Precision Timer challenge. Players start a five-second countdown and try to stop
it as close to zero as possible. The folder mirrors the structure of the other
modules so it can be copied into another project without additional wiring.

## Folder contents

- `precision-timer-game-init.js` – Lightweight wrapper that fetches the config
  and mounts the gameplay component.
- `precision-timer-game.js` – Countdown gameplay logic, submission mock, and UI.
- `results-screen.js` – Post-game summary and return-to-home link.
- `config/base-config.json` – Canonical configuration document for storage.
- `config/index.js` – Exports the runtime config plus schema metadata.

## API contract

The frontend expects a JSON payload that matches the shape of
`config/base-config.json`. A representative response looks like this:

```json
{
  "gameId": "precision-001",
  "gameType": "precision-timer",
  "title": "Precision Timer Challenge",
  "subtitle": "Stop the countdown at the perfect moment",
  "description": "Players start a five-second countdown and try to stop it as close to zero as possible.",
  "countdownSeconds": 5,
  "startButtonLabel": "Start Countdown",
  "stopButtonLabel": "Stop Timer",
  "submissionEndpoint": "/api/games/precision-timer/precision-001/results"
}
```

When the player ends the countdown, the frontend posts the final score to the
`submissionEndpoint`. The mock implementation in this repository resolves the
promise locally but the production service should persist the results.

## Editable fields

`config/index.js` surfaces a `fieldSchema` that downstream dashboards can use to
control access:

- **Admin dashboard**: `countdownSeconds`, `submissionEndpoint`.
- **Merchant dashboard**: marketing copy (`title`, `subtitle`, `description`) and
  button labels (`startButtonLabel`, `stopButtonLabel`).

## MongoDB storage

Store the base configuration document in a `gameConfigs` collection using the
key `precision-timer:precision-001`. Clone this record for new campaigns and
apply overrides according to the `fieldSchema`. The runtime payload should be a
single merged document that mirrors `base-config.json`.
