// Cena 05 — FEATURE LIST (custom).
// Visual: bg + título + 3-4 itens em cards com ícone + texto. IA preenche
// kicker, title, items. R16: bg/fg/accent/cardBg vêm do theme prop
// (catálogo em themes.js per-slide-type).
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { MR_THEMES } from '../themes.js';
import { CharReveal, KickerReveal, EASE, IconifyIcon } from '../helpers.jsx';

const FALLBACK = MR_THEMES.editorial.perSlide['feature-list'];

export const FeatureList = ({ kicker, title, items = [], theme, start, end }) => {
  const T = theme || FALLBACK;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in defensivo do bg.
  const bgIn = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  return (
    <AbsoluteFill style={{
      background: T.bg,
      color: T.fg,
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '0 80px',
      gap: 36,
      fontFamily: MR_FONTS.display,
      opacity: bgIn,
    }}>
      {/* Camada 1: gradient sutil pra dar dimensão ao bg
          (claro: white→fog→cream; vibrante: bg → bg leve mais escuro) */}
      <AbsoluteFill style={{
        background: `linear-gradient(180deg, ${T.bg} 0%, ${T.bg} 60%, ${T.bg}cc 100%)`,
        opacity: bgIn,
      }} />

      {/* Camada 2: vinheta MUITO sutil pra dar dimensão */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.06) 100%)',
        opacity: bgIn,
        pointerEvents: 'none',
      }} />

      {/* Camada 3: conteúdo — kicker + título + cards */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '0 80px',
        gap: 38,
        boxSizing: 'border-box',
      }}>
        {kicker ? (
          <KickerReveal
            text={String(kicker).toUpperCase()}
            delay={0}
            dur={0.4}
            fromEm={0.18}
            toEm={0.32}
            style={{
              fontFamily: MR_FONTS.mono,
              fontSize: 30,
              fontWeight: 400,
              color: T.accentDeep || T.accent,
              textTransform: 'uppercase',
            }}
          />
        ) : null}

        {title ? (
          <div style={{
            fontFamily: MR_FONTS.display,
            fontSize: 116,
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            maxWidth: 880,
            color: T.fg,
            transform: 'translateZ(0)',
          }}>
            <CharReveal text={title} delay={0.25} dur={0.45} stagger={0.03} ty={24} />
          </div>
        ) : null}

        {/* Cards dos itens — cada um com fundo branco, sombra suave, ícone + texto */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          width: '100%',
          maxWidth: 920,
          marginTop: 8,
        }}>
          {items.map((rawItem, i) => {
            const item = typeof rawItem === 'string' ? { text: rawItem } : (rawItem || {});
            const text = item.text || '';
            const icon = item.icon || null;
            const itemDelay = 0.75 + i * 0.16;
            const startF = itemDelay * fps;
            const endF = (itemDelay + 0.45) * fps;
            const p = interpolate(frame, [startF, endF], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: EASE.outQuart,
            });
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                padding: '20px 28px',
                background: T.cardBg || MR_COLORS.white,
                borderRadius: 18,
                border: T.cardBorder ? `1px solid ${T.cardBorder}` : 'none',
                boxShadow: '0 8px 24px rgba(20,63,44,0.08), 0 1px 2px rgba(20,63,44,0.06)',
                opacity: p,
                transform: `translateX(${((1 - p) * -28).toFixed(2)}px)`,
              }}>
                {/* Container do ícone — bloco com tint do accent */}
                <span style={{
                  flex: '0 0 auto',
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  background: `${T.accent}26`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {icon ? (
                    <IconifyIcon icon={icon} size={48} />
                  ) : (
                    <div style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: T.accent,
                    }} />
                  )}
                </span>
                <span style={{
                  fontFamily: MR_FONTS.grotesk,
                  fontSize: 48,
                  fontWeight: 500,
                  lineHeight: 1.15,
                  letterSpacing: '-0.015em',
                  color: T.fg,
                }}>{text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
