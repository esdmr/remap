#!/usr/bin/env node
import fs from 'node:fs/promises';
import process from 'node:process';
import { execaCommand } from 'execa';

/**
 * @param {Record<string, any>} packageMeta
 */
function processPackageJson (packageMeta) {
	// Cleanup package.json
	delete packageMeta.scripts;
	delete packageMeta.devDependencies;
	delete packageMeta.packageManager;
	delete packageMeta.pnpm;

	return packageMeta;
}

/** @type {import('execa').Options} */
const options = {
	stdio: 'inherit',
};

console.log('pnpm install');
await execaCommand('pnpm --filter @esdmr/remap-tsc install --prod=false', options);

console.log('pnpm run build');
await execaCommand('pnpm --filter @esdmr/remap-tsc run build', options);

console.log('pnpm run lint');
await execaCommand('pnpm --filter @esdmr/remap-tsc run lint', options);

console.log('pnpm run test');
await execaCommand('pnpm --filter @esdmr/remap-tsc run test', options);

const packageJson = await fs.readFile('package.json', 'utf8');
const newPackageJson = JSON.stringify(
	processPackageJson(JSON.parse(packageJson)),
);

try {
	console.log('mv package.json …');
	await fs.rename('package.json', '.package.dev.json');

	console.log('new package.json');
	await fs.writeFile('package.json', newPackageJson);
} catch (error) {
	console.error(error);

	console.error('# Reverting changes to package.json');
	await fs.writeFile('package.json', packageJson);

	console.error('rm …');
	await fs.rm('.package.dev.json', {
		force: true,
	});

	process.exit(1);
}
