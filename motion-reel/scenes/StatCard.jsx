import { AbsoluteFill } from 'remotion';
import { MR_COLORS, MR_FONTS, resolveColor } from '../theme.js';
import { KickerReveal, FadeSlide, NumberTicker, numberFormatter, SceneBackdrop } from '../helpers.jsx';

export const StatCard = ({ bg, fg, kicker = 'EM NÚMEROS', value = 0, suffix, label, format, background, start, end }) => {
  const bgColor = resolveColor(bg);
  const fgColor = resolveColor(fg);
  return (
    <AbsoluteFill style={{
      background: bgColor, color: fgColor,
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 80px', gap: 28, fontFamily: MR_FONTS.display,
    }}>
      <SceneBackdrop background={background} durSec={(end || 0) - (start || 0)} />
      <KickerReveal
        text={kicker}
        delay={0}
        dur={0.5}
        fromEm={0.18}
        toEm={0.4}
        style={{ fontFamily: MR_FONTS.mono, fontSize: 32, fontWeight: 400, textTransform: 'uppercase' }}
      />
      <FadeSlide delay={0.2} dur={0.4} ty={40}>
        <div style={{
          fontFamily: MR_FONTS.display, fontSize: 360, fontWeight: 700,
          lineHeight: 0.9, letterSpacing: '-0.05em',
          display: 'flex', alignItems: 'baseline', gap: 12,
        }}>
          <NumberTicker from={0} to={Number(value) || 0} delay={0.3} dur={0.9} format={numberFormatter(format)} />
          {suffix ? (
            <span style={{ fontSize: 200, fontWeight: 600, color: MR_COLORS.green, letterSpacing: '-0.04em' }}>{suffix}</span>
          ) : null}
        </div>
      </FadeSlide>
      <FadeSlide delay={0.7} dur={0.4} ty={20}>
        <div style={{
          fontFamily: MR_FONTS.grotesk, fontSize: 56, fontWeight: 500,
          lineHeight: 1.15, letterSpacing: '-0.01em', textAlign: 'center', maxWidth: 800,
        }}>{label}</div>
      </FadeSlide>
    </AbsoluteFill>
  );
};
