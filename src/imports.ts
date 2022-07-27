/* eslint-disable unicorn/prefer-export-from */
/**
 * @fileoverview
 * This file deduplicates the imports in the bundled output.
 *
 * @see https://togithub.com/evanw/esbuild/issues/475
 */
import assert from 'node:assert';
import path from 'node:path';
import ts from 'typescript';

// With reexports, the name of imports in the development build are rather
// nondescriptive. By explicitly import and exporting, we can keep the names.
export {
	assert, path, ts,
};
