import {build} from 'esbuild';
await build({entryPoints:['server/index.ts'],outfile:'backend/index.ts',bundle:true,format:'esm',platform:'browser',target:'es2022',external:['node:*']});
