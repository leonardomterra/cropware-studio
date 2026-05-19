// Componente raiz do vídeo. Recebe um storyboard via inputProps e monta
// a sequência via @remotion/transitions/TransitionSeries. Usado tanto
// pelo <Player> (preview no browser) quanto pelo CLI render (npx remotion).
import { AbsoluteFill, Audio, Sequence, staticFile, interpolate } from 'remotion';
import { TransitionSeries } from '@remotion/transitions';
import { LightLeak } from '@remotion/light-leaks';

import { resolvePresentation, resolveTiming } from './transitions.js';
import { resolveSfxUrl } from './sfx.js';
import { Overlay } from './overlays.jsx';
import { BrandIntro } from './scenes/BrandIntro.jsx';
import { Keyword } from './scenes/Keyword.jsx';
import { Headline } from './scenes/Headline.jsx';
import { Scenario } from './scenes/Scenario.jsx';
import { WhatsAppChat } from './scenes/WhatsAppChat.jsx';
import { Quote } from './scenes/Quote.jsx';
import { FeatureList } from './scenes/FeatureList.jsx';
import { EndCard } from './scenes/EndCard.jsx';
import { Cta } from './scenes/Cta.jsx';
import { Chapter } from './scenes/Chapter.jsx';
import { LowerThird } from './scenes/LowerThird.jsx';
import { AppCard } from './scenes/AppCard.jsx';

const SCENE_COMPONENTS = {
  'brand-intro':  BrandIntro,
  'keyword':      Keyword,
  'headline':     Headline,
  'scenario':     Scenario,
  'whatsapp-chat':WhatsAppChat,
  'quote':        Quote,
  'feature-list': FeatureList,
  'end-card':     EndCard,
  'cta':          Cta,
  'chapter':      Chapter,
  'lower-third':  LowerThird,
  'app-card':     AppCard,
};

// Resolve URL de mídia: absoluta (http://, data:, /algo) passa direto;
// nome relativo passa por staticFile() pro Remotion encontrar no public/.
function resolveMediaUrl(src) {
  if (!src) return null;
  const v = String(src).trim();
  if (/^(https?:|data:|\/)/.test(v)) return v;
  return staticFile(v);
}

export const MotionReel = ({ storyboard }) => {
  if (!storyboard || !Array.isArray(storyboard.scenes) || !storyboard.scenes.length) {
    return <AbsoluteFill style={{ background: '#F5F1EA' }} />;
  }
  const fps = storyboard.fps || 30;
  const children = [];
  const audioLayers = []; // SFX + voiceover, posicionados absolutos via <Sequence from>.

  // Tracker de frame absoluto na timeline final (considerando overlap das transições).
  let cursorFrame = 0;
  let totalFrames = 0;
  // Ranges [startFrame, endFrame] em que voz toca — usado pra ducking da música.
  const voiceoverRanges = [];

  storyboard.scenes.forEach((scene, i) => {
    const Comp = SCENE_COMPONENTS[scene.type];
    if (!Comp) return;
    const sceneDurFrames = Math.max(1, Math.round(((scene.end || 0) - (scene.start || 0)) * fps));

    // Transição com a cena anterior (i > 0). Pull-in: subtrai dur do cursor
    // antes do scene Sequence (próximo Sequence começa tDur frames antes
    // do anterior terminar).
    if (i > 0 && scene.transitionIn) {
      const tIn = scene.transitionIn;
      const tDurFrames = Math.max(2, Math.round((tIn.dur || 0.3) * fps));
      cursorFrame -= tDurFrames; // overlap

      // SFX disparado no meio da transição por default (alinha com pico
      // visual de cinematic-blur, ring-tunnel, light-streak — todos em
      // progress=0.5). Override por SFX via tIn.sfxOffset em segundos:
      // negativo antecipa (bom pra ambient longos), positivo atrasa.
      if (tIn.sfx) {
        const sfxUrl = resolveSfxUrl(tIn.sfx);
        if (sfxUrl) {
          const defaultOffsetFrames = Math.round(tDurFrames * 0.5);
          const customOffsetFrames = tIn.sfxOffset != null
            ? Math.round(tIn.sfxOffset * fps)
            : defaultOffsetFrames;
          const sfxStartFrame = Math.max(0, cursorFrame + customOffsetFrames);
          audioLayers.push(
            <Sequence key={`sfx-${i}`} from={sfxStartFrame} layout="none">
              <Audio src={sfxUrl} volume={tIn.sfxVolume == null ? 0.7 : tIn.sfxVolume} />
            </Sequence>
          );
        } else {
          console.warn(`[motion-reel] SFX desconhecido: "${tIn.sfx}" — verifique sfx.js`);
        }
      }

      if (tIn.type === 'light-leak') {
        children.push(
          <TransitionSeries.Overlay key={`overlay-${i}`} durationInFrames={tDurFrames}>
            <LightLeak seed={tIn.seed == null ? i : tIn.seed} hueShift={tIn.hueShift == null ? 0 : tIn.hueShift} />
          </TransitionSeries.Overlay>
        );
      } else {
        children.push(
          <TransitionSeries.Transition
            key={`trans-${i}`}
            presentation={resolvePresentation(tIn.type, tIn)}
            timing={resolveTiming(scene, fps)}
          />
        );
      }
    }

    const sceneStartFrame = cursorFrame;
    const durSec = (scene.end || 0) - (scene.start || 0);

    // Voiceover por cena — se cena tem voiceover.url, monta <Audio> no início
    // absoluto da cena. text é só pra geração (ignorado em render).
    if (scene.voiceover && (scene.voiceover.url || scene.voiceover.src)) {
      const voUrl = resolveMediaUrl(scene.voiceover.url || scene.voiceover.src);
      if (voUrl) {
        audioLayers.push(
          <Sequence key={`vo-${i}`} from={Math.max(0, sceneStartFrame)} layout="none">
            <Audio src={voUrl} volume={scene.voiceover.volume == null ? 1.0 : scene.voiceover.volume} />
          </Sequence>
        );
        // Registra o range pra ducking. durationSec vem do voiceover-core
        // depois da geração; se ausente (preview pré-geração), usa scene dur.
        const voDurSec = scene.voiceover.durationSec || durSec;
        const voEndFrame = sceneStartFrame + Math.round(voDurSec * fps);
        voiceoverRanges.push([sceneStartFrame, voEndFrame]);
      }
    }

    // Locked scenes são 100% hardcoded nos componentes — ignoram overlays do
    // storyboard (mesmo que reels antigos em cache tenham herdado overlays
    // antes do refactor). Customização visual só nas custom scenes.
    const sceneOverlays = scene.locked === true ? null : scene.overlays;
    children.push(
      <TransitionSeries.Sequence key={scene.id || `scene-${i}`} durationInFrames={sceneDurFrames}>
        <AbsoluteFill>
          <Comp {...scene} />
          {Array.isArray(sceneOverlays) && sceneOverlays.map((ov, oIdx) => (
            <Overlay key={`ov-${oIdx}`} overlay={ov} durSec={durSec} />
          ))}
        </AbsoluteFill>
      </TransitionSeries.Sequence>
    );

    cursorFrame += sceneDurFrames;
    totalFrames = cursorFrame;
  });

  // Música de fundo: global, com fade in/out + ducking sob voz.
  const music = storyboard.audio && (storyboard.audio.music || storyboard.audio.src);
  const musicCfg = (storyboard.audio || {});
  const fadeInF  = Math.max(0, (musicCfg.fadeIn  == null ? 1.0 : musicCfg.fadeIn)  * fps);
  const fadeOutF = Math.max(0, (musicCfg.fadeOut == null ? 2.0 : musicCfg.fadeOut) * fps);
  const baseVol  = musicCfg.volume == null ? 0.4 : musicCfg.volume;
  // Ducking: durante voz, multiplica baseVol por este fator (0-1). 0.35 = -65%.
  const duckLevel = musicCfg.duck == null ? 0.35 : musicCfg.duck;
  // Ramp suave entre full e duck (anti-pop). Default 150ms.
  const duckRampF = Math.max(1, Math.round(((musicCfg.duckRamp == null ? 0.15 : musicCfg.duckRamp)) * fps));
  const musicUrl = music ? resolveMediaUrl(music) : null;

  return (
    <AbsoluteFill>
      <TransitionSeries>{children}</TransitionSeries>
      {/* Música de fundo — abaixo do TransitionSeries na árvore mas afeta o áudio mix global */}
      {musicUrl ? (
        <Audio
          src={musicUrl}
          volume={(f) => {
            // Fade in: 0 → baseVol em [0, fadeInF]
            // Fade out: baseVol → 0 em [totalFrames - fadeOutF, totalFrames]
            const fadeIn = fadeInF > 0
              ? interpolate(f, [0, fadeInF], [0, baseVol], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
              : baseVol;
            const fadeOut = fadeOutF > 0
              ? interpolate(f, [totalFrames - fadeOutF, totalFrames], [baseVol, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
              : baseVol;
            // Ducking: pra cada range de voz, ramp 1 → duckLevel → 1 em torno do range.
            // Pega o menor (mais "duckado") entre todos os ranges sobrepostos.
            let duck = 1;
            for (let r = 0; r < voiceoverRanges.length; r++) {
              const vs = voiceoverRanges[r][0];
              const ve = voiceoverRanges[r][1];
              if (ve <= vs) continue;
              if (f < vs - duckRampF || f > ve + duckRampF) continue;
              const local = interpolate(
                f,
                [vs - duckRampF, vs, ve, ve + duckRampF],
                [1, duckLevel, duckLevel, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              if (local < duck) duck = local;
            }
            return Math.min(fadeIn, fadeOut) * duck;
          }}
          loop={musicCfg.loop !== false}
        />
      ) : null}
      {audioLayers}
    </AbsoluteFill>
  );
};
