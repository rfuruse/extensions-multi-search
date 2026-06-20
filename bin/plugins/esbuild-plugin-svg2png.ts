import type { Plugin, PluginBuild, BuildResult } from 'esbuild';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { basename, extname, join } from 'path';

export interface SvgToPngPluginOptions {
    /** 変換元のSVGファイルのパス */
    src: string;
    /** 出力先ディレクトリ */
    outDir: string;
    /** 生成するサイズ（ピクセル）の配列 */
    sizes: number[];
}

export const svgToPngPlugin = (options: SvgToPngPluginOptions): Plugin => ({
    name: 'esbuild-plugin-svg-to-png',
    setup(build: PluginBuild) {
        build.onEnd(async (result: BuildResult) => {
            // ビルドエラーがある場合は処理しない
            if (result.errors.length > 0) return;

            if (!existsSync(options.src)) {
                console.warn(`svgToPngPlugin: 変換元のSVGが見つかりません: ${options.src}`);
                return;
            }

            if (!existsSync(options.outDir)) {
                mkdirSync(options.outDir, { recursive: true });
            }

            const baseName = basename(options.src, extname(options.src));

            try {
                // 各サイズごとにSVGからPNGを生成
                await Promise.all(options.sizes.map(async (size) => {
                    const outFile = join(options.outDir, `${baseName}-${size}.png`);
                    await sharp(options.src)
                        .resize(size, size)
                        .png() // 透過PNGとして出力
                        .toFile(outFile);
                }));
                console.log(`SVG converted to PNGs (sizes: ${options.sizes.join(', ')}) via plugin.`);
            } catch (err: any) {
                console.error('svgToPngPlugin: PNGの生成中にエラーが発生しました。', err);
            }
        });
    },
});