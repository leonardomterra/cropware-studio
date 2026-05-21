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
import { Player } from '@remotion/player';

import { MotionReel } from './MotionReel.jsx';
import { MOTION_REEL_DEFAULT, computeReelDurationInFrames } from './default-storyboard.js';
import { loadMotionReelFonts } from './fonts.js';

loadMotionReelFonts();

let _root = null;
let _container = null;
let _state = {
  storyboard: MOTION_REEL_DEFAULT,
  view: 'player', // 'player' | 'grid'
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
function ReelPlayerView({ storyboard }) {
  const fps = storyboard.fps || 30;
  const durationInFrames = computeReelDurationInFrames(storyboard);
  return (
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
      doubleClickToFullscreen
      spaceKeyToPlayOrPause
      acknowledgeRemotionLicense
      numberOfSharedAudioTags={12}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ── Grid view ───────────────────────────────────────────────────────
// 12 Thumbnails em grid 4×3, cada um renderizando UM frame estático
// (meio da cena) via Remotion. Click no thumb dispara o handler global
// window.onMotionReelSceneClick(sceneId) que o vanilla JS injeta.
function ReelGridView({ storyboard }) {
  const fps = storyboard.fps || 30;
  const durationInFrames = computeReelDurationInFrames(storyboard);
  const scenes = storyboard.scenes || [];
  // Layout: flex wrap com largura calculada — 4 colunas, gap 12px.
  // (Grid CSS estava sobrepondo as rows porque o aspect-ratio não criava
  // altura intrínseca pra row.)
  return (
    <div style={{
      width: '100%', height: '100%',
      overflow: 'auto',
      padding: 16,
      boxSizing: 'border-box',
      display: 'flex',
      flexWrap: 'wrap',
      alignContent: 'flex-start',
      gap: 12,
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
        // 6 cols × 2 rows. Gap 12px × 5 = 60px.
        flex: '0 0 calc((100% - 60px) / 6)',
        maxWidth: 'calc((100% - 60px) / 6)',
        position: 'relative',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Ratio-box 9:16 com Thumbnail dentro (sem overlays — label fica abaixo) */}
      <div style={{ width: '100%', paddingBottom: '177.78%', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#1A1B1A',
            borderRadius: 12,
            overflow: 'hidden',
            border: isLocked ? '2px solid rgba(0,0,0,0.06)' : '2px solid rgba(106,197,143,0.55)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.20)',
            transition: 'transform 120ms ease, box-shadow 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.28)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.20)';
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
        </div>
      </div>

      {/* Label abaixo do thumb: número + type + ícone lock/edit. Inter Tight,
          ícones via Phosphor (CSS já carregado globalmente no index.html). */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
        padding: '0 2px',
        fontFamily: '"Inter Tight", system-ui, sans-serif',
        fontSize: 12,
        fontWeight: 500,
        color: isLocked ? '#5C605D' : '#1A1B1A',
        letterSpacing: '-0.01em',
      }}>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            minWidth: 30,
            height: 25,
            padding: '0 8px',
            borderRadius: 6,
            background: '#e5e7eb',
            color: '#475569',
            fontFamily: '"Inter Tight", system-ui, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            lineHeight: '25px',
            textAlign: 'center',
          }}>{sceneNumber}</span>
          <span
            title={isLocked ? 'Cena fixa' : 'Cena livre'}
            style={{
              minWidth: 47,
              height: 25,
              padding: '0 9px',
              borderRadius: 6,
              background: isLocked ? '#e5e7eb' : '#d1fae5',
              color: isLocked ? '#475569' : '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"Inter Tight", system-ui, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: 0,
              flex: '0 0 auto',
            }}
          >
            {isLocked ? 'Fixo' : 'Livre'}
          </span>
        </span>
        {/* Ações: preview (sempre) + edit (só editáveis) ou lock (só fixas) */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={handleEditClick}
            title={isLocked ? 'Editar tema visual' : 'Editar cena'}
            style={{
              background: '#111827',
              border: '1px solid #111827',
              minHeight: 25,
              padding: '0 9px',
              borderRadius: 6,
              cursor: 'pointer',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Inter Tight", system-ui, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: 0,
              transition: 'background 120ms ease, border-color 120ms ease, transform 120ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#334155';
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#111827';
              e.currentTarget.style.borderColor = '#111827';
              e.currentTarget.style.transform = '';
            }}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={handlePreviewClick}
            title="Preview desta cena"
            style={{
              width: 25,
              height: 25,
              background: '#111827',
              border: '1px solid #111827',
              padding: 0,
              borderRadius: 6,
              cursor: 'pointer',
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 120ms ease, border-color 120ms ease, transform 120ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#334155';
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#111827';
              e.currentTarget.style.borderColor = '#111827';
              e.currentTarget.style.transform = '';
            }}
          >
            <span style={{
              width: 0,
              height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: '8px solid #fff',
              display: 'block',
              marginLeft: 2,
            }} />
          </button>
        </span>
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
  window.MOTION_REEL_DEFAULT_STORYBOARD = MOTION_REEL_DEFAULT;
}
