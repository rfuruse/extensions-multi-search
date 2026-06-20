import type { Plugin, PluginBuild, BuildResult } from 'esbuild';
import { existsSync, mkdirSync, promises } from 'fs';
import { dirname } from 'path';

export interface AssetMapping {
    /** コピー元のファイルパス（例: 'src/options/index.html'） */
    src: string;
    /** コピー先のファイルパス（例: 'dist/options/index.html'） */
    dst: string;
}

export interface CopyAssetsPluginOptions {
    /** コピー対象の静的ファイルのリスト */
    assets?: AssetMapping[];
}

export const copyAssetsPlugin = (options: CopyAssetsPluginOptions = {}): Plugin => ({
    name: 'esbuild-plugin-copy-assets',
    setup(build: PluginBuild) {
        // デフォルトの設定値を定義（未指定の場合は提示されたアセットを対象とする）
        const assetsToCopy = options.assets || [
        ];

        build.onEnd(async (result: BuildResult) => {
            // ビルドに失敗している場合はコピー処理を行わない
            if (result.errors.length > 0) return;

            try {
                for (const asset of assetsToCopy) {
                    if (existsSync(asset.src)) {
                        // コピー先のディレクトリパスを抽出
                        const destDir = dirname(asset.dst);

                        // ディレクトリが存在しない場合は再帰的に作成
                        if (!existsSync(destDir)) {
                            mkdirSync(destDir, { recursive: true });
                        }

                        // ファイルを非同期でコピー
                        await promises.copyFile(asset.src, asset.dst);
                    } else {
                        // 警告や情報の出力が必要な場合は、ビルド結果の warnings に追加することも可能
                        console.warn(`copyAssetsPlugin: コピー元のファイルが見つかりません: ${asset.src}`);
                    }
                }
                console.log('Static assets copied via plugin.');
            } catch (err: any) {
                return {
                    errors: [
                        {
                            text: 'copyAssetsPlugin: 静的ファイルのコピー中にエラーが発生しました。',
                            detail: err,
                        },
                    ],
                };
            }
        });
    },
});
