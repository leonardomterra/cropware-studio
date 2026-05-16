import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { MR_COLORS, MR_FONTS, resolveColor } from '../theme.js';
import { CharReveal, KickerReveal, EASE, SceneBackdrop, IconifyIcon } from '../helpers.jsx';

export const FeatureList = ({ bg, fg, kicker, title, items = [], background, start, end }) => {
  const bgColor = resolveColor(bg);
  const fgColor = resolveColor(fg);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{
      background: bgColor, color: fgColor,
      flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
      padding: '0 80px', gap: 48, fontFamily: MR_FONTS.display,
    }}>
      <SceneBackdrop background={background} durSec={(end || 0) - (start || 0)} />
      {kicker ? (
        <KickerReveal
          text={kicker}
          delay={0}
          dur={0.4}
          fromEm={0.2}
          toEm={0.4}
          style={{ fontFamily: MR_FONTS.mono, fontSize: 32, fontWeight: 400, color: MR_COLORS.green, textTransform: 'uppercase' }}
        />
      ) : null}
      <div style={{
        fontFamily: MR_FONTS.display, fontSize: 124, fontWeight: 700,
        lineHeight: 0.95, letterSpacing: '-0.04em', maxWidth: 920,
      }}>
        <CharReveal text={title || ''} delay={0.2} dur={0.4} stagger={0.03} ty={24} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%' }}>
        {items.map((rawItem, i) => {
          // item pode ser string ("Texto") OU objeto ({ text, icon })
          const item = typeof rawItem === 'string' ? { text: rawItem } : (rawItem || {});
          const text = item.text || '';
          const icon = item.icon || null;
          const itemDelay = 0.7 + i * 0.2;
          const start = itemDelay * fps;
          const end = (itemDelay + 0.4) * fps;
          const p = interpolate(frame, [start, end], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: EASE.outQuart,
          });
          return (
            <div key={i} style={{
              fontFamily: MR_FONTS.grotesk, fontSize: 64, fontWeight: 500,
              lineHeight: 1.15, letterSpacing: '-0.02em',
              display: 'flex', alignItems: 'center', gap: 28,
              opacity: p,
              transform: `translateX(${(1 - p) * -20}px)`,
            }}>
              {icon ? (
                <span style={{ flex: '0 0 auto', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconifyIcon icon={icon} size={72} />
                </span>
              ) : (
                <span style={{
                  flex: '0 0 auto', width: 24, height: 6,
                  background: MR_COLORS.greenAccent, alignSelf: 'center',
                }} />
              )}
              <span>{text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
