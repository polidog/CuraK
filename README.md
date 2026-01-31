# CuraK

<p align="center">
  <img src="assets/curak-demo-v2.gif" alt="CuraK Demo" width="800">
</p>

Ink で構築された CuraQ CLI/TUI クライアント。

## 必要要件

- Node.js 18以上
- CuraQ API トークン

## インストール

### npm でグローバルインストール

```bash
npm install -g curak
```

### ソースからビルド

```bash
pnpm install
pnpm build
```

## 使い方

### コマンド

```bash
# API トークンの設定（~/.config/curak/config.json に保存）
curak setup

# 現在の設定を表示
curak config

# テーマを設定（インタラクティブ選択または名前指定）
curak theme
curak theme dracula

# スタート画面を設定
curak start-screen unread

# 保存されたトークンをクリア
curak clear

# ヘルプを表示
curak help

# TUI アプリケーションを起動
curak
```

### 環境変数でトークンを設定

環境変数は保存された設定より優先されます：

```bash
CURAQ_MCP_TOKEN=your_token_here curak
```

### トークンの保存場所

トークンは `~/.config/curak/config.json` に保存されます。

## キーバインド

### 記事リスト
| キー | アクション |
|-----|--------|
| j/↓ | 下に移動 |
| k/↑ | 上に移動 |
| Enter | 記事を表示 |
| m | 既読にする |
| o | ブラウザで開く |
| a | 記事を追加 |
| T | テーマ選択 |
| ^R | リストを更新 |
| q | 終了 |

### リーダービュー
| キー | アクション |
|-----|--------|
| j/k | スクロール |
| Space/PgDn | ページダウン |
| PgUp | ページアップ |
| o | ブラウザで開く |
| Esc | リストに戻る |

### テーマ選択
| キー | アクション |
|-----|--------|
| j/k | テーマを選択 |
| Enter | 適用 |
| q | キャンセル |

## テーマ

利用可能なテーマ: default, ocean, forest, sunset, mono, sakura, nord, dracula, solarized, cyberpunk, coffee, tokyoMidnight, kanagawa, pc98

## 開発

```bash
pnpm dev
```
