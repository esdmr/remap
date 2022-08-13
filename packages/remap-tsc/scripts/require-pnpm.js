#!/usr/bin/env node
import process from 'node:process';

if (!process.env.npm_config_user_agent?.startsWith('pnpm/')) {
	console.error('This script must be run by pnpm.');
	process.exit(1);
}
