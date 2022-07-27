import * as descriptors from './descriptors.js';
import { RemapTscError } from './errors.js';
import { assert, path, ts } from './imports.js';
import { getPreferences, Options, Preferences } from './options.js';
import { normalizeForTypeScript, PathMap, ReadonlyPathMap } from './path.js';
import { validateCommandLine, validateFile } from './validators.js';

export type OutputFileType = 'js' | 'map' | 'dts' | 'unknown';

/**
 * Information about a `tsc` source file.
 */
class SourceFile {
	readonly #javaScriptFiles = new Set<OutputFile>();
	readonly #declarationFiles = new Set<OutputFile>();
	readonly #sourceMapFiles = new Set<OutputFile>();
	readonly #outputFiles = new Set<OutputFile>();

	/** Absolute path to the emitted JavaScript file. */
	get javaScriptFiles (): ReadonlySet<OutputFile> {
		return this.#javaScriptFiles;
	}

	/** Absolute path to the emitted Declaration file. */
	get declarationFiles (): ReadonlySet<OutputFile> {
		return this.#declarationFiles;
	}

	/** Absolute paths to the emitted source maps. */
	get sourceMapFiles (): ReadonlySet<OutputFile> {
		return this.#sourceMapFiles;
	}

	/** Absolute paths to all emitted files. */
	get outputFiles (): ReadonlySet<OutputFile> {
		return this.#outputFiles;
	}

	get [Symbol.toStringTag] () {
		return SourceFile.name;
	}

	/** @internal */
	constructor (readonly path: string) {
		Object.defineProperty(this, 'path', descriptors.readonlyProperty);
	}

	/** @internal */
	_addOutputFiles (outputFiles: readonly OutputFile[]) {
		for (const file of outputFiles) {
			file._setSourceFile(this);
			this.#outputFiles.add(file);

			switch (file.type) {
				case 'js':
					this.#javaScriptFiles.add(file);
					break;

				case 'dts':
					this.#declarationFiles.add(file);
					break;

				case 'map':
					this.#sourceMapFiles.add(file);
					break;

				default:
				// Do nothing.
			}
		}
	}

	/** @internal */
	_deleteOutputFile (outputFile: OutputFile) {
		this.#javaScriptFiles.delete(outputFile);
		this.#declarationFiles.delete(outputFile);
		this.#sourceMapFiles.delete(outputFile);
		this.#outputFiles.delete(outputFile);
	}
}

Object.defineProperties(SourceFile.prototype, {
	javaScriptFiles: descriptors.publicProperty,
	declarationFiles: descriptors.publicProperty,
	sourceMapFiles: descriptors.publicProperty,
	outputFiles: descriptors.publicProperty,
});

/**
 * Information about a `tsc` output file.
 */
class OutputFile {
	#sourceFile?: SourceFile;
	readonly type: OutputFileType;

	get sourceFile () {
		assert(this.#sourceFile, 'OutputFile must be initialized first');
		return this.#sourceFile;
	}

	get [Symbol.toStringTag] () {
		return OutputFile.name;
	}

	/** @internal */
	constructor (readonly path: string) {
		let type: OutputFileType = 'unknown';

		if (/\.[cm]?js$/i.test(path)) {
			type = 'js';
		} else if (/\.d\.[cm]?ts$/i.test(path)) {
			type = 'dts';
		} else if (/\.map$/i.test(path)) {
			type = 'map';
		}

		this.type = type;

		Object.defineProperties(this, {
			path: descriptors.readonlyProperty,
			type: descriptors.readonlyProperty,
		});
	}

	/** @internal */
	_setSourceFile (sourceFile: SourceFile) {
		this.#sourceFile?._deleteOutputFile(this);
		this.#sourceFile = sourceFile;
	}
}

Object.defineProperty(
	OutputFile.prototype,
	'sourceFile',
	descriptors.publicProperty,
);

function findConfig (projectPath: string, preferences: Preferences) {
	projectPath = path.resolve(projectPath);

	if (preferences.host.parseConfig.fileExists(projectPath)) {
		return projectPath;
	}

	const configPath = path.join(projectPath, 'tsconfig.json');

	if (preferences.host.parseConfig.fileExists(configPath)) {
		return configPath;
	}

	throw new RemapTscError(
		'Could not find a tsconfig file.',
		`Searched in "${projectPath}".`,
	);
}

/**
 * Maps `tsc` source/output files via the TypeScript api.
 */
export class RemapTsc {
	readonly #sourceFiles = new PathMap<SourceFile>();
	readonly #outputFiles = new PathMap<OutputFile>();
	readonly #preferences: Preferences;

	get sourceFiles (): ReadonlyPathMap<SourceFile> {
		return this.#sourceFiles;
	}

	get outputFiles (): ReadonlyPathMap<OutputFile> {
		return this.#outputFiles;
	}

	get [Symbol.toStringTag] () {
		return RemapTsc.name;
	}

	constructor (options: Options = {}) {
		this.#preferences = getPreferences(options);
	}

	/**
	 * Delete all source and output files.
	 */
	clear () {
		this.#sourceFiles.clear();
		this.#outputFiles.clear();
	}

	/**
	 * Load a `tsconfig.json` file.
	 *
	 * @param projectPath Path to either a `tsconfig` file or a directory
	 * containing a `tsconfig` file. May be absolute or relative.
	 */
	loadConfig (projectPath: string) {
		const configPath = normalizeForTypeScript(
			findConfig(projectPath, this.#preferences),
		);

		const configFile = ts.readConfigFile(
			configPath,
			this.#preferences.host.parseConfig.readFile,
		);

		if (configFile.error) {
			throw new RemapTscError(
				'Reading the tsconfig failed.',
				ts.formatDiagnostics(
					[configFile.error],
					this.#preferences.host.formatDiagnostics,
				),
			);
		}

		const commandLine = ts.parseJsonConfigFileContent(
			configFile.config,
			this.#preferences.host.parseConfig,
			path.dirname(configPath),
			undefined,
			configPath,
		);

		if (commandLine.errors.length > 0) {
			throw new RemapTscError(
				'Parsing the tsconfig failed.',
				ts.formatDiagnostics(
					commandLine.errors,
					this.#preferences.host.formatDiagnostics,
				),
			);
		}

		validateCommandLine(commandLine);

		if (this.#preferences.forceEmit) {
			commandLine.options.noEmit = false;
			commandLine.options.emitDeclarationOnly = false;
		}

		const { composite, rootDir } = commandLine.options;
		let effectiveRoot: string | undefined;

		// If composite is set, the default [rootDir] is […] the directory
		// containing the `tsconfig.json` file.
		if (composite || rootDir !== undefined) {
			effectiveRoot = path.resolve(
				path.dirname(configPath),
				rootDir ?? '.',
			);
		}

		for (const fileName of commandLine.fileNames) {
			validateFile(fileName, effectiveRoot, this.#preferences);

			if (commandLine.options.noEmit) {
				continue;
			}

			this.#addMapping(
				path.normalize(fileName),
				ts.getOutputFileNames(
					commandLine,
					fileName,
					!this.#preferences.host.parseConfig.useCaseSensitiveFileNames,
				).map((file) => path.normalize(file)),
			);
		}
	}

	#addMapping (input: string, outputs: readonly string[]) {
		if (outputs.length === 0) {
			return;
		}

		if (outputs.includes(input)) {
			throw new RemapTscError(
				'TS5055: Cannot write file because it would overwrite input file.',
				`The input file is at "${input}".`,
			);
		}

		const sourceFile
			= this.#sourceFiles.get(input) ?? new SourceFile(input);

		const outputFiles = outputs.map(
			(output) => this.#outputFiles.get(output) ?? new OutputFile(output),
		);

		sourceFile._addOutputFiles(outputFiles);
		this.#sourceFiles.set(sourceFile.path, sourceFile);

		for (const file of outputFiles) {
			this.#outputFiles.set(file.path, file);
		}
	}
}

Object.defineProperties(RemapTsc.prototype, {
	sourceFiles: descriptors.publicProperty,
	outputFiles: descriptors.publicProperty,
});

export default RemapTsc;
export type { SourceFile, OutputFile };
export { RemapTscError } from './errors.js';

export type {
	Host as TscRemapHost,
	Options as TscRemapOptions,
} from './options.js';

export type { PathMap, ReadonlyPathMap } from './path.js';
