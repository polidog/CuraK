# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CuraK is a terminal-based UI (TUI) client for CuraQ, built with React and Ink. It provides a retro terminal aesthetic for managing articles with vim-style keybindings.

## Commands

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Run in development
pnpm dev

# Start the application
pnpm start

# Setup API token
pnpm setup
```

## Architecture

### Technology Stack
- **Runtime**: Bun
- **UI Framework**: Ink (React for CLI)
- **Language**: TypeScript with JSX

### Source Structure

```
src/
├── index.tsx          # Entry point, CLI command routing
├── components/
│   ├── App.tsx        # Main TUI application component
│   └── ThemeSelector.tsx
├── api/
│   └── client.ts      # CuraQ API client (REST API wrapper)
├── config/
│   └── token.ts       # Configuration, themes, and token management
├── services/
│   └── reader.ts      # Article content fetching with Readability
└── types/
    └── article.ts     # TypeScript interfaces
```

### Key Patterns

**API Client**: Singleton pattern via `initClient()`/`getClient()` in `src/api/client.ts`. All API calls go through the CuraQClient class.

**Configuration**: Stored at `~/.config/curak/config.json`. Environment variable `CURAQ_MCP_TOKEN` takes precedence over saved config.

**Themes**: Defined in `src/config/token.ts` with extensive color properties (primary, secondary, accent, etc.). New themes require adding to both the `ThemeName` type union and the `themes` record.

**Text Rendering**: Full-width character support (CJK) uses `getDisplayWidth()`, `truncateToWidth()`, and `padToWidth()` utilities in App.tsx for proper terminal rendering.

## File Extension Note

Use `.js` extension in imports even for TypeScript files (e.g., `import { App } from './components/App.js'`). This is required for ES modules with Bun.
