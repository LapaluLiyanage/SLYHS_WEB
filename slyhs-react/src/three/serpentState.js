/**
 * Shared, mutable state for the particle serpent.
 * Page timelines tween these values with GSAP (scroll-scrubbed);
 * the WebGL scene reads them every frame. No React re-renders involved.
 */
export const serpentState = {
  opacity: 0,   // overall visibility 0..1
  disperse: 1,  // 0 = formed body, 1 = scattered sparks
  coil: 0,      // 0 = slithering S-curve, 1 = tight coil
  x: 0,         // world offset
  y: 0,
  rotY: 0,      // radians (section pose)
  spin: 0,      // extra radians, scrubbed by pinned sections
  rotX: 0,
  scale: 1,
  speed: 1      // slither speed multiplier
};

export const SERPENT_DEFAULTS = { ...serpentState };

export function resetSerpent() {
  Object.assign(serpentState, SERPENT_DEFAULTS);
}
