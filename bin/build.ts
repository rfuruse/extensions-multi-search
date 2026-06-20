import { BuildOptions, context, build } from 'esbuild';
import { sassPlugin } from './plugins/esbuild-plugin-sass';
import { copyAssetsPlugin } from './plugins/esbuild-plugin-copy-assets';
import { resolve } from 'path';

const isWatch = process.argv.includes('--watch');

const buildOptions: BuildOptions = {
  entryPoints: [
    'src/background.ts',
    'src/options/options.ts',
    'src/options/options.scss',
  ],
  bundle: true,
  outdir: 'dist',
  outbase: 'src',
  platform: 'browser',
  format: 'esm',
  target: ['chrome112', 'es2022'],
  sourcemap: 'both',
  minify: true,
  logLevel: 'info',
  plugins: [
    sassPlugin({
      sassOptions: {
        loadPaths: [resolve(process.cwd(), 'node_modules')],
      },
    }),
    copyAssetsPlugin({
      assets: [
        { src: 'src/manifest.json', dst: 'dist/manifest.json' },
        { src: 'src/options/options.html', dst: 'dist/options/options.html' },
      ],
    }),
  ],
};
async function run() {
  if (isWatch) {
    const ctx = await context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes in src/...');
  } else {
    await build(buildOptions);
    console.log('Build completed successfully.');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});