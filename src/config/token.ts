import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

export type StartScreen = 'unread' | 'read';
export type ThemeName =
  | 'default'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'mono'
  | 'sakura'
  | 'nord'
  | 'dracula'
  | 'solarized'
  | 'cyberpunk'
  | 'coffee'
  | 'tokyoMidnight'
  | 'kanagawa'
  | 'pc98';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  unread: string;
  read: string;
  border: string;
  text: string;
  textDim: string;
  // Extended color properties
  logo: string;
  boxBorder: string;
  title: string;
  url: string;
  tags: string;
  listItem: string;
  listItemSelected: string;
  help: string;
  stats: string;
  spinner: string;
  error: string;
  success: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  default: {
    primary: 'cyan',
    secondary: 'green',
    accent: 'yellow',
    unread: 'yellow',
    read: 'green',
    border: 'cyan',
    text: 'white',
    textDim: '#888888',
    logo: 'cyan',
    boxBorder: 'cyan',
    title: 'cyan',
    url: '#888888',
    tags: 'yellow',
    listItem: '#888888',
    listItemSelected: 'cyan',
    help: '#888888',
    stats: '#888888',
    spinner: 'cyan',
    error: 'red',
    success: 'green',
  },
  ocean: {
    primary: 'blue',
    secondary: 'cyan',
    accent: 'magenta',
    unread: 'cyan',
    read: 'blue',
    border: 'blue',
    text: 'white',
    textDim: '#888888',
    logo: 'blue',
    boxBorder: 'cyan',
    title: 'cyan',
    url: '#6688aa',
    tags: 'magenta',
    listItem: '#888888',
    listItemSelected: 'cyan',
    help: '#6688aa',
    stats: '#6688aa',
    spinner: 'cyan',
    error: 'red',
    success: 'cyan',
  },
  forest: {
    primary: 'green',
    secondary: 'yellow',
    accent: 'cyan',
    unread: 'yellow',
    read: 'green',
    border: 'green',
    text: 'white',
    textDim: '#888888',
    logo: 'green',
    boxBorder: 'green',
    title: 'green',
    url: '#669966',
    tags: 'yellow',
    listItem: '#888888',
    listItemSelected: 'green',
    help: '#669966',
    stats: '#669966',
    spinner: 'green',
    error: 'red',
    success: 'green',
  },
  sunset: {
    primary: 'magenta',
    secondary: 'red',
    accent: 'yellow',
    unread: 'yellow',
    read: 'red',
    border: 'magenta',
    text: 'white',
    textDim: '#888888',
    logo: 'magenta',
    boxBorder: 'magenta',
    title: 'magenta',
    url: '#aa6688',
    tags: 'yellow',
    listItem: '#888888',
    listItemSelected: 'magenta',
    help: '#aa6688',
    stats: '#aa6688',
    spinner: 'magenta',
    error: 'red',
    success: 'yellow',
  },
  mono: {
    primary: 'white',
    secondary: 'gray',
    accent: 'white',
    unread: 'white',
    read: 'gray',
    border: 'gray',
    text: 'white',
    textDim: '#888888',
    logo: 'white',
    boxBorder: 'gray',
    title: 'white',
    url: 'gray',
    tags: 'white',
    listItem: 'gray',
    listItemSelected: 'white',
    help: 'gray',
    stats: 'gray',
    spinner: 'white',
    error: 'white',
    success: 'white',
  },
  sakura: {
    primary: '#f7768e',
    secondary: '#ff9e64',
    accent: '#ffc0cb',
    unread: '#f7768e',
    read: '#ff9e64',
    border: '#f7768e',
    text: 'white',
    textDim: '#a9a9a9',
    logo: '#f7768e',
    boxBorder: '#ffc0cb',
    title: '#f7768e',
    url: '#d4a5a5',
    tags: '#ffc0cb',
    listItem: '#d4a5a5',
    listItemSelected: '#f7768e',
    help: '#d4a5a5',
    stats: '#d4a5a5',
    spinner: '#f7768e',
    error: '#ff6b6b',
    success: '#ff9e64',
  },
  nord: {
    primary: '#5e81ac',
    secondary: '#88c0d0',
    accent: '#ebcb8b',
    unread: '#ebcb8b',
    read: '#a3be8c',
    border: '#5e81ac',
    text: '#eceff4',
    textDim: '#4c566a',
    logo: '#88c0d0',
    boxBorder: '#5e81ac',
    title: '#88c0d0',
    url: '#81a1c1',
    tags: '#ebcb8b',
    listItem: '#d8dee9',
    listItemSelected: '#88c0d0',
    help: '#4c566a',
    stats: '#81a1c1',
    spinner: '#88c0d0',
    error: '#bf616a',
    success: '#a3be8c',
  },
  dracula: {
    primary: '#bd93f9',
    secondary: '#ff79c6',
    accent: '#50fa7b',
    unread: '#f1fa8c',
    read: '#50fa7b',
    border: '#bd93f9',
    text: '#f8f8f2',
    textDim: '#6272a4',
    logo: '#bd93f9',
    boxBorder: '#ff79c6',
    title: '#ff79c6',
    url: '#8be9fd',
    tags: '#f1fa8c',
    listItem: '#6272a4',
    listItemSelected: '#bd93f9',
    help: '#6272a4',
    stats: '#8be9fd',
    spinner: '#bd93f9',
    error: '#ff5555',
    success: '#50fa7b',
  },
  solarized: {
    primary: '#268bd2',
    secondary: '#2aa198',
    accent: '#b58900',
    unread: '#b58900',
    read: '#859900',
    border: '#268bd2',
    text: '#839496',
    textDim: '#586e75',
    logo: '#268bd2',
    boxBorder: '#2aa198',
    title: '#268bd2',
    url: '#2aa198',
    tags: '#b58900',
    listItem: '#839496',
    listItemSelected: '#268bd2',
    help: '#586e75',
    stats: '#657b83',
    spinner: '#268bd2',
    error: '#dc322f',
    success: '#859900',
  },
  cyberpunk: {
    primary: '#ff00ff',
    secondary: '#00ffff',
    accent: '#ff0080',
    unread: '#00ffff',
    read: '#ff00ff',
    border: '#ff0080',
    text: 'white',
    textDim: '#808080',
    logo: '#ff00ff',
    boxBorder: '#00ffff',
    title: '#00ffff',
    url: '#ff0080',
    tags: '#ffff00',
    listItem: '#808080',
    listItemSelected: '#00ffff',
    help: '#ff0080',
    stats: '#00ffff',
    spinner: '#ff00ff',
    error: '#ff0000',
    success: '#00ff00',
  },
  coffee: {
    primary: '#c4a77d',
    secondary: '#8b7355',
    accent: '#deb887',
    unread: '#deb887',
    read: '#8b7355',
    border: '#c4a77d',
    text: '#f5f5dc',
    textDim: '#a0826d',
    logo: '#c4a77d',
    boxBorder: '#8b7355',
    title: '#deb887',
    url: '#a0826d',
    tags: '#d2b48c',
    listItem: '#a0826d',
    listItemSelected: '#deb887',
    help: '#8b7355',
    stats: '#a0826d',
    spinner: '#c4a77d',
    error: '#cd5c5c',
    success: '#8fbc8f',
  },
  tokyoMidnight: {
    primary: '#7aa2f7',
    secondary: '#bb9af7',
    accent: '#7dcfff',
    unread: '#e0af68',
    read: '#9ece6a',
    border: '#7aa2f7',
    text: '#c0caf5',
    textDim: '#565f89',
    logo: '#7aa2f7',
    boxBorder: '#bb9af7',
    title: '#7dcfff',
    url: '#565f89',
    tags: '#e0af68',
    listItem: '#a9b1d6',
    listItemSelected: '#7aa2f7',
    help: '#565f89',
    stats: '#565f89',
    spinner: '#7aa2f7',
    error: '#f7768e',
    success: '#9ece6a',
  },
  kanagawa: {
    primary: '#7e9cd8',
    secondary: '#957fb8',
    accent: '#7fb4ca',
    unread: '#e6c384',
    read: '#98bb6c',
    border: '#7e9cd8',
    text: '#dcd7ba',
    textDim: '#727169',
    logo: '#7e9cd8',
    boxBorder: '#957fb8',
    title: '#7fb4ca',
    url: '#727169',
    tags: '#e6c384',
    listItem: '#c8c093',
    listItemSelected: '#7e9cd8',
    help: '#727169',
    stats: '#727169',
    spinner: '#7e9cd8',
    error: '#e82424',
    success: '#98bb6c',
  },
  pc98: {
    primary: '#00ffff',
    secondary: '#ff00ff',
    accent: '#ffff00',
    unread: '#ffff00',
    read: '#00ffff',
    border: '#ff00ff',
    text: '#ffffff',
    textDim: '#00aaaa',
    logo: '#00ffff',
    boxBorder: '#ff00ff',
    title: '#00ffff',
    url: '#00aaaa',
    tags: '#ffff00',
    listItem: '#ffffff',
    listItemSelected: '#ffff00',
    help: '#00aaaa',
    stats: '#00ffff',
    spinner: '#00ffff',
    error: '#ff0000',
    success: '#00ff00',
  },
};

interface Config {
  token?: string;
  startScreen?: StartScreen;
  theme?: ThemeName;
}

const CONFIG_DIR = join(homedir(), '.config', 'curak');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig(): Config {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data) as Config;
    }
  } catch {
    // Config file doesn't exist or is invalid
  }
  return {};
}

function saveConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function getToken(): string | null {
  // First check environment variable
  const envToken = process.env.CURAQ_MCP_TOKEN;
  if (envToken) {
    return envToken;
  }

  // Then check config file
  const config = loadConfig();
  return config.token || null;
}

export function setToken(token: string): void {
  const config = loadConfig();
  config.token = token;
  saveConfig(config);
}

export function clearToken(): void {
  const config = loadConfig();
  delete config.token;
  saveConfig(config);
}

export function hasToken(): boolean {
  return getToken() !== null;
}

// Start screen settings
export function getStartScreen(): StartScreen {
  const config = loadConfig();
  return config.startScreen || 'unread';
}

export function setStartScreen(screen: StartScreen): void {
  const config = loadConfig();
  config.startScreen = screen;
  saveConfig(config);
}

// Theme settings
export function getTheme(): ThemeName {
  const config = loadConfig();
  return config.theme || 'default';
}

export function setTheme(theme: ThemeName): void {
  const config = loadConfig();
  config.theme = theme;
  saveConfig(config);
}

export function getThemeColors(): ThemeColors {
  return themes[getTheme()];
}

export function getAvailableThemes(): ThemeName[] {
  return Object.keys(themes) as ThemeName[];
}
