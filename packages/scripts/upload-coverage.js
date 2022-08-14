#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { execa } from 'execa';

if (!process.env.GITHUB_PATH) {
	console.error('This script only works on GitHub CI.');
	process.exit(1);
}

const packagesDir = 'packages';

for (const packageName of await readdir(packagesDir)) {
	const lcov = path.join(packagesDir, packageName, 'coverage', 'lcov.info');

	if (!existsSync(lcov)) {
		console.log(`Skipped uploading ${packageName}. lcov file not found.`);
		continue;
	}

	console.log(`::group::Uploading ${packageName}…`);

	await execa('codecov', [
		...process.argv.slice(2),
		'-f',
		lcov,
		'-F',
		packageName,
	], {
		stdio: 'inherit',
	});

	console.log('::endgroup::');
}
