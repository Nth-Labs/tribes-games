// Single source of truth: map backend identifiers → module initializer components.
import FlipCardNewGameInit, {
  sampleFlipCardNewGameDocument,
} from "./flip-card-module";
import GachaponGameInit, { sampleGachaponGameDocument } from "./gachapon-module";
import ScratchCardGameInit, {
  sampleScratchCardGameDocument,
} from "./scratch-card-module";
import OverworldExplorerInit, {
  sampleOverworldGameDocument,
} from "./overworld-module";
import DinoJumpGameInit, {
  sampleDinoJumpGameDocument,
} from "./dino-jump-module";

/**
 * Keys should match what's coming from backend:
 *  - Prefer an exact template id (e.g., UUID) for precise control
 *  - Add a generic game_type as fallback for the whole family
 *
 * Add new modules by importing them above and adding both keys here.
 */
export const GAME_MODULES = {
  // Flip Card — specific template (most specific match)
  "flip-card-new-uuid": FlipCardNewGameInit,
  // Flip Card — generic family/type (fallback if template id changes)
  "flip-card-new": FlipCardNewGameInit,

  // Gachapon capsule
  "gachapon-celebration": GachaponGameInit,
  gachapon: GachaponGameInit,

  // Scratch card module
  "scratch-card-starlight": ScratchCardGameInit,
  "scratch-card": ScratchCardGameInit,

  // Overworld explorer prototype
  "overworld-adventure": OverworldExplorerInit,
  overworld: OverworldExplorerInit,

  // Dino jump endless runner
  "dino-jump-canyon-run": DinoJumpGameInit,
  "dino-jump": DinoJumpGameInit,

  // Example for future templates:
  // "spinthewheel-v1": SpinTheWheelInit,
  // "spin-the-wheel":  SpinTheWheelInit,
};

export const GAME_LIBRARY = [
  {
    slug: "flip-card-new-uuid",
    title: sampleFlipCardNewGameDocument.title || "Flip Card (New)",
    subtitle: sampleFlipCardNewGameDocument.subtitle,
    thumbnail:
      sampleFlipCardNewGameDocument.game_logo_image ||
      sampleFlipCardNewGameDocument.game_background_image,
    launchPayload: {
      game_template_id: "flip-card-new",
      game_type: sampleFlipCardNewGameDocument.game_type || "flip-card-new",
    },
    sampleConfig: sampleFlipCardNewGameDocument,
  },
  {
    slug: "gachapon-celebration",
    title: sampleGachaponGameDocument.title || "Celestial Capsule Gachapon",
    subtitle: sampleGachaponGameDocument.subtitle,
    thumbnail:
      sampleGachaponGameDocument.sample_thumbnail ||
      sampleGachaponGameDocument.machine_image,
    launchPayload: {
      game_template_id: "gachapon-celebration",
      game_type: sampleGachaponGameDocument.game_type,
    },
    sampleConfig: sampleGachaponGameDocument,
  },
  {
    slug: "scratch-card-starlight",
    title: sampleScratchCardGameDocument.title || "Radiant Scratch Card",
    subtitle: sampleScratchCardGameDocument.subtitle,
    thumbnail:
      sampleScratchCardGameDocument.sample_thumbnail ||
      sampleScratchCardGameDocument.card_background_image,
    launchPayload: {
      game_template_id: "scratch-card-starlight",
      game_type: sampleScratchCardGameDocument.game_type,
    },
    sampleConfig: sampleScratchCardGameDocument,
  },
  {
    slug: "overworld-adventure",
    title: sampleOverworldGameDocument.title || "Sprite Walkabout",
    subtitle: sampleOverworldGameDocument.subtitle,
    thumbnail: sampleOverworldGameDocument.sample_thumbnail,
    launchPayload: {
      game_template_id: "overworld-adventure",
      game_type: sampleOverworldGameDocument.game_type || "overworld",
    },
    sampleConfig: sampleOverworldGameDocument,
  },
  {
    slug: "dino-jump-canyon-run",
    title: sampleDinoJumpGameDocument.title || "Canyon Run: Dino Dash",
    subtitle: sampleDinoJumpGameDocument.subtitle,
    thumbnail:
      sampleDinoJumpGameDocument.sample_thumbnail ||
      sampleDinoJumpGameDocument.background_image,
    launchPayload: {
      game_template_id: "dino-jump-canyon-run",
      game_type: sampleDinoJumpGameDocument.game_type || "dino-jump",
    },
    sampleConfig: sampleDinoJumpGameDocument,
  },
];

/**
 * Pick the correct module to render a given game payload.
 * Resolution order:
 *   1) game_template_id
 *   2) game_type
 * Returns null if no match (GameScreen will render an error).
 */
export function pickModuleFor(game = {}) {
  return (
    GAME_MODULES[game.game_template_id] ||
    GAME_MODULES[game.game_type] ||
    null
  );
}
