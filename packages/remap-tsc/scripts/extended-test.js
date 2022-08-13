#!/usr/bin/env node
import { execaCommand } from 'execa';

await execaCommand('pnpm --filter @esdmr/remap-tsc exec tap --save-fixture', {
	env: {
		TEST_DISABLE_VFS: '1',
		TEST_ENABLE_TSC: '1',
	},
	stdio: 'inherit',
});
