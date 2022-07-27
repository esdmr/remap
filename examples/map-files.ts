import { RemapTsc } from '@esdmr/remap-tsc';

const data = new RemapTsc();

// Assume the directory structure:
//
//     Working directory
//     ├╴ tsconfig.json
//     ├╴ src
//     │  └╴ index.ts
//     └╴ build
//        └╴ index.js

data.loadConfig('src');

// Map source to output.
console.log(data.sourceFiles.get('src/index.ts'));

// Map output to source.
console.log(data.outputFiles.get('build/index.js'));
