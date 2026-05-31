// Cena 05 — FEATURE LIST (custom).
// Visual: bg + título + 3-4 itens em cards com ícone + texto. IA preenche
// kicker, title, items. R16: bg/fg/accent/cardBg vêm do theme prop
// (catálogo em themes.js per-slide-type).
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { MR_THEMES } from '../themes.js';
import { CharReveal, KickerReveal, EASE, IconifyIcon, SceneTextureBackdrop } from '../helpers.jsx';

const FALLBACK = MR_THEMES.escuro.perSlide['feature-list'];

// R28: Phosphor (ph:) — ícones monocromáticos SVG que herdam a cor do
// container (color: T.accent → verde do tema). Substituiu Twemoji que
// renderizava colorido fixo e ignorava o accent.
const resolveFeatureCardIcon = (icon = '', text = '') => {
  const haystack = `${icon} ${text}`.toLowerCase();
  if (/satellite|map|gps|ndvi|monitor|talh/.test(haystack)) return 'ph:map-trifold';
  if (/bar-chart|chart|report|document|dados|hist[oó]r|registro|provar/.test(haystack)) return 'ph:chart-bar';
  if (/seed|plant|sustain|crop|leaf|corn|soja|lavoura|campo|safra|colheita|diagn/.test(haystack)) return 'ph:plant';
  if (/phone|mobile|app|whatsapp|celular/.test(haystack)) return 'ph:device-mobile-camera';
  if (/cloud|weather|clima|previs/.test(haystack)) return 'ph:cloud-sun';
  if (/sun|thermometer|calor|temperatura/.test(haystack)) return 'ph:sun';
  if (/rain|drop|water|chuva|agua|umidade|irrig/.test(haystack)) return 'ph:drop';
  if (/alert|warning|risco|praga|doen/.test(haystack)) return 'ph:warning';
  if (/speed|tempo|rapido|agil/.test(haystack)) return 'ph:lightning';
  if (/gear|cog|config|automat/.test(haystack)) return 'ph:gear';
  if (/rocket|upload|prosper|resultado|ganho/.test(haystack)) return 'ph:rocket-launch';
  return 'ph:check-circle';
};

// Converte 0-1 em hex alpha de 2 caracteres (00-ff).
const alphaHex = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');

export const FeatureList = ({ kicker, title, items = [], theme, bgImage, bgImageBlur, bgOverlayOpacity, overlayColor, bgTexture, bgTextureOpacity, bgTextureInvert, start, end }) => {
  const T = theme || FALLBACK;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durSec = Math.max(1, (end || 0) - (start || 0));
  const durFrames = durSec * fps;

  // Fade in defensivo do bg.
  const bgIn = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  // Ken Burns lento pra foto de fundo (6s típico).
  const kbScale = interpolate(frame, [0, durFrames], [1.05, 1.18], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const kbTy = interpolate(frame, [0, durFrames], [0, -24], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const resolvedBgImage = bgImage || T.bgImage;

  return (
    <AbsoluteFill style={{
      background: T.bg,
      color: T.fg,
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '0 40px',
      gap: 36,
      fontFamily: MR_FONTS.display,
      opacity: bgIn,
    }}>
      {!T.flat ? <>
      {/* Camada 0: foto de fundo com Ken Burns. Theme define bgImageOverlayBlend
          + bgImageOverlayAlpha pra tonalizar diferentemente em light vs dark themes. */}
      {resolvedBgImage ? (
        <>
          <AbsoluteFill style={{
            backgroundImage: `url('${staticFile(resolvedBgImage)}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `scale(${kbScale.toFixed(4)}) translateY(${kbTy.toFixed(2)}px)`,
            transformOrigin: 'center',
            filter: `blur(${bgImageBlur != null ? bgImageBlur : 6}px) saturate(0.78) brightness(0.85)`,
            opacity: bgIn,
          }} />
          {/* Overlay de tonalização — usa scene.overlayColor quando setado
              (R26: padronização cross-scene), senão T.bgImageOverlay ou T.bg. */}
          <AbsoluteFill style={{
            background: overlayColor
              ? `${overlayColor}${alphaHex(bgOverlayOpacity != null ? bgOverlayOpacity : 0.55)}`
              : (T.bgImageOverlay || `${T.bg}${alphaHex(bgOverlayOpacity != null ? bgOverlayOpacity : 0.55)}`),
            opacity: bgIn,
            pointerEvents: 'none',
          }} />
        </>
      ) : null}

      {/* Camada 1: textura real de papel, visível também em thumbs do Studio. */}
      {T.paperTexture ? (
        <AbsoluteFill style={{
          backgroundImage: `url('${staticFile(T.paperTexture)}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: bgIn * (T.paperTextureOpacity ?? 0.42),
          mixBlendMode: T.paperTextureBlend || 'multiply',
          filter: T.paperTextureFilter || 'saturate(0.6) contrast(1.04)',
          pointerEvents: 'none',
        }} />
      ) : null}

      {/* Camada 1.5: textura overlay do pool (opcional, sobrepõe paper) */}
      <SceneTextureBackdrop
        src={bgTexture || T.bgTexture}
        durSec={durSec}
        opacity={bgTextureOpacity != null ? bgTextureOpacity : 0.08}
        invert={bgTextureInvert !== false}
      />
      </> : null}

      {/* Camada 2: conteúdo — kicker + título + cards */}
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
        gap: 54,
        boxSizing: 'border-box',
      }}>
        {kicker ? (
          <KickerReveal
            text={String(kicker).toUpperCase()}
            delay={0}
            dur={0.4}
            fromEm={T.kickerLetterSpacingFrom ?? 0.02}
            toEm={T.kickerLetterSpacingTo ?? 0.06}
            style={{
              fontFamily: MR_FONTS.caps,
              fontSize: T.kickerFontSize || 72,
              fontWeight: 400,
              lineHeight: 1.18,
              maxWidth: T.kickerMaxWidth || 760,
              color: T.accentDeep || T.accent,
              textTransform: 'uppercase',
              whiteSpace: 'normal',
              overflowWrap: 'break-word',
            }}
          />
        ) : null}

        {/* R28: linha abaixo do kicker, verde levemente mais escuro */}
        {kicker ? (
          <div style={{
            width: 160,
            height: 4,
            background: MR_COLORS.greenAccent,
            borderRadius: 2,
            transformOrigin: 'left center',
            transform: `scaleX(${interpolate(frame, [0.35 * fps, 0.7 * fps], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
            }).toFixed(3)})`,
            marginTop: -32,
          }} />
        ) : null}

        {title ? (
          <div style={{
            fontFamily: MR_FONTS.display,
            fontSize: T.titleFontSize || 76,
            fontWeight: 500,
            lineHeight: 1.18,
            letterSpacing: '-0.025em',
            maxWidth: T.titleMaxWidth || 1020,
            color: T.fg,
            overflowWrap: 'break-word',
            transform: 'translateZ(0)',
          }}>
            <CharReveal text={title} delay={0.25} dur={0.45} stagger={0.03} ty={24} />
          </div>
        ) : null}

        {/* Cards dos itens — cada um com fundo branco, sombra suave, ícone + texto */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          width: '100%',
          maxWidth: 1020,
          marginTop: 16,
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
                gap: 36,
                padding: '28px 28px',
                minHeight: 172,
                background: T.flat
                  ? MR_COLORS.white
                  : 'linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)',
                backdropFilter: T.flat ? 'none' : 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: T.flat ? 'none' : 'blur(20px) saturate(160%)',
                borderRadius: 18,
                boxShadow: T.flat ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(0,0,0,0.12)',
                border: T.flat ? '1px solid rgba(15,23,42,0.10)' : '1px solid rgba(255,255,255,0.20)',
                opacity: p,
                transform: `translateX(${((1 - p) * -28).toFixed(2)}px)`,
                boxSizing: 'border-box',
              }}>
                {/* Container do ícone — bloco com tint do accent do tema */}
                <span style={{
                  flex: '0 0 auto',
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  background: `${T.accent}33`,
                  color: T.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <IconifyIcon icon={resolveFeatureCardIcon(icon, text)} size={50} color={T.accent} />
                </span>
                <span style={{
                  fontFamily: MR_FONTS.grotesk,
                  fontSize: 42,
                  fontWeight: 500,
                  lineHeight: 1.15,
                  letterSpacing: '-0.015em',
                  color: T.flat ? MR_COLORS.slateAbyss : MR_COLORS.white,
                }}>{text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
