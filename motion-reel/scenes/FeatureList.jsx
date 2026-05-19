// Cena 05 — FEATURE LIST (custom).
// Visual fixo: light theme (fundo branco/fog suave) + título preto + 3-4 itens
// em cards brancos com ícone + texto. IA preenche kicker, title, items.
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { CharReveal, KickerReveal, EASE, IconifyIcon } from '../helpers.jsx';

export const FeatureList = ({ kicker, title, items = [], start, end }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in defensivo do bg.
  const bgIn = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  return (
    <AbsoluteFill style={{
      background: MR_COLORS.fog,
      color: MR_COLORS.slateAbyss,
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '0 80px',
      gap: 36,
      fontFamily: MR_FONTS.display,
      opacity: bgIn,
    }}>
      {/* Camada 1: gradient sutil pra dar leve textura ao fundo branco */}
      <AbsoluteFill style={{
        background: `linear-gradient(180deg, ${MR_COLORS.white} 0%, ${MR_COLORS.fog} 60%, ${MR_COLORS.cream}88 100%)`,
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
              color: MR_COLORS.greenForest,
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
            color: MR_COLORS.slateAbyss,
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
                background: MR_COLORS.white,
                borderRadius: 18,
                boxShadow: '0 8px 24px rgba(20,63,44,0.08), 0 1px 2px rgba(20,63,44,0.06)',
                opacity: p,
                transform: `translateX(${((1 - p) * -28).toFixed(2)}px)`,
              }}>
                {/* Container do ícone — círculo verde claro suave */}
                <span style={{
                  flex: '0 0 auto',
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  background: `${MR_COLORS.greenBright}26`,
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
                      background: MR_COLORS.greenAccent,
                    }} />
                  )}
                </span>
                <span style={{
                  fontFamily: MR_FONTS.grotesk,
                  fontSize: 48,
                  fontWeight: 500,
                  lineHeight: 1.15,
                  letterSpacing: '-0.015em',
                  color: MR_COLORS.slateAbyss,
                }}>{text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
