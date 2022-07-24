#!/usr/bin/env node
import { execaCommand } from 'execa';

await execaCommand('pnpm exec typedoc src/index.ts', {
	stdio: 'inherit',
});
