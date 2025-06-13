import esbuild from 'esbuild';
import { sassPlugin } from 'esbuild-sass-plugin';
import { builtinModules } from 'module';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';
import { getBuildNumber } from './utils/buildHelper.js';
import type { SassPluginOptions } from './types/sass-plugin-types.js';

// Load environment variables
dotenv.config();
let buildNumber = getBuildNumber();

/**
 * Copies GOV.UK (fonts and images from `govuk-frontend`), MOJ Frontend (images from `@ministryofjustice/frontend`) and other assets
 * to the `public/assets` directory.
 * @async
 * @returns {Promise<void>} Resolves when the assets are copied successfully.
 */
const copyAssets = async (): Promise<void> => {
	try {
		// GOV.UK assets
		await fs.copy(
			path.resolve('./node_modules/govuk-frontend/dist/govuk/assets'),
			path.resolve('./public/assets')
		);
		// Copy GOVUK rebrand assets for brand refresh
		await fs.copy(
			path.resolve('./node_modules/govuk-frontend/dist/govuk/assets/rebrand'),
			path.resolve('./public/assets/rebrand')
		);
		// Copy MOJ Frontend assets
		await fs.copy(
			path.resolve('./node_modules/@ministryofjustice/frontend/moj/assets/images'),
			path.resolve('./public/assets/images')
		);
		console.log('✅ GOV.UK assets (including rebrand) & MOJ Frontend assets copied successfully.');
	} catch (error) {
		console.error('❌ Failed to copy assets:', error);
		process.exit(1);
	}
};

/**
 * List of external dependencies that should not be bundled.
 * @constant {string[]}
 */
const externalModules: string[] = [
	...builtinModules,
	'express',
	'nunjucks',
	'dotenv',
	'cookie-signature',
	'cookie-parser',
	'body-parser',
	'express-session',
	'morgan',
	'compression',
	'axios',
	'middleware-axios',
	'util',
	'path',
	'fs',
	'figlet',
	'csrf-sync',
	'http-errors',
	'*.node'
];

/**
 * Builds SCSS files with optional watch capability.
 * @async
 * @param {boolean} watch - Whether to enable watch mode
 * @returns {Promise<esbuild.BuildContext | void>} Build context if watching, void otherwise
 */
const buildScss = async (watch: boolean = false): Promise<esbuild.BuildContext | void> => {
	const options: esbuild.BuildOptions = {
		entryPoints: ['src/scss/main.scss'],
		bundle: true,
		outfile: `public/css/main.${buildNumber}.css`,
		external: ['*.woff', '*.woff2', '*.svg', '*.png', '*.jpg', '*.jpeg', '*.gif'],
		plugins: [
			sassPlugin({
				loadPaths: [
					path.resolve('.'), // Current directory
					path.resolve('node_modules') // Node modules directory
				],
				/**
				 * Transforms SCSS content to update asset paths.
				 * @param {string} source - Original SCSS source content.
				 * @returns {string} Transformed SCSS with updated asset paths.
				 */
				transform: (source: string): string =>
					source
						.replace(/url\(["']?\/assets\/fonts\/([^"')]+)["']?\)/g, 'url("/assets/fonts/$1")')
						.replace(/url\(["']?\/assets\/images\/([^"')]+)["']?\)/g, 'url("/assets/images/$1")')
			} as SassPluginOptions)
		],
		loader: {
			'.scss': 'css',
			'.css': 'css'
		},
		minify: process.env.NODE_ENV === 'production',
		sourcemap: process.env.NODE_ENV !== 'production'
	};

	if (watch) {
		const context = await esbuild.context(options);
		await context.watch();
		return context;
	} else {
		await esbuild.build(options).catch((error) => {
			console.error('❌ SCSS build failed:', error);
			process.exit(1);
		});
	}
};

/**
 * Builds `app.js` with optional watch capability.
 * @async
 * @param {boolean} watch - Whether to enable watch mode
 * @returns {Promise<esbuild.BuildContext | void>} Build context if watching, void otherwise
 */
const buildAppJs = async (watch: boolean = false): Promise<esbuild.BuildContext | void> => {
	const options: esbuild.BuildOptions = {
		entryPoints: ['src/app.ts'],
		bundle: true,
		platform: 'node',
		target: 'es2020',
		format: 'esm',
		sourcemap: process.env.NODE_ENV !== 'production',
		minify: process.env.NODE_ENV === 'production',
		loader: {
			'.js': 'jsx',
			'.ts': 'tsx',
			'.json': 'json',
		},
		external: externalModules,
		outfile: 'public/app.js'
	};

	if (watch) {
		const context = await esbuild.context(options);
		await context.watch();
		return context;
	} else {
		await esbuild.build(options).catch((error) => {
			console.error('❌ app.js build failed:', error);
			process.exit(1);
		});
	}
};

/**
 * Builds `custom.js` with optional watch capability.
 * @async
 * @param {boolean} watch - Whether to enable watch mode
 * @returns {Promise<esbuild.BuildContext | void>} Build context if watching, void otherwise
 */
const buildCustomJs = async (watch: boolean = false): Promise<esbuild.BuildContext | void> => {
	const options: esbuild.BuildOptions = {
		entryPoints: ['src/scripts/custom.ts'],
		bundle: true,
		platform: 'browser',
		target: 'es2020',
		format: 'esm',
		sourcemap: process.env.NODE_ENV !== 'production',
		minify: process.env.NODE_ENV === 'production',
		outfile: `public/js/custom.${buildNumber}.min.js`
	};

	if (watch) {
		const context = await esbuild.context(options);
		await context.watch();
		return context;
	} else {
		await esbuild.build(options).catch((error) => {
			console.error('❌ custom.js build failed:', error);
			process.exit(1);
		});
	}
};

/**
 * Build GOV.UK frontend & MOJ frontend files separately with optional watch capability.
 * @async
 * @param {boolean} watch - Whether to enable watch mode
 * @returns {Promise<esbuild.BuildContext | void>} Build context if watching, void otherwise
 */
const buildFrontendPackages = async (watch: boolean = false): Promise<esbuild.BuildContext | void> => {
	const options: esbuild.BuildOptions = {
		entryPoints: [
			'src/scripts/frontend-packages-entry.ts'
		],
		bundle: true,
		platform: 'browser',
		target: 'es2020',
		format: 'esm',
		sourcemap: process.env.NODE_ENV !== 'production',
		minify: process.env.NODE_ENV === 'production',
		treeShaking: false, // Disable tree shaking to preserve side-effect imports
		outfile: `public/js/frontend-packages.${buildNumber}.min.js`
	};

	if (watch) {
		const context = await esbuild.context(options);
		await context.watch();
		return context;
	} else {
		await esbuild.build(options).catch((error) => {
			console.error('❌ GOV.UK frontend and/or MOJ frontend JS build failed:', error);
			process.exit(1);
		});
	}
};

/**
 * Main watch process that sets up watchers for all build tasks.
 * @async
 * @returns {Promise<void>} Resolves when all watchers are set up.
 */
const watchBuild = async (): Promise<void> => {
	try {
		// Copy assets initially
		await copyAssets();

		// Start all watchers
		const contexts = await Promise.all([
			buildScss(true),
			buildAppJs(true),
			buildCustomJs(true),
			buildFrontendPackages(true)
		]);

		// Watch for asset changes and copy them
		const assetWatcher = chokidar.watch(['node_modules/govuk-frontend/dist/govuk/assets/**/*', 'node_modules/@ministryofjustice/frontend/moj/assets/images/**/*'], {
			ignored: /node_modules\/(?!govuk-frontend|@ministryofjustice)/,
			persistent: true
		});

		assetWatcher.on('change', async () => {
			await copyAssets();
		});

		console.log('✅ Watch mode started successfully. Watching for file changes...');

		// Keep the process alive
		process.on('SIGINT', async () => {
			console.log('\n🛑 Stopping watch mode...');
			await Promise.all(contexts.filter(Boolean).map(context => (context as esbuild.BuildContext).dispose()));
			assetWatcher.close();
			process.exit(0);
		});

	} catch (error) {
		console.error('❌ Watch mode setup failed:', error);
		process.exit(1);
	}
};

/**
 * Single build process (non-watch mode).
 * @async
 * @returns {Promise<void>} Resolves when the entire build process is completed successfully.
 */
const build = async (): Promise<void> => {
	try {
		console.log('🚀 Starting build process...');

		// Copy assets
		await copyAssets();

		// Build all files
		await Promise.all([
			buildScss(false),
			buildAppJs(false),
			buildCustomJs(false),
			buildFrontendPackages(false)
		]);

		console.log('✅ Build completed successfully.');
	} catch (error) {
		console.error('❌ Build process failed:', error);
		process.exit(1);
	}
};

// Export functions
export { build, watchBuild };

// Run based on command line arguments
if (import.meta.url === `file://${process.argv[1]}`) {
	const isWatch = process.argv.includes('--watch');

	if (isWatch) {
		watchBuild().catch((error) => {
			console.error('❌ Watch mode failed:', error);
			process.exit(1);
		});
	} else {
		build().catch((error) => {
			console.error('❌ Build script failed:', error);
			process.exit(1);
		});
	}
}
