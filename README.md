# CuraK

CuraQ CLI/TUI client built with OpenTUI.

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

### Global
| Key | Action |
|-----|--------|
| Tab | Switch tabs |
| 1 | Go to Articles |
| 2 | Go to Discovery |
| 3 | Go to Search |
| q | Quit |

### Articles List
| Key | Action |
|-----|--------|
| j/↓ | Move down |
| k/↑ | Move up |
| Enter | View article |
| r | Mark as read |
| d | Delete article |
| Shift+R | Refresh list |

### Article Detail
| Key | Action |
|-----|--------|
| ESC/q | Go back |
| j/↓ | Scroll down |
| k/↑ | Scroll up |

### Search
| Key | Action |
|-----|--------|
| Enter | Execute search / Select article |
| / | Focus search input |
| m | Toggle search mode (keyword/semantic) |
| j/k | Navigate results |
| ESC | Unfocus input |

### Discovery
| Key | Action |
|-----|--------|
| j/↓ | Move down |
| k/↑ | Move up |
| x | Dismiss item |
| Shift+R | Refresh list |

## Development

```bash
pnpm dev
```
