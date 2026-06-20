import type { Plugin, PluginBuild, OnLoadArgs, OnLoadResult } from 'esbuild';
import { Options, compileAsync } from 'sass';

export interface SassPluginOptions {
    /** Modern API (`sass.compileAsync`) に引き渡されるオプション */
    sassOptions?: Omit<Options<'async'>, 'sourceMap' | 'style'>;
}

export const sassPlugin = (options: SassPluginOptions = {}): Plugin => ({
    name: 'esbuild-plugin-sass',
    setup(build: PluginBuild) {
        // esbuildの共通設定から、minify と sourcemap の有無を取得
        const { minify, sourcemap } = build.initialOptions;

        build.onLoad({ filter: /\.s[ac]ss$/ }, async (args: OnLoadArgs): Promise<OnLoadResult> => {
            try {
                // Modern API を使用して非同期でコンパイル
                const result = await compileAsync(args.path, {
                    ...options.sassOptions,
                    // esbuild側でminifyする場合はSass側での圧縮は不要だが、
                    // 連動させたい場合はここでも圧縮スタイルを指定可能
                    style: minify ? 'compressed' : 'expanded',
                    // esbuildがsourcemap出力を求めている場合はSassでも生成する
                    sourceMap: !!sourcemap,
                    sourceMapIncludeSources: true,
                });

                // Sassのソースマップオブジェクトをesbuildに渡すための対応
                let contents = result.css;
                if (result.sourceMap) {
                    // ソースマップをBase64のData URIとしてCSSの末尾にインライン結合
                    const sourceMapJson = JSON.stringify(result.sourceMap);
                    const sourceMapBase64 = Buffer.from(sourceMapJson).toString('base64');
                    contents += `\n/*# sourceMappingURL=data:application/json;base64,${sourceMapBase64} */`;
                }

                return {
                    contents,
                    loader: 'css',
                };
            } catch (err: any) {
                return {
                    errors: [
                        {
                            text: err.message || String(err),
                            detail: err,
                        },
                    ],
                };
            }
        });
    },
});
