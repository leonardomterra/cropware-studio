import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { MR_FONTS, resolveColor } from '../theme.js';
import { CharReveal, EASE, SceneBackdrop } from '../helpers.jsx';

export const Keyword = ({ word, bg, fg, underline = true, background, start, end }) => {
  const bgColor = resolveColor(bg);
  const fgColor = resolveColor(fg);
  // Sublinha entra DEPOIS dos chars — calcula delay baseado no comprimento.
  const charCount = (word || '').length;
  const underlineDelay = Math.max(0.25, charCount * 0.035 + 0.1);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const underlineP = interpolate(frame, [underlineDelay * fps, (underlineDelay + 0.45) * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE.outQuart,
  });
  return (
    <AbsoluteFill style={{
      background: bgColor, color: fgColor,
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 80px', gap: 32, fontFamily: MR_FONTS.display,
    }}>
      <SceneBackdrop background={background} durSec={(end || 0) - (start || 0)} />
      <div style={{
        fontFamily: MR_FONTS.display, fontSize: 180, fontWeight: 700,
        lineHeight: 0.92, letterSpacing: '-0.035em', textAlign: 'center', maxWidth: 920,
      }}>
        <CharReveal text={word || ''} delay={0} dur={0.35} stagger={0.035} ty={24} />
      </div>
      {underline && (
        <div style={{
          width: 52, height: 4, background: fgColor, opacity: 0.85,
          transformOrigin: 'left center', transform: `scaleX(${underlineP})`,
        }} />
      )}
    </AbsoluteFill>
  );
};
