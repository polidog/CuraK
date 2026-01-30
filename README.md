# CuraK

<p align="center">
  <img src="assets/demo.gif" alt="CuraK Demo" width="800">
</p>

CuraQ CLI/TUI client built with Ink.

## Requirements

- Bun (https://bun.sh)
- CuraQ API token

## Installation

```bash
pnpm install
pnpm build
```

## Usage

### Commands

```bash
# Setup API token (saved to ~/.config/curak/config.json)
pnpm setup
# or
bun dist/index.js setup

# Show current configuration
bun dist/index.js config

# Set theme (interactive selector or by name)
bun dist/index.js theme
bun dist/index.js theme dracula

# Set start screen
bun dist/index.js start-screen unread

# Clear saved token
bun dist/index.js clear

# Show help
bun dist/index.js help

# Start the TUI application
pnpm start
# or
bun dist/index.js
```

### Set token via environment variable

Environment variable takes precedence over saved config:

```bash
CURAQ_MCP_TOKEN=your_token_here pnpm start
```

### Token storage

Token is saved to `~/.config/curak/config.json`

## Keybindings

### Article List
| Key | Action |
|-----|--------|
| j/↓ | Move down |
| k/↑ | Move up |
| Enter | View article |
| m | Mark as done |
| o | Open in browser |
| T | Theme selector |
| ^R | Refresh list |
| q | Quit |

### Reader View
| Key | Action |
|-----|--------|
| j/k | Scroll |
| Space/PgDn | Page down |
| PgUp | Page up |
| o | Open in browser |
| Esc | Back to list |

### Theme Selector
| Key | Action |
|-----|--------|
| j/k | Select theme |
| Enter | Apply |
| q | Cancel |

## Themes

Available themes: default, ocean, forest, sunset, mono, sakura, nord, dracula, solarized, cyberpunk, coffee, tokyoMidnight, kanagawa, pc98

## Development

```bash
pnpm dev
```
