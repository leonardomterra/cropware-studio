// Config global do Remotion CLI. Aceita .mjs porque o repo é "type":
// "commonjs", então ESM precisa do .mjs explícito.
import { Config } from '@remotion/cli/config';

// JPEG é mais rápido pra render que PNG e MP4 H.264 não preserva alpha
// mesmo, então não há perda visual.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(90);
// Sai por padrão em H.264/MP4 a 30fps — bate com a composition.
Config.setCodec('h264');
// Pasta de arquivos estáticos servidos via staticFile() — copia os assets
// do root pra cá quando rodar o render (logo, fontes embutidas, etc).
Config.setPublicDir('./public');
// Habilita WebGL no Chrome headless usando SwiftShader (software-rendered)
// — necessário pra @remotion/light-leaks (efeito WebGL). 'angle' não
// funciona em headless shell; 'swangle' (SwiftShader+ANGLE) sim, sem
// depender de GPU física.
Config.setChromiumOpenGlRenderer('swangle');
