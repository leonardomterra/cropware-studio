// Mapeia as strings de transição que vêm do storyboard (cut / fade /
// wipe-up / wipe-down / push-up / push-left / mask-circle / flash /
// zoom-blur) para presentations do TransitionSeries. Os 3 últimos
// (flash, zoom-blur, mask-circle) usam implementações próprias em
// custom-transitions.jsx — os 4 primeiros vêm direto do @remotion/transitions.
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { none } from '@remotion/transitions/none';
import { linearTiming } from '@remotion/transitions';
import { Easing } from 'remotion';

import { flash, zoomBlur, maskCircle, cinematicBlur, ringTunnel, glitch, slideRadial, glassFrost, irisSquare, driftFade, zoomPunch, whipPan, splitSlide, dipToBrand, push3D, blurDissolve, glowBloom } from './custom-transitions.jsx';

export function resolvePresentation(type, sceneTransitionConfig) {
  switch (type) {
    case 'cut':            return none();
    case 'fade':           return fade();
    case 'wipe-up':        return wipe({ direction: 'from-bottom' });
    case 'wipe-down':      return wipe({ direction: 'from-top' });
    case 'push-up':        return slide({ direction: 'from-bottom' });
    case 'push-left':      return slide({ direction: 'from-right' });
    case 'mask-circle':    return maskCircle();
    case 'flash':          return flash({ color: (sceneTransitionConfig && sceneTransitionConfig.color) || '#FFFFFF' });
    case 'zoom-blur':      return zoomBlur();
    case 'zoom-punch':     return zoomPunch({ origin: (sceneTransitionConfig && sceneTransitionConfig.origin) || 'center', scale: (sceneTransitionConfig && sceneTransitionConfig.scale) });
    case 'whip-pan':       return whipPan({ direction: (sceneTransitionConfig && sceneTransitionConfig.direction) || 'left' });
    case 'split-slide':    return splitSlide({ direction: (sceneTransitionConfig && sceneTransitionConfig.direction) || 'horizontal' });
    case 'dip-to-brand':   return dipToBrand({ color: (sceneTransitionConfig && sceneTransitionConfig.color) || '#6AC58F' });
    case 'push-3d':        return push3D({ direction: (sceneTransitionConfig && sceneTransitionConfig.direction) || 'left' });
    case 'blur-dissolve':  return blurDissolve({ blur: (sceneTransitionConfig && sceneTransitionConfig.blur) });
    case 'glow-bloom':     return glowBloom({ tint: (sceneTransitionConfig && sceneTransitionConfig.tint), intensity: (sceneTransitionConfig && sceneTransitionConfig.intensity) });
    // R9 — transições cinematográficas novas
    case 'cinematic-blur': return cinematicBlur();
    case 'ring-tunnel':    return ringTunnel({ color: (sceneTransitionConfig && sceneTransitionConfig.color) || '#6AC58F' });
    case 'glitch':         return glitch();
    case 'slide-radial':   return slideRadial({ origin: (sceneTransitionConfig && sceneTransitionConfig.origin) || 'bottom-left' });
    case 'light-leak':     return driftFade();
    // Novas transições R13 (2026-05)
    case 'glass-frost':    return glassFrost();
    case 'iris-square':    return irisSquare();
    case 'drift-fade':     return driftFade();
    case 'light-streak':   return driftFade();
    default:               return fade();
  }
}

// Curva de easing por nome (mesmo vocabulário do storyboard antigo).
function easingByName(name) {
  switch (name) {
    case 'linear':         return Easing.linear;
    case 'in-out-quart':   return Easing.bezier(0.76, 0, 0.24, 1);
    case 'out-quint':      return Easing.bezier(0.22, 1, 0.36, 1);
    case 'out-quart':      return Easing.bezier(0.25, 1, 0.5, 1);
    case 'in-out-cubic':   return Easing.bezier(0.65, 0, 0.35, 1);
    case 'out-expo':       return Easing.bezier(0.16, 1, 0.3, 1);
    case 'in-out-expo':    return Easing.bezier(0.87, 0, 0.13, 1);
    case 'out-back':       return Easing.bezier(0.34, 1.56, 0.64, 1);
    default:               return Easing.bezier(0.65, 0, 0.35, 1);
  }
}

export function resolveTiming(scene, fps) {
  const dur = (scene && scene.transitionIn && scene.transitionIn.dur) || 0.3;
  const durationInFrames = Math.max(2, Math.round(dur * fps));
  const easing = easingByName(scene && scene.transitionIn && scene.transitionIn.easing);
  return linearTiming({ durationInFrames, easing });
}
