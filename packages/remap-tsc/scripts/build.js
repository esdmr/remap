#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';
import { build } from 'esbuild';
import { execaCommand } from 'execa';
import isPnpm from '@esdmr/scripts/is-pnpm';

assert(isPnpm, 'This script must be run by pnpm');

/** @param {string} path */
const resolvePath = (path) => fileURLToPath(new URL(path, import.meta.url));

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
	absWorkingDir: resolvePath('..'),
	platform: 'node',
	bundle: true,
	keepNames: true,
	minifySyntax: true,
	minifyWhitespace: true,
	sourcemap: true,
	sourcesContent: false,
	external: ['node:path', 'typescript'],
	target: 'node14',
};

await build({
	...buildOptions,
	entryPoints: ['src/index.ts'],
	outfile: 'build/index.js',
	format: 'esm',
});

await build({
	...buildOptions,
	entryPoints: ['src/index.ts'],
	outfile: 'build/index.cjs',
	format: 'cjs',
});

await execaCommand('tsc -b', {
	stdio: 'inherit',
	cwd: resolvePath('..'),
});
