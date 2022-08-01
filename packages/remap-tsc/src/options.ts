import { ts } from './imports.js';

const defaultHost: Host = {
	formatDiagnostics: {
		getCanonicalFileName: (path) => path,
		getCurrentDirectory: ts.sys.getCurrentDirectory,
		getNewLine: () => ts.sys.newLine,
	},
	parseConfig: {
		fileExists: ts.sys.fileExists,
		readDirectory: ts.sys.readDirectory,
		readFile: ts.sys.readFile,
		useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
	},
};

export function getPreferences (options: Options): Preferences {
	return {
		host: defaultHost,
		forceEmit: false,
		...options,
	};
}

/**
 * Set of functions to pass to TypeScript as a `host`.
 */
export interface Host {
	readonly formatDiagnostics: ts.FormatDiagnosticsHost;
	readonly parseConfig: ts.ParseConfigHost;
}

/**
 * Options for `remap-tsc`.
 */
export interface Options {
	/**
	 * Custom TypeScript host for non-Node.JS environments. Custom hosts are
	 * *not* tested (yet).
	 */
	host?: Host;
	/**
	 * Forcefully disable `noEmit` and `emitDeclarationOnly`. Enabling this flag
	 * is incompatible with tsc.
	 *
	 * @default false
	 */
	forceEmit?: boolean;
}

export type Preferences = Required<Options>;
