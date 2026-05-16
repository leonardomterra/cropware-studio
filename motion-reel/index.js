// Entry point do Remotion CLI. NÃO é usado pelo Vite/Player — esse fluxo
// passa pelo mount.jsx.
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root.jsx';

registerRoot(RemotionRoot);
