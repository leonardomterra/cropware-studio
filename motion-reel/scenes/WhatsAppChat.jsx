// Cena 09 — WHATSAPP CHAT (custom, tema-driven).
// Mockup de iPhone com conversa WhatsApp entre produtor e IA Cropware.
// Visual fixo: imagem `conheca-gd-bg.webp` (homem com tablet ao entardecer)
// + Ken Burns + glass slate como FUNDO DO SLIDE (não do mockup). Mockup tem
// iOS status bar (dynamic island + horário + wifi/signal/bateria) + header
// WhatsApp + bolhas + input bar grande. Avatar: icon-cropware.svg branco em
// fundo verde.
//
// Props: messages — array de { from: 'user' | 'ai', text }. Máx 5 mensagens.
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile } from 'remotion';
import { MR_COLORS, MR_FONTS } from '../theme.js';
import { MR_THEMES } from '../themes.js';
import { EASE, SceneTextureBackdrop } from '../helpers.jsx';

const FALLBACK = MR_THEMES.escuro.perSlide['whatsapp-chat'];

const WHATSAPP_GREEN = '#25D366';
const WALLPAPER_BG = '#E5DDD3';
const USER_BUBBLE = '#DCF8C6';
const AI_BUBBLE = '#FFFFFF';
const STATUS_BAR_HEIGHT = 76;
const WHATSAPP_HEADER_HEIGHT = 134;

const DEFAULT_MESSAGES = [
  { from: 'user', text: 'Como está minha lavoura hoje?' },
  { from: 'ai',   text: 'Talhão 12 com NDVI 0.78 — saudável. Talhão 7 caiu pra 0.42, sugiro inspeção.' },
  { from: 'user', text: 'O que pode estar acontecendo?' },
  { from: 'ai',   text: 'Padrão sugere falta de nitrogênio. Quer abrir um plano de adubação?' },
];

// Converte hex (#aabbcc) em "r,g,b" pra usar em rgba(). Aceita ou rejeita inválido.
const _hexToRgb = (hex) => {
  const h = String(hex || '').replace('#', '').trim();
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return `${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff}`;
};

export const WhatsAppChat = ({ messages = DEFAULT_MESSAGES, theme, bgImage, bgImageBlur, bgOverlayOpacity, overlayColor, bgTexture, bgTextureOpacity, bgTextureInvert, start, end }) => {
  const T = theme || FALLBACK;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durSec = Math.max(1, (end || 0) - (start || 0));
  const durFrames = durSec * fps;

  const msgs = (messages || []).slice(0, 5);

  // ──── Entrada cinematográfica do FUNDO (igual às locked) ────
  const enterP = interpolate(frame, [0, 0.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuint,
  });
  const kbScale = interpolate(frame, [0, durFrames], [1.05, 1.20], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const imgScale = kbScale + (1 - enterP) * 0.12;
  const kbTy = interpolate(frame, [0, durFrames], [0, -32], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const imgBlur = (bgImageBlur != null ? bgImageBlur : 6) + (1 - enterP) * 14;
  const imgOpacity = enterP;
  const overlayP = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });
  const glassBlur = interpolate(frame, [0, 0.8 * fps], [0, 28], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart,
  });

  // ──── Entrada do phone mockup ────
  const phoneIn = interpolate(frame, [0.3 * fps, 0.95 * fps], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuint,
  });
  const phoneScale = 0.92 + 0.08 * phoneIn;
  const phoneOffsetY = (1 - phoneIn) * 80;

  return (
    <AbsoluteFill style={{ background: T.reelSharedBg ? 'transparent' : (T.bg || MR_COLORS.slateAbyss), overflow: 'hidden', fontFamily: MR_FONTS.display }}>
      {(!T.flat && !T.reelSharedBg) ? <>
      {/* Camada 1: imagem de fundo com Ken Burns lento (varia por tema) */}
      <AbsoluteFill style={{
        backgroundImage: `url('${staticFile(bgImage || T.bgImage || 'wpp-bg-pattern.png')}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `scale(${imgScale.toFixed(4)}) translateY(${kbTy.toFixed(2)}px)`,
        transformOrigin: 'center',
        opacity: imgOpacity,
      }} />

      {/* Camada 1.5: tint sólido por cima da imagem — usa scene.overlayColor
          quando setado (R26: padronização cross-scene), senão T.bgTint tema-driven. */}
      <AbsoluteFill style={{
        background: overlayColor
          ? `rgba(${_hexToRgb(overlayColor) || '26,27,26'},0.78)`
          : (T.bgTint || 'rgba(26,27,26,0.78)'),
        opacity: overlayP * (bgOverlayOpacity != null ? (bgOverlayOpacity / 0.55) : 1),
        pointerEvents: 'none',
      }} />

      {/* Camada 1.7: textura overlay do pool (opcional) */}
      <SceneTextureBackdrop
        src={bgTexture || T.bgTexture}
        durSec={durSec}
        opacity={bgTextureOpacity != null ? bgTextureOpacity : 0.08}
        invert={bgTextureInvert !== false}
      />

      {/* Camada 2: vinheta sutil pra concentrar atenção no mockup central */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
        opacity: overlayP,
        pointerEvents: 'none',
      }} />
      </> : null}

      {/* Camada 4: iPhone mockup centralizado */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}>
        <div style={{
          width: 760,
          height: 1500,
          background: '#0B141A',
          borderRadius: 64,
          padding: 14,
          boxShadow: T.flat ? '0 0 0 1px rgba(15,23,42,0.10)' : '0 50px 96px rgba(0,0,0,0.65), 0 0 0 2px rgba(255,255,255,0.04)',
          opacity: phoneIn,
          transform: `scale(${phoneScale.toFixed(4)}) translateY(${phoneOffsetY.toFixed(2)}px)`,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Tela interna do iPhone */}
          <div style={{
            flex: 1,
            background: WALLPAPER_BG,
            borderRadius: 52,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}>
            {/* iOS status bar — dynamic island + horário + ícones */}
            <IOSStatusBar />
            {/* WhatsApp header com avatar Cropware AI */}
            <WhatsAppHeader />
            {/* Bolhas de conversa */}
            <div style={{
              flex: 1,
              padding: '22px 20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              overflow: 'hidden',
            }}>
              {msgs.map((msg, i) => {
                const msgDelay = 1.05 + i * 0.55;
                return (
                  <ChatBubble
                    key={i}
                    from={msg.from || 'user'}
                    text={msg.text || ''}
                    delay={msgDelay}
                    frame={frame}
                    fps={fps}
                  />
                );
              })}
            </div>
            {/* Input bar maior */}
            <WhatsAppInputBar />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────── IOSStatusBar ───────────────
// Status bar estilo iPhone (top): dynamic island centralizado, horário à
// esquerda, ícones (signal + wifi + bateria) à direita.
const IOSStatusBar = () => (
  <div style={{
    height: STATUS_BAR_HEIGHT,
    background: '#075E54',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 36px',
    color: MR_COLORS.white,
    fontFamily: MR_FONTS.display,
    fontWeight: 600,
    fontSize: 32,
    letterSpacing: '-0.01em',
    position: 'relative',
    flexShrink: 0,
  }}>
    {/* Horário à esquerda */}
    <span style={{ minWidth: 80 }}>9:41</span>

    {/* Dynamic island — pill preto centralizado */}
    <div style={{
      position: 'absolute',
      top: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 168,
      height: 50,
      borderRadius: 36,
      background: '#000000',
    }} />

    {/* Ícones direita: signal + wifi + bateria */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Signal (4 barras) */}
      <svg width="32" height="20" viewBox="0 0 22 14" fill="currentColor" aria-hidden>
        <rect x="0"  y="9" width="4" height="5"  rx="0.8" />
        <rect x="6"  y="6" width="4" height="8"  rx="0.8" />
        <rect x="12" y="3" width="4" height="11" rx="0.8" />
        <rect x="18" y="0" width="4" height="14" rx="0.8" />
      </svg>
      {/* WiFi */}
      <svg width="30" height="20" viewBox="0 0 20 14" fill="currentColor" aria-hidden>
        <path d="M10 2.5c2.8 0 5.4 1 7.4 2.7l-1.7 1.9C14.2 5.8 12.2 5 10 5s-4.2.8-5.7 2.1L2.6 5.2C4.6 3.5 7.2 2.5 10 2.5zm0 4c1.7 0 3.3.6 4.5 1.6l-1.7 1.9c-.8-.6-1.7-1-2.8-1s-2 .4-2.8 1L5.5 8.1c1.2-1 2.8-1.6 4.5-1.6zm0 4c.8 0 1.5.3 2 .8L10 13.5l-2-2.2c.5-.5 1.2-.8 2-.8z" />
      </svg>
      {/* Bateria */}
      <div style={{
        width: 52,
        height: 24,
        border: '2px solid currentColor',
        borderRadius: 6,
        position: 'relative',
        padding: 2,
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '80%',
          height: '100%',
          background: 'currentColor',
          borderRadius: 2,
        }} />
        {/* Ponta da bateria */}
        <div style={{
          position: 'absolute',
          right: -5,
          top: '28%',
          width: 3.5,
          height: '44%',
          background: 'currentColor',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>
    </div>
  </div>
);

// ─────────────── WhatsAppHeader ───────────────
const WhatsAppHeader = () => (
  <div style={{
    height: WHATSAPP_HEADER_HEIGHT,
    background: '#075E54',
    color: MR_COLORS.white,
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: 20,
    flexShrink: 0,
  }}>
    {/* Avatar: circle verde com icon-cropware.svg em branco (CSS mask) */}
    <div style={{
      width: 88, height: 88, borderRadius: '50%',
      background: MR_COLORS.greenAccent,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        width: 56, height: 56,
        WebkitMaskImage: `url('${staticFile('icon-cropware.svg')}')`,
        maskImage: `url('${staticFile('icon-cropware.svg')}')`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        background: MR_COLORS.white,
      }} />
    </div>
    {/* Nome + status */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <div style={{
        fontFamily: MR_FONTS.display,
        fontSize: 34,
        fontWeight: 600,
        lineHeight: 1.1,
        letterSpacing: '-0.01em',
      }}>Cropware AI</div>
      <div style={{
        fontFamily: MR_FONTS.grotesk,
        fontSize: 24,
        fontWeight: 400,
        opacity: 0.82,
        lineHeight: 1.1,
      }}>online</div>
    </div>
  </div>
);

// ─────────────── ChatBubble ───────────────
const ChatBubble = ({ from, text, delay, frame, fps }) => {
  const isUser = from === 'user';
  const enterP = interpolate(
    frame,
    [delay * fps, (delay + 0.4) * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.outQuart }
  );
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      opacity: enterP,
      transform: `translateY(${((1 - enterP) * 14).toFixed(2)}px)`,
    }}>
      <div style={{
        maxWidth: '74%',
        background: isUser ? USER_BUBBLE : AI_BUBBLE,
        color: '#1A1B1A',
        padding: '12px 16px',
        borderRadius: 14,
        borderTopRightRadius: isUser ? 4 : 14,
        borderTopLeftRadius: isUser ? 14 : 4,
        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
        fontFamily: MR_FONTS.grotesk,
        fontSize: 30,
        fontWeight: 400,
        lineHeight: 1.32,
        letterSpacing: '-0.005em',
        whiteSpace: 'pre-wrap',
        wordBreak: 'normal',
        overflowWrap: 'break-word',
      }}>{text}</div>
    </div>
  );
};

// ─────────────── WhatsAppInputBar ───────────────
// Barra de input grande estilo WhatsApp real iOS.
const WhatsAppInputBar = () => (
  <div style={{
    minHeight: 168,
    background: '#F0F0F0',
    display: 'flex',
    alignItems: 'center',
    padding: '22px 20px',
    gap: 16,
    flexShrink: 0,
  }}>
    {/* Botão "+" anexar à esquerda */}
    <div style={{
      width: 56,
      height: 56,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#54656F',
      flexShrink: 0,
    }}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </div>
    {/* Campo de mensagem alongado */}
    <div style={{
      flex: 1,
      minHeight: 98,
      background: MR_COLORS.white,
      borderRadius: 48,
      display: 'flex',
      alignItems: 'center',
      padding: '0 32px',
      fontFamily: MR_FONTS.grotesk,
      fontSize: 30,
      color: '#7A8085',
    }}>Mensagem</div>
    {/* Ícone de câmera */}
    <div style={{
      width: 56,
      height: 56,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#54656F',
      flexShrink: 0,
    }}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M9 4h6l2 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l2-3zm3 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-2a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
      </svg>
    </div>
    {/* Botão verde de microfone/enviar */}
    <div style={{
      width: 72,
      height: 72,
      borderRadius: '50%',
      background: WHATSAPP_GREEN,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '0 3px 10px rgba(37,211,102,0.45)',
    }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="white" aria-hidden>
        <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/>
      </svg>
    </div>
  </div>
);
