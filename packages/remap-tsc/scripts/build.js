#!/usr/bin/env node
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';
import { build } from 'esbuild';
import { execa } from 'execa';
import isPnpm from '@esdmr/scripts/is-pnpm';

assert(isPnpm, 'This script must be run by pnpm');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
	console.log(`\
Usage: pnpm build [options]

Options:
--watch  Watch for changes
--dev    Disable identifier minification`);
	process.exit();
}

const shouldWatch = process.argv.includes('--watch');
const isDev = shouldWatch || process.argv.includes('--dev');

if (isDev) {
	console.info('This is a development build.');
}

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
	absWorkingDir: resolvePath('..'),
	platform: 'node',
	watch: shouldWatch,
	bundle: true,
	minify: !isDev,
	keepNames: true,
	minifySyntax: isDev,
	minifyWhitespace: isDev,
	sourcemap: true,
	sourcesContent: false,
	external: ['node:path', 'typescript'],
	target: 'node14',
};

const esmResult = await build({
	...buildOptions,
	entryPoints: ['src/index.ts'],
	outfile: 'build/index.js',
	format: 'esm',
});

const cjsResult = await build({
	...buildOptions,
	entryPoints: ['src/index.ts'],
	outfile: 'build/index.cjs',
	format: 'cjs',
});

const options = ['-b'];

if (shouldWatch) {
	options.push('-w', '--preserveWatchOutput');
}

const tscResult = execa('tsc', options, {
	stdio: 'inherit',
});

if (shouldWatch) {
	console.log('Watching for changes…');

	process.once('SIGINT', () => {
		console.log('\rStopping…');
		esmResult.stop?.();
		cjsResult.stop?.();
		tscResult?.kill();
		process.exit(0);
	});
} else {
	await tscResult;
}

/** @param {string} path */
function resolvePath (path) {
	return fileURLToPath(new URL(path, import.meta.url));
}
