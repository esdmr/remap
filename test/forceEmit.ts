import { test } from 'tap';
import { RemapTsc } from './utils/source.js';
import { runTestCase, tsconfig } from './utils/harness.js';

await test('forceEmit', async (t) => {
	const options = {
		t,
		getRemapTsc () {
			return new RemapTsc({
				forceEmit: true,
			});
		},
		tscCompatible: false,
	};

	await runTestCase(import.meta.url, {
		...options,
		name: 'noEmit',
		spec: {
			'a.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					noEmit: true,
				},
			}),
		},
		files: {
			'a.ts': ['a.js'],
		},
	});

	await runTestCase(import.meta.url, {
		...options,
		name: 'noEmit-outOfRoot',
		spec: {
			'a.ts': '',
			src: {
				'b.ts': '',
			},
			'tsconfig.json': tsconfig({
				compilerOptions: {
					noEmit: true,
					rootDir: 'src',
				},
			}),
		},
	});

	await runTestCase(import.meta.url, {
		...options,
		name: 'allowJs',
		spec: {
			src: {
				'a.js': '',
			},
			'tsconfig.json': tsconfig({
				compilerOptions: {
					allowJs: true,
					outDir: 'build',
					rootDir: 'src',
					declaration: true,
					emitDeclarationOnly: true,
				},
			}),
		},
		files: {
			'src/a.js': ['build/a.js', 'build/a.d.ts'],
		},
	});

	await runTestCase(import.meta.url, {
		...options,
		name: 'composite-emitDeclarationOnly',
		spec: {
			'a.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					composite: true,
					emitDeclarationOnly: true,
				},
			}),
		},
		files: {
			'a.ts': ['a.js', 'a.d.ts'],
		},
	});

	await runTestCase(import.meta.url, {
		...options,
		name: 'declaration-emitDeclarationOnly-and-friends',
		spec: {
			'b.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					declaration: true,
					declarationDir: 'types',
					declarationMap: true,
					emitDeclarationOnly: true,
					outDir: 'build',
					sourceMap: true,
				},
			}),
		},
		files: {
			'b.ts': [
				'build/b.js',
				'build/b.js.map',
				'types/b.d.ts',
				'types/b.d.ts.map',
			],
		},
	});

	await runTestCase(import.meta.url, {
		...options,
		name: 'declaration-emitDeclarationOnly',
		spec: {
			'a.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					declaration: true,
					emitDeclarationOnly: true,
				},
			}),
		},
		files: {
			'a.ts': ['a.js', 'a.d.ts'],
		},
	});

	await runTestCase(import.meta.url, {
		...options,
		name: 'emitDeclarationOnly',
		spec: {
			'a.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					// EmitDeclarationOnly requires either declaration or composite
					// to be enabled.
					emitDeclarationOnly: true,
				},
			}),
		},
	});
});
