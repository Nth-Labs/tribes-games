// Single source of truth: map backend identifiers → module initializer components.
import FlipCardNewGameInit from "./flip-card-module";

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

  // Example for future templates:
  // "spinthewheel-v1": SpinTheWheelInit,
  // "spin-the-wheel":  SpinTheWheelInit,
};

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
