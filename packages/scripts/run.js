#!/usr/bin/env node
import process from 'node:process';
import assert from 'node:assert';
import { execa } from 'execa';
import isPnpm from './is-pnpm.js';

assert(isPnpm, 'This script must be run by pnpm');

const [target, argv] = parseArgv();
const isPartial = process.env.GITHUB_PR_TO_MAIN !== 'false';

console.log('Running', isPartial ? 'affected' : 'all', 'packages.');

try {
	if (isPartial) {
		await execa('nx', [
			'affected',
			'--base=origin/main',
			'--head=HEAD',
			'--target=' + target,
			...argv,
		], {
			stdio: 'inherit',
		});
	} else {
		await execa('nx', [
			'run-many',
			'--target=' + target,
			...argv,
		], {
			stdio: 'inherit',
		});
	}
} catch (error) {
	process.exitCode = 1;

	if (error instanceof Error) {
		const code = /** @type {Record<string, any>} */(error).exitCode;

		if (typeof code === 'number') {
			process.exitCode = code;
		}
	}

	process.exit();
}

/**
 * @returns {[string, string[]]}
 */
function parseArgv () {
	const [target, ...argv] = process.argv.slice(2);

	if (!target) {
		console.error('Usage: pnpm exec run <target> [options] [arguments]');
		process.exit(1);
	}

	return [
		target,
		argv,
	];
}
