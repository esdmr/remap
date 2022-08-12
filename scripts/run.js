#!/usr/bin/env node
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { execa, execaCommand } from 'execa';
import ci from 'ci-info';

const [command, partialArgv, argv] = parseArgv();
const isPartial = Boolean(process.env.DEBUG_PARTIAL) || ((ci.isPR ?? false) && !(await areMetaFilesChanged()));

switch (command) {
	case 'run':
		argv.unshift('recursive', 'run');
		break;

	case 'pnpm':
		break;

	default:
		throw new Error(`Unknown command ${command}`);
}

try {
	if (isPartial) {
		await execa('pnpm', [
			...partialArgv,
			...argv,
		], {
			stdio: 'inherit',
		});
	} else {
		await execa('pnpm', argv, {
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
 * @returns {[string, string[], string[]]}
 */
function parseArgv () {
	const argv = process.argv.slice(2);
	const commandEnd = argv.indexOf('[');
	const partialEnd = argv.indexOf(']', commandEnd);

	if (commandEnd < 0 || partialEnd < 0) {
		console.error('Usage: ./scripts/run.js <command> <arg> [ <partial-only args...> ] <normal args...>');
		process.exit(1);
	}

	return [
		argv[0] ?? '',
		argv.slice(commandEnd + 1, partialEnd),
		argv.slice(partialEnd + 1),
	];
}

async function areMetaFilesChanged () {
	const rootDir = fileURLToPath(new URL('..', import.meta.url));

	const diff = await execaCommand('git diff --name-only origin/main', {
		cwd: rootDir,
	});

	if (diff.stdout) {
		const changedFiles = diff.stdout.split('\n');

		for (const changedFile of changedFiles) {
			if (changedFile.startsWith('.config/')) {
				return true;
			}
		}
	}

	return false;
}
