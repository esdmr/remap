import { path } from './imports.js';

/**
 * Convert a path to the correct format for TypeScript. TypeScript internally
 * uses slashes to separate directories even in Windows. Without this,
 * backslashes in windows break with `Error: Debug Failure`s in some uncommon
 * cases.
 *
 * On \*nix, if a file/directory has a backslash in the file name, it is
 * misinterpreted.
 *
 * @see https://togithub.com/microsoft/TypeScript/blob/165a1c4a405104f1e3849b4856bc57117e136d3f/src/compiler/path.ts#L4
 * @see https://togithub.com/microsoft/TypeScript/issues/44174
 */
export function normalizeForTypeScript (file: string) {
	return path.normalize(file).replace(/\\/g, '/');
}

export function isPathUnderRoot (root: string, file: string) {
	const relative = path.relative(root, file);

	return (
		Boolean(relative)
		&& relative.split(path.sep, 1)[0] !== '..'
		&& !path.isAbsolute(relative)
	);
}

export class PathMap<T> extends Map<string, T> {
	override get [Symbol.toStringTag] () {
		return PathMap.name;
	}

	override get (key: string): T | undefined {
		return super.get(path.resolve(key));
	}

	override has (key: string): boolean {
		return super.has(path.resolve(key));
	}
}

export type ReadonlyPathMap<T> = Omit<PathMap<T>, 'set' | 'delete' | 'clear'>;
