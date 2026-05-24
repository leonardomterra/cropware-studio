// Entry point bundled pelo Vite. Importa React+Remotion Player e expõe
// duas funções globais que o index.html (vanilla JS) chama quando o modo
// motion-reel é ativado.
//
// R12: agora suporta 2 modos de visualização:
//   - 'player' (default): <Player> com playback
//   - 'grid':   12 <Thumbnail> em grid 4×3, com handler de click pra edição
//
// O vanilla JS controla o modo via window.setMotionReelView(mode).
import { createRoot } from 'react-dom/client';
import { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { Player } from '@remotion/player';

import { MotionReel } from './MotionReel.jsx';
import { MOTION_REEL_DEFAULT, computeReelDurationInFrames } from './default-storyboard.js';
import { loadMotionReelFonts } from './fonts.js';

loadMotionReelFonts();

let _root = null;
let _container = null;
let _state = {
  storyboard: MOTION_REEL_DEFAULT,
  view: 'grid', // 'player' | 'grid' — default = grid (sincronizado com _motionReelView no index.html)
};

// Render dispatcher — chamado em todas as mudanças de state.
function renderRoot() {
  if (!_root) return;
  const sb = _state.storyboard || MOTION_REEL_DEFAULT;
  if (_state.view === 'grid') {
    _root.render(<ReelGridView storyboard={sb} />);
  } else {
    _root.render(<ReelPlayerView storyboard={sb} />);
  }
}

// ── Player view (default) ───────────────────────────────────────────
// Ref global do Player ativo — usado pra expor seekTo/play via window pra
// que o vanilla JS reinicie o reel quando, por ex., a trilha de música muda.
let _playerRef = null;

function ReelPlayerView({ storyboard }) {
  const fps = storyboard.fps || 30;
  const durationInFrames = computeReelDurationInFrames(storyboard);
  const ref = useRef(null);
  useEffect(() => {
    _playerRef = ref.current;
    return () => { if (_playerRef === ref.current) _playerRef = null; };
  }, []);
  return (
    <Player
      ref={ref}
      component={MotionReel}
      inputProps={{ storyboard }}
      durationInFrames={durationInFrames}
      compositionWidth={storyboard.width || 1080}
      compositionHeight={storyboard.height || 1920}
      fps={fps}
      controls
      autoPlay
      loop
      clickToPlay
      doubleClickToFullscreen
      spaceKeyToPlayOrPause
      acknowledgeRemotionLicense
      numberOfSharedAudioTags={12}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

function restartMotionReelPlayback() {
  if (!_playerRef) return;
  try {
    _playerRef.seekTo(0);
    _playerRef.play();
  } catch (err) {
    console.warn('[MotionReel] restartPlayback falhou', err);
  }
}

// ── Grid view ───────────────────────────────────────────────────────
// 12 Thumbnails em grid 4×3, cada um renderizando UM frame estático
// (meio da cena) via Remotion. Click no thumb dispara o handler global
// window.onMotionReelSceneClick(sceneId) que o vanilla JS injeta.
function ReelGridView({ storyboard }) {
  const fps = storyboard.fps || 30;
  const durationInFrames = computeReelDurationInFrames(storyboard);
  const scenes = storyboard.scenes || [];
  // Layout: CSS grid 6×2 — cards ocupam a altura disponível do container,
  // ficam menores em telas mais curtas (zoom out automático).
  return (
    <div style={{
      width: '100%', height: '100%',
      overflow: 'hidden',
      padding: 12,
      boxSizing: 'border-box',
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gridTemplateRows: 'repeat(2, 1fr)',
      gap: 8,
      placeItems: 'center',
    }}>
      {scenes.map((scene, i) => {
        // Calcula frame absoluto do meio dessa cena na timeline final.
        // Soma sceneDur menos overlaps das transições anteriores.
        let cursor = 0;
        for (let j = 0; j <= i; j++) {
          const s = scenes[j];
          if (j > 0 && s.transitionIn) {
            const tDur = Math.max(2, Math.round((s.transitionIn.dur || 0.3) * fps));
            cursor -= tDur;
          }
          if (j < i) {
            cursor += Math.max(1, Math.round(((s.end || 0) - (s.start || 0)) * fps));
          }
        }
        const sceneDur = Math.max(1, Math.round(((scene.end || 0) - (scene.start || 0)) * fps));
        // Frame "seguro" pra thumbnail estática: ~40% da cena, mas com margem
        // das transições IN (entrada) e OUT (saída — i.e., transitionIn da próxima
        // cena, que overlapa o tail desta). Evita capturar a thumbnail num frame
        // em que uma transition presentation (ring-tunnel, light-streak etc) está
        // renderizando elementos de outra cena por cima.
        const transitionInFrames = scene.transitionIn
          ? Math.max(2, Math.round((scene.transitionIn.dur || 0.3) * fps))
          : 0;
        const nextScene = scenes[i + 1];
        const transitionOutFrames = (nextScene && nextScene.transitionIn)
          ? Math.max(2, Math.round((nextScene.transitionIn.dur || 0.3) * fps))
          : 0;
        const safeStart = transitionInFrames + 6;
        const safeEnd = Math.max(safeStart + 1, sceneDur - transitionOutFrames - 6);
        // 90% pra capturar a cena com TODAS as animações já assentadas (texto
        // revelado, ícones em posição, checks completados). Dá noção visual
        // do estado final da cena. Clamp em safeEnd evita entrar na transição out.
        const safeMid = Math.max(safeStart, Math.min(safeEnd, Math.round(sceneDur * 0.9)));
        const frameToShow = Math.min(durationInFrames - 1, Math.max(0, cursor + safeMid));
        const isLocked = scene.locked === true;
        const sceneNumber = String(i + 1).padStart(2, '0');
        return (
          <ReelThumbCard
            key={scene.id || `scene-${i}`}
            scene={scene}
            sceneNumber={sceneNumber}
            isLocked={isLocked}
            storyboard={storyboard}
            durationInFrames={durationInFrames}
            frameToShow={frameToShow}
          />
        );
      })}
    </div>
  );
}

function ReelThumbCard({ scene, sceneNumber, isLocked, storyboard, durationInFrames, frameToShow }) {
  const fps = storyboard.fps || 30;
  const sceneDurSec = Math.max(1, (scene.end || 0) - (scene.start || 0));
  const thumbDurationInFrames = Math.max(1, Math.round(sceneDurSec * fps));

  // O thumb tem aspect-ratio fixo 9:16 e encolhe pra caber na célula. A card-bar
  // embaixo precisa acompanhar a MESMA LARGURA do thumb (não da célula inteira).
  // Mede a largura renderizada via ResizeObserver e aplica na bar.
  const thumbRef = useRef(null);
  const [thumbWidth, setThumbWidth] = useState(null);
  useLayoutEffect(() => {
    const el = thumbRef.current;
    if (!el) return;
    const update = () => setThumbWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const thumbStoryboard = {
    ...storyboard,
    duration: sceneDurSec,
    audio: null,
    music: null,
    scenes: [{
      ...scene,
      start: 0,
      end: sceneDurSec,
      transitionIn: undefined,
      voiceover: undefined,
      sfx: undefined,
    }],
  };
  const handleEditClick = (e) => {
    e.stopPropagation();
    if (typeof window.onMotionReelSceneClick === 'function') {
      window.onMotionReelSceneClick(scene.id, { locked: isLocked });
    }
  };
  const handlePreviewClick = (e) => {
    e.stopPropagation();
    if (typeof window.onMotionReelScenePreview === 'function') {
      window.onMotionReelScenePreview(scene.id);
    }
  };
  // Click no card inteiro: editáveis abrem edit, fixos abrem preview.
  // Largura fixa via flex-basis (4 cols + 3 gaps de 12px).
  // O wrapper externo só estabelece width + position relative; a aspect 9:16
  // é forçada via padding-bottom no inner ratio-box (% relativo à largura
  // do PARENT). Tudo absoluto dentro = nunca extrapola altura.
  return (
    <div
      style={{
        // Card ocupa altura total da célula do grid 6×2 e centraliza o thumb.
        // O thumb mantém aspect-ratio 9:16 e encolhe pra caber tanto na largura
        // quanto na altura — auto zoom-out quando a janela é menor.
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        position: 'relative',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* Wrapper de espaço (flex:1 toma toda altura sobrando) — centraliza o thumb */}
      <div style={{
        flex: 1,
        width: '100%',
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* Thumb 9:16 EXATO — sem border CSS (que somaria 4px ao border-box
            e distorceria a proporção). Border vira overlay absolute. */}
        <div
          ref={thumbRef}
          style={{
            height: '100%',
            maxHeight: '100%',
            maxWidth: '100%',
            aspectRatio: '9 / 16',
            background: '#1A1B1A',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.20)',
            position: 'relative',
          }}
        >
          {false ? (
            // Locked scenes: usa PNG pré-renderizada via `npm run reel:thumbs`.
            // Renderiza limpo, sem o artifact do <Thumbnail> dinâmico.
            <Player
              component={MotionReel}
              inputProps={{ storyboard: thumbStoryboard }}
              compositionWidth={storyboard.width || 1080}
              compositionHeight={storyboard.height || 1920}
              durationInFrames={thumbDurationInFrames}
              fps={fps}
              controls={false}
              autoPlay
              loop
              muted
              clickToPlay={false}
              doubleClickToFullscreen={false}
              acknowledgeRemotionLicense
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <Player
              component={MotionReel}
              inputProps={{ storyboard: thumbStoryboard }}
              compositionWidth={storyboard.width || 1080}
              compositionHeight={storyboard.height || 1920}
              durationInFrames={thumbDurationInFrames}
              fps={fps}
              controls={false}
              autoPlay
              loop
              muted
              clickToPlay={false}
              doubleClickToFullscreen={false}
              acknowledgeRemotionLicense
              style={{ width: '100%', height: '100%' }}
            />
          )}
          {/* Border decorativa em overlay — não afeta sizing/proporção */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            border: '2px solid rgba(15,23,42,0.10)',
            pointerEvents: 'none',
          }} />

          {/* Barra semitransparente overlay no rodapé do thumb com número +
              lock + ações. Glass dark com backdrop blur. Ícones brancos. */}
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 4,
            padding: '6px 10px',
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(10px) saturate(140%)',
            WebkitBackdropFilter: 'blur(10px) saturate(140%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontFamily: 'var(--ds-font, "Roboto Flex"), system-ui, sans-serif',
            fontStretch: '90%',
            boxSizing: 'border-box',
          }}>
            {/* Número da cena — Pathway Extreme branco */}
            <span style={{
              flex: '0 0 auto',
              minWidth: 22,
              fontFamily: '"Pathway Extreme", var(--ds-font, "Roboto Flex"), system-ui, sans-serif',
              fontStretch: '90%',
              fontSize: 14,
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.95)',
              letterSpacing: '0.04em',
              textAlign: 'center',
            }}>{sceneNumber}</span>

            {/* Lock status (não-clicável). Verde = livre, vermelho = fixo. */}
            <span
              title={isLocked ? 'Cena fixa' : 'Cena livre'}
              style={{
                flex: '0 0 auto',
                width: 24, height: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
                color: isLocked ? '#f87171' : '#4ade80',
              }}
            >
              <i className={isLocked ? 'ph ph-lock-simple' : 'ph ph-lock-simple-open'} />
            </span>

            {/* Editar — desabilitado em end-card */}
            <button
              type="button"
              onClick={scene.type === 'end-card' ? undefined : handleEditClick}
              disabled={scene.type === 'end-card'}
              title={scene.type === 'end-card' ? 'End-card sempre usa o tema editorial — não editável' : (isLocked ? 'Editar tema visual' : 'Editar cena')}
              aria-label={scene.type === 'end-card' ? 'End-card não editável' : (isLocked ? 'Editar tema visual' : 'Editar cena')}
              style={{
                flex: '0 0 auto',
                width: 24, height: 24,
                background: 'transparent',
                border: 'none',
                padding: 0,
                borderRadius: 4,
                cursor: scene.type === 'end-card' ? 'not-allowed' : 'pointer',
                color: scene.type === 'end-card' ? 'rgba(255, 255, 255, 0.30)' : 'rgba(255, 255, 255, 0.85)',
                opacity: scene.type === 'end-card' ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
                transition: 'color 120ms ease, background 120ms ease',
              }}
              onMouseEnter={scene.type === 'end-card' ? undefined : (e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
              onMouseLeave={scene.type === 'end-card' ? undefined : (e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <i className="ph ph-pencil-simple" />
            </button>

            {/* Preview */}
            <button
              type="button"
              onClick={handlePreviewClick}
              title="Preview desta cena"
              aria-label="Preview desta cena"
              style={{
                flex: '0 0 auto',
                width: 24, height: 24,
                background: 'transparent',
                border: 'none',
                padding: 0,
                borderRadius: 4,
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
                transition: 'color 120ms ease, background 120ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <i className="ph ph-play" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mount/Unmount API ───────────────────────────────────────────────
function mount(targetEl, storyboard) {
  if (!targetEl) return;
  if (_container !== targetEl) {
    if (_root) { _root.unmount(); _root = null; }
    _container = targetEl;
    _root = createRoot(targetEl);
  }
  _state.storyboard = storyboard || MOTION_REEL_DEFAULT;
  renderRoot();
}

function unmount() {
  if (_root) {
    _root.unmount();
    _root = null;
    _container = null;
  }
}

// Permite alternar entre 'player' e 'grid' sem desmontar tudo.
function setView(view) {
  if (view !== 'player' && view !== 'grid') return;
  _state.view = view;
  renderRoot();
}

// Atualiza apenas o storyboard (mantém view atual).
function updateStoryboard(storyboard) {
  _state.storyboard = storyboard || _state.storyboard;
  renderRoot();
}

// Player isolado pra modal de preview de cena única (R12). Independente do
// player principal — usa seu próprio React root pra não interferir no grid.
let _previewRoot = null;
let _previewContainer = null;
function mountPreviewPlayer(targetEl, storyboard) {
  if (!targetEl || !storyboard) return;
  if (_previewContainer !== targetEl) {
    if (_previewRoot) { _previewRoot.unmount(); _previewRoot = null; }
    _previewContainer = targetEl;
    _previewRoot = createRoot(targetEl);
  }
  const fps = storyboard.fps || 30;
  const durationInFrames = computeReelDurationInFrames(storyboard);
  _previewRoot.render(
    <Player
      component={MotionReel}
      inputProps={{ storyboard }}
      durationInFrames={durationInFrames}
      compositionWidth={storyboard.width || 1080}
      compositionHeight={storyboard.height || 1920}
      fps={fps}
      controls
      autoPlay
      loop
      clickToPlay
      spaceKeyToPlayOrPause
      acknowledgeRemotionLicense
      numberOfSharedAudioTags={12}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
function unmountPreviewPlayer() {
  if (_previewRoot) {
    _previewRoot.unmount();
    _previewRoot = null;
    _previewContainer = null;
  }
}

if (typeof window !== 'undefined') {
  window.mountMotionReelPlayer = mount;
  window.unmountMotionReelPlayer = unmount;
  window.setMotionReelView = setView;
  window.updateMotionReelStoryboard = updateStoryboard;
  window.mountMotionReelPreviewPlayer = mountPreviewPlayer;
  window.unmountMotionReelPreviewPlayer = unmountPreviewPlayer;
  window.restartMotionReelPlayback = restartMotionReelPlayback;
  window.MOTION_REEL_DEFAULT_STORYBOARD = MOTION_REEL_DEFAULT;
}
