#!/usr/bin/env node
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { execa, execaCommand } from 'execa';
import shellEscape from 'shell-escape';

const [command, partialArgv, argv] = parseArgv();
const isPartial = process.env.GITHUB_PR_TO_MAIN !== 'false' && !(await areMetaFilesChanged());

console.log('Running scripts in', isPartial ? 'partial' : 'complete', 'mode.');

partialArgv.push(
	'--test-pattern=packages/*/test/**',
	'--changed-files-ignore-pattern=**/README.md',
);

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
		await runPnpm([
			...partialArgv,
			...argv,
		]);
	} else {
		await runPnpm(argv);
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
		console.error('Usage: pnpm exec partial <command> "[" <partial-only args...> "]" <normal args...>');
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

	return diff.stdout.split('\n')
		.some((file) => file.startsWith('.config/'));
}

/**
 * @param {string[]} argv
 */
async function runPnpm (argv) {
	console.log('>', shellEscape(['pnpm', ...argv]));

	return execa('pnpm', argv, {
		stdio: 'inherit',
	});
}
