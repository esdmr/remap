import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		src: {
			'b.ts': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				rootDir: 'src',
			},
		}),
	},
	path: '.',
	files: {
		'src/b.ts': ['src/b.js'],
	},
});
