// Root do Remotion CLI — registra a Composition pra `npx remotion render`
// e `npx remotion studio`. NÃO é usado pelo Player (este pega o MotionReel
// component direto).
import { Composition } from 'remotion';

import { MotionReel } from './MotionReel.jsx';
import { MOTION_REEL_DEFAULT, computeReelDurationInFrames } from './default-storyboard.js';
import { loadMotionReelFonts } from './fonts.js';

loadMotionReelFonts();

export const RemotionRoot = () => {
  const fps = MOTION_REEL_DEFAULT.fps || 30;
  return (
    <Composition
      id="MotionReel"
      component={MotionReel}
      durationInFrames={computeReelDurationInFrames(MOTION_REEL_DEFAULT)}
      fps={fps}
      width={MOTION_REEL_DEFAULT.width || 1080}
      height={MOTION_REEL_DEFAULT.height || 1920}
      defaultProps={{ storyboard: MOTION_REEL_DEFAULT }}
      // Recalcula metadata se o storyboard vier via --props com duration diferente.
      calculateMetadata={({ props, defaultProps }) => {
        const sb = (props && props.storyboard) || defaultProps.storyboard;
        return {
          props,
          durationInFrames: computeReelDurationInFrames(sb),
          fps: sb.fps || 30,
          width: sb.width || 1080,
          height: sb.height || 1920,
        };
      }}
    />
  );
};
