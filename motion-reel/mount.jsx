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
import { Player, Thumbnail } from '@remotion/player';
import { staticFile } from 'remotion';

import { MotionReel } from './MotionReel.jsx';
import { MOTION_REEL_DEFAULT, computeReelDurationInFrames } from './default-storyboard.js';
import { loadMotionReelFonts } from './fonts.js';

// Mapping de scene.id → arquivo de thumb pré-renderizado em public/thumbs/.
// Locked scenes são idênticas em todo reel (hardcoded nos componentes), então
// reutilizamos as mesmas PNGs pra default e gerados. Gerados com `npm run reel:thumbs`.
// Vantagem: usa a mesma pipeline do render final, sem o artifact "bolinha fantasma"
// que o <Thumbnail> dinâmico do @remotion/player produz em algumas cenas complexas.
const LOCKED_THUMB_FILES = {
  'intro':           'thumbs/01-intro.png',
  'chapter-1':       'thumbs/04-chapter-1.png',
  'chapter-2':       'thumbs/07-chapter-2.png',
  'quote':           'thumbs/10-quote.png',
  'lower-third-cta': 'thumbs/11-lower-third.png',
  'end':             'thumbs/12-end-card.png',
};

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
  const handleCardClick = () => {
    if (isLocked) {
      if (typeof window.onMotionReelScenePreview === 'function') window.onMotionReelScenePreview(scene.id);
    } else {
      if (typeof window.onMotionReelSceneClick === 'function') window.onMotionReelSceneClick(scene.id, { locked: false });
    }
  };
  // Largura fixa via flex-basis (4 cols + 3 gaps de 12px).
  // O wrapper externo só estabelece width + position relative; a aspect 9:16
  // é forçada via padding-bottom no inner ratio-box (% relativo à largura
  // do PARENT). Tudo absoluto dentro = nunca extrapola altura.
  return (
    <div
      onClick={handleCardClick}
      style={{
        // 6 cols × 2 rows. Gap 12px × 5 = 60px.
        flex: '0 0 calc((100% - 60px) / 6)',
        maxWidth: 'calc((100% - 60px) / 6)',
        position: 'relative',
        cursor: 'pointer',
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
          {scene.locked && LOCKED_THUMB_FILES[scene.id] ? (
            // Locked scenes: usa PNG pré-renderizada via `npm run reel:thumbs`.
            // Renderiza limpo, sem o artifact do <Thumbnail> dinâmico.
            <img
              src={staticFile(LOCKED_THUMB_FILES[scene.id])}
              alt={scene.type}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                userSelect: 'none',
              }}
            />
          ) : (
            <Thumbnail
              component={MotionReel}
              inputProps={{ storyboard }}
              compositionWidth={storyboard.width || 1080}
              compositionHeight={storyboard.height || 1920}
              durationInFrames={durationInFrames}
              fps={storyboard.fps || 30}
              frameToDisplay={frameToShow}
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
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#80847F', fontFamily: '"Space Mono", ui-monospace, monospace', fontSize: 11 }}>{sceneNumber}</span>
          <span style={{ textTransform: 'lowercase', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scene.type}</span>
        </span>
        {/* Ações: preview (sempre) + edit (só editáveis) ou lock (só fixas) */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            onClick={handlePreviewClick}
            title="Preview desta cena"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              borderRadius: 6,
              cursor: 'pointer',
              color: '#5C605D',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 120ms ease, color 120ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = '#1A1B1A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5C605D'; }}
          >
            <i className="ph ph-play" style={{ fontSize: 16, display: 'block' }}></i>
          </button>
          {isLocked ? (
            <i className="ph ph-lock-simple" title="Cena fixa" style={{ fontSize: 16, color: '#80847F', display: 'block' }}></i>
          ) : (
            <button
              type="button"
              onClick={handleEditClick}
              title="Editar com IA"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 4,
                borderRadius: 6,
                cursor: 'pointer',
                color: '#42AA7B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 120ms ease, color 120ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(106,197,143,0.15)'; e.currentTarget.style.color = '#2A7B5A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#42AA7B'; }}
            >
              <i className="ph ph-pencil-simple" style={{ fontSize: 16, display: 'block' }}></i>
            </button>
          )}
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
