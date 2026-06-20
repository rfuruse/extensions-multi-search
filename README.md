# **Extensions Multi Search**

ブラウザ拡張機能として動作し、複数の検索エンジンや情報ソースに対する一括検索（マルチサーチ）を提供するプロジェクトです。TypeScript と esbuild を採用し、高速なビルドと堅牢な型検査を実現しています。ユーザーはオプション画面から直感的に検索動作をカスタマイズ可能です。

## **🗂️ 目次 (Table of Contents)**

* [📝 タイトルと概要 (Title & Description)](#bookmark=id.8szjnh9z39ae)  
* [📺 画面キャプチャ・デモ (Demo & Screenshot)](#bookmark=id.7gj9tf4jim4s)  
* [🔄 システムフロー・シーケンス図 (System Flow & Sequence Diagram)](#bookmark=id.gam8s4x1apv3)  
* [🛠️ 技術スタック (Tech Stack)](#bookmark=id.w48hs9tb5tvb)  
* [📂 ディレクトリ構造 (Directory Structure)](#bookmark=id.5etzuzw2q0m9)  
* [🔗 URL構成・API構成 / エントリーポイント (URL, API & Entry Points)](#bookmark=id.odrlg15highe)  
* [🚀 環境構築・セットアップ (Getting Started)](#bookmark=id.mvaq3elnskbx)  
* [💻 使用方法・デプロイ方法 (Usage & Deployment)](#bookmark=id.m2dot5h206f6)  
* [⚙️ 環境変数・スクリプトプロパティ (Configuration)](#bookmark=id.w0zbrf91u5l)  
* [💡 実装上の工夫 (Implementation & Design Policy)](#bookmark=id.kv0fu2ie8n5d)  
* [👨‍💻 開発者向け情報 & Git運用方針 (Developer Info & Git Workflow)](#bookmark=id.33itz4k8mjl1)  
* [📦 使用パッケージ・依存ライブラリ一覧 (Dependencies)](#bookmark=id.igvqj0x4q8hp)  
* [⚖️ ライセンス (License)](#bookmark=id.voq7f39oxs1)

## **📺 画面キャプチャ・デモ (Demo & Screenshot)**

## **🔄 システムフロー・シーケンス図 (System Flow & Sequence Diagram)**

本拡張機能における、ユーザーの設定保存から実際の検索処理までの基本的なデータの流れを示します。

sequenceDiagram  
    actor User as ユーザー  
    participant Options as オプション画面 (options.html)  
    participant Storage as Chrome Storage (sync/local)  
    participant BG as バックグラウンド (background.ts)  
    participant Browser as ブラウザタブ

    User-\>\>Options: 検索エンジンの設定・保存  
    Options-\>\>Storage: 設定データを保存  
    User-\>\>BG: 検索の実行 (コンテキストメニュー等)  
    BG-\>\>Storage: 保存された設定データを取得  
    BG-\>\>Browser: 複数の検索結果タブを展開・表示

## **🛠️ 技術スタック (Tech Stack)**

* **言語**: TypeScript, Sass (SCSS)  
* **モジュールバンドラー**: esbuild  
* **パッケージマネージャ**: Yarn  
* **プラットフォーム**: Google Chrome (Manifest V3 API)

## **📂 ディレクトリ構造 (Directory Structure)**

主要なディレクトリとファイルは以下の通り構成されています。

```
extensions-multi-search/  
├── .gitignore  
├── bin/  
│   ├── build.ts                              \# esbuildのエントリーポイントスクリプト  
│   └── plugins/  
│       ├── esbuild-plugin-copy-assets.ts     \# アセット(manifest等)のコピー用プラグイン  
│       └── esbuild-plugin-sass.ts            \# SCSSコンパイル用プラグイン  
├── package.json  
├── src/  
│   ├── background.ts                         \# 拡張機能のバックグラウンド処理  
│   ├── manifest.json                         \# 拡張機能の定義ファイル  
│   └── options/  
│       ├── options.html                      \# オプション画面のUI  
│       ├── options.scss                      \# オプション画面のスタイル  
│       └── options.ts                        \# オプション画面のロジック  
├── tsconfig.json                             \# TypeScriptの設定  
└── yarn.lock
```

## **🔗 URL構成・API構成 / エントリーポイント (URL, API & Entry Points)**

本プロジェクトのエントリーポイントは以下の通りです。

* **拡張機能本体 (Manifest)**: src/manifest.json  
* **バックグラウンドスクリプト**: src/background.ts (Service Workerとして動作し、イベントをリッスン)  
* **オプション画面**: src/options/options.html および src/options/options.ts (ユーザーの設定インターフェース)

## **🚀 環境構築・セットアップ (Getting Started)**

開発環境を構築するための手順です。Node.js および Yarn がインストールされていることを前提とします。

1. **リポジトリのクローン**  
   git clone \<repository-url\>  
   cd extensions-multi-search

2. **依存関係のインストール**  
   yarn install

## **💻 使用方法・デプロイ方法 (Usage & Deployment)**

拡張機能をローカルでビルドし、ブラウザに読み込ませる手順です。

1. **プロジェクトのビルド**  
   bin/build.ts を実行して、TypeScript および SCSS をコンパイルします。  
   yarn build

   ※ package.json のスクリプト定義により ts-node bin/build.ts 等が実行され、dist または build フォルダが生成されます。  
2. **ブラウザへの読み込み (Chromeの場合)**  
   * Chromeブラウザで chrome://extensions/ にアクセスします。  
   * 右上の「デベロッパー モード」をオンにします。  
   * 「パッケージ化されていない拡張機能を読み込む」をクリックし、ビルド成果物が出力されたフォルダ（例: dist）を選択します。

## **⚙️ 環境変数・スクリプトプロパティ (Configuration)**

本プロジェクトでは、設定データは主に chrome.storage API を通じて管理されます。

特定のシークレットキーや環境変数（.env）が必要な場合は、ビルド時に esbuild の define オプションを利用して注入します。

* SEARCH\_API\_ENDPOINT: (プレースホルダー) 外部検索APIを利用する場合のエンドポイントURL

## **💡 実装上の工夫 (Implementation & Design Policy)**

* **独自 esbuild プラグインの採用**: ビルド速度を最大化するため、重いバンドラ（Webpack等）を避け、esbuild を採用しています。アセットのコピー (esbuild-plugin-copy-assets.ts) や SCSS のコンパイル (esbuild-plugin-sass.ts) を独自プラグインで処理し、依存関係を最小限に抑えています。  
* **厳格な型定義**: TypeScript を用いて Chrome Extension API の型検査を導入し、ランタイムエラーを未然に防ぐアーキテクチャとしています。

## **👨‍💻 開発者向け情報 & Git運用方針 (Developer Info & Git Workflow)**

* **コミットメッセージ規約**: Semantic Commits (例: feat:, fix:, refactor:, docs:) に従い、変更の意図を明確にしてください。  
* **ウォッチモードの開発**: 開発中は変更を検知して自動ビルドを行うコマンド（例: yarn watch）の利用を推奨します（package.json の定義に依存します）。

## **📦 使用パッケージ・依存ライブラリ一覧 (Dependencies)**

* **TypeScript**: 型安全な開発環境の提供  
* **esbuild**: 高速なビルドおよびトランスパイル  
* **Sass**: src/options/options.scss をコンパイルするための CSS 拡張メタ言語  
* **Chrome Extension Types** (@types/chrome 等): Chrome API の型定義

## **⚖️ ライセンス (License)**

本プロジェクトのライセンスは、利用しているパッケージのライセンスの範囲内で、**NYSL (Near-Yarn Safe License / 煮るなり焼くなり好きにしろライセンス) Version 0.9982** を適用します。

* **ライセンス全文・規約**: [https://www.kmonos.net/nysl/](https://www.kmonos.net/nysl/)  
* **概要**: 本ソフトウェアの利用、改変、再配布等のあらゆる行為について、作者は一切の制限を設けず、また一切の責任を負いません。煮るなり焼くなり好きにお使いください。