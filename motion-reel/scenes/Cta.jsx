import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, staticFile } from 'remotion';
import { MR_FONTS, resolveColor } from '../theme.js';
import { CharReveal, KickerReveal, FadeSlide, SceneBackdrop } from '../helpers.jsx';

export const Cta = ({ bg, fg, logoUrl = 'logo-cropware-pb-final.svg', headline, sublabel, handle, background, start, end }) => {
  const bgColor = resolveColor(bg);
  const fgColor = resolveColor(fg);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoP = interpolate(frame, [0.1 * fps, 0.55 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  return (
    <AbsoluteFill style={{
      background: bgColor, color: fgColor,
      flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
      padding: '240px 80px', fontFamily: MR_FONTS.display,
    }}>
      <SceneBackdrop background={background} durSec={(end || 0) - (start || 0)} />
      <div style={{
        width: 460, height: 110,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: logoP,
        transform: `scale(${0.92 + 0.08 * logoP})`,
      }}>
        <img
          src={typeof staticFile === 'function' ? staticFile(logoUrl) : logoUrl}
          alt="Cropware"
          style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36, textAlign: 'center' }}>
        <div style={{
          fontFamily: MR_FONTS.display, fontSize: 156, fontWeight: 700,
          lineHeight: 0.92, letterSpacing: '-0.04em',
        }}>
          <CharReveal text={headline || ''} delay={0.4} dur={0.4} stagger={0.035} ty={28} />
        </div>
        <FadeSlide delay={1.1} dur={0.4} ty={20}>
          <div style={{
            fontFamily: MR_FONTS.grotesk, fontSize: 56, fontWeight: 500,
            lineHeight: 1.2, letterSpacing: '-0.01em', maxWidth: 820,
          }}>{sublabel}</div>
        </FadeSlide>
        {handle ? (
          <KickerReveal
            text={handle}
            delay={1.5}
            dur={0.4}
            fromEm={0.15}
            toEm={0.3}
            style={{ fontFamily: MR_FONTS.mono, fontSize: 32, fontWeight: 400, textTransform: 'uppercase' }}
          />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
