import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

export type StartScreen = 'unread' | 'read';
export type ThemeName = 'default' | 'ocean' | 'forest' | 'sunset' | 'mono';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  unread: string;
  read: string;
  border: string;
  text: string;
  textDim: string;
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
    textDim: 'gray',
  },
  ocean: {
    primary: 'blue',
    secondary: 'cyan',
    accent: 'magenta',
    unread: 'cyan',
    read: 'blue',
    border: 'blue',
    text: 'white',
    textDim: 'gray',
  },
  forest: {
    primary: 'green',
    secondary: 'yellow',
    accent: 'cyan',
    unread: 'yellow',
    read: 'green',
    border: 'green',
    text: 'white',
    textDim: 'gray',
  },
  sunset: {
    primary: 'magenta',
    secondary: 'red',
    accent: 'yellow',
    unread: 'yellow',
    read: 'red',
    border: 'magenta',
    text: 'white',
    textDim: 'gray',
  },
  mono: {
    primary: 'white',
    secondary: 'gray',
    accent: 'white',
    unread: 'white',
    read: 'gray',
    border: 'gray',
    text: 'white',
    textDim: 'gray',
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
