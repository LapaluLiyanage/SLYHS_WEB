import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap';
import { serpentState, resetSerpent } from './serpentState';

export const POSES = {
  hidden:   { opacity: 0, disperse: 1 },
  assemble: { opacity: .95, disperse: 0, coil: 0, x: 0, y: -2.1, rotY: -.15, rotX: .62, scale: 1.08, speed: 1 },
  coil:     { opacity: .85, disperse: 0, coil: 1, x: 0, y: -1.75, rotY: 0, rotX: .22, scale: .78, speed: .6 },
  slither:  { opacity: .85, disperse: 0, coil: .12, x: 0, y: .4, rotY: -.35, rotX: .55, scale: 1.05, speed: 1.6 },
  scatter:  { opacity: .55, disperse: .9, coil: .3, x: 0, y: 0, rotY: .2, rotX: .3, scale: 1.1, speed: .8 },
  sideCoil: { opacity: .55, disperse: 0, coil: 1, x: 3.4, y: -.4, rotY: .3, rotX: .2, scale: .8, speed: .5 },
  faint:    { opacity: .28, disperse: .2, coil: .9, x: -3.6, y: 0, rotY: -.2, rotX: .25, scale: .8, speed: .5 }
};

export function goPose(pose, duration = 1.8) {
  gsap.to(serpentState, { ...POSES[pose], duration, ease: 'power2.inOut', overwrite: 'auto' });
}

/**
 * steps: [{ trigger, pose, start?, end?, duration? }]
 * Each section owns a pose; entering it from either direction morphs the serpent there.
 * Call inside a useGSAP() callback so the triggers are cleaned up with the page.
 */
export function choreograph(steps) {
  resetSerpent();
  if (prefersReducedMotion) return;
  steps.forEach((s) => {
    ScrollTrigger.create({
      trigger: s.trigger,
      start: s.start || 'top 65%',
      end: s.end || 'bottom 35%',
      onToggle: (self) => { if (self.isActive) goPose(s.pose, s.duration); }
    });
  });
}
