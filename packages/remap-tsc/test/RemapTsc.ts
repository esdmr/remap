import { test } from 'tap';
import { RemapTsc } from './utils/source.js';
import { runTestCase, tsconfig } from './utils/harness.js';
import testReadonlyPathMap from './utils/ReadonlyPathMap.js';

await test('RemapTsc', async (t) => {
	await runTestCase(import.meta.url, {
		t,
		name: 'sourceFiles',
		spec: {
			'a.ts': '',
			'b.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					sourceMap: true,
					declaration: true,
					declarationMap: true,
				},
			}),
		},
		async checkResolution (t, options) {
			await testReadonlyPathMap(t, options.data.sourceFiles);

			const source = options.data.sourceFiles.get(options.getPath('a.ts'));

			if (!source) {
				throw new TypeError('Expected to find a.ts');
			}

			t.equal(
				options.fixUpActual(source.path),
				options.fixUpExpected('a.ts'),
				'path',
			);

			t.equal(source[Symbol.toStringTag], 'SourceFile', '@@toStringTag');

			t.strictSame(
				source.javaScriptFiles,
				new Set([options.data.outputFiles.get(options.getPath('a.js'))]),
				'javaScriptFiles',
			);

			t.strictSame(
				source.declarationFiles,
				new Set([options.data.outputFiles.get(options.getPath('a.d.ts'))]),
				'declarationFiles',
			);

			t.strictSame(
				source.sourceMapFiles,
				new Set([
					options.data.outputFiles.get(options.getPath('a.js.map')),
					options.data.outputFiles.get(options.getPath('a.d.ts.map')),
				]),
				'sourceMapFiles',
			);

			t.strictSame(
				source.outputFiles,
				new Set([
					options.data.outputFiles.get(options.getPath('a.js')),
					options.data.outputFiles.get(options.getPath('a.d.ts')),
					options.data.outputFiles.get(options.getPath('a.js.map')),
					options.data.outputFiles.get(options.getPath('a.d.ts.map')),
				]),
				'outputFiles',
			);
		},
		tscCompatible: false,
		files: {},
	});

	await runTestCase(import.meta.url, {
		t,
		name: 'outputFiles',
		spec: {
			'a.ts': '',
			'b.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					sourceMap: true,
					declaration: true,
					declarationMap: true,
				},
			}),
		},
		async checkResolution (t, options) {
			await testReadonlyPathMap(t, options.data.outputFiles);

			const output = options.data.outputFiles.get(options.getPath('a.js'));

			if (!output) {
				throw new TypeError('Expected to find a.js');
			}

			t.equal(
				options.fixUpActual(output.path),
				options.fixUpExpected('a.js'),
				'path',
			);

			t.equal(output[Symbol.toStringTag], 'OutputFile', '@@toStringTag');
			t.equal(output.sourceFile, options.data.sourceFiles.get(options.getPath('a.ts')), 'sourceFile');
			t.equal(output.type, 'js', 'type of js');
			t.equal(options.data.outputFiles.get(options.getPath('a.d.ts'))?.type, 'dts', 'type of d.ts');
			t.equal(options.data.outputFiles.get(options.getPath('a.js.map'))?.type, 'map', 'type of js.map');
			t.equal(options.data.outputFiles.get(options.getPath('a.d.ts.map'))?.type, 'map', 'type of d.ts.map');
		},
		tscCompatible: false,
		files: {},
	});

	t.equal(new RemapTsc()[Symbol.toStringTag], 'RemapTsc', '@@toStringTag');

	await runTestCase(import.meta.url, {
		t,
		name: 'clear',
		spec: {
			'a.ts': '',
			'b.ts': '',
			'tsconfig.json': tsconfig({}),
		},
		checkResolution (t, { data }) {
			data.clear();

			t.equal(data.sourceFiles.size, 0, 'sourceFiles is empty');
			t.equal(data.outputFiles.size, 0, 'outputFiles is empty');
		},
		tscCompatible: false,
		files: {},
	});

	await t.test('loadConfig', async (t) => {
		await runTestCase(import.meta.url, {
			t,
			name: 'out',
			spec: {
				'a.ts': '',
				'b.ts': '',
				'tsconfig.json': tsconfig({
					compilerOptions: {
						// Out is a deprecated alias for outFile.
						['out' as 'outFile']: 'build.js',
					},
				}),
			},
			tscCompatible: false,
		});

		await runTestCase(import.meta.url, {
			t,
			name: 'outFile',
			spec: {
				'a.ts': '',
				'b.ts': '',
				'tsconfig.json': tsconfig({
					compilerOptions: {
						// We cannot map output to source with outFiles.
						outFile: 'build.js',
					},
				}),
			},
			tscCompatible: false,
		});
	});
});
