#!/usr/bin/env node
import assert from 'node:assert';
import { execaCommand } from 'execa';
import isPnpm from 'scripts/is-pnpm';

assert(isPnpm, 'This script must be run by pnpm');

await execaCommand('tap --save-fixture', {
	env: {
		TEST_DISABLE_VFS: '1',
		TEST_ENABLE_TSC: '1',
	},
	stdio: 'inherit',
});
