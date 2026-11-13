// Vercel Function entry. The API is bundled by `tsup` (contracts included) before deployment,
// so this file only re-exports the compiled serverless handler.
export { default } from '../dist/serverless-handler.js';
