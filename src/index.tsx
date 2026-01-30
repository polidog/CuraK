#!/usr/bin/env bun
import { render } from 'ink';
import { App } from './components/App.js';
import { ThemeSelector } from './components/ThemeSelector.js';
import {
  getToken,
  hasToken,
  setToken,
  clearToken,
  getTheme,
  setTheme,
  getStartScreen,
  setStartScreen,
  getAvailableThemes,
  themes,
  type ThemeName,
  type StartScreen,
} from './config/token.js';
import * as readline from 'readline';

async function promptForToken(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter your CuraQ API token: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'setup': {
      const token = await promptForToken();
      if (token) {
        setToken(token);
        console.log('\n✓ Token saved to ~/.config/curak/config.json');
      } else {
        console.log('\n✗ No token provided');
      }
      return;
    }

    case 'config': {
      console.log('CuraK Configuration\n');
      const token = getToken();
      if (token) {
        const source = process.env.CURAQ_MCP_TOKEN
          ? 'Environment variable (CURAQ_MCP_TOKEN)'
          : 'Config file (~/.config/curak/config.json)';
        console.log(`Token source: ${source}`);
        console.log(`Token: ${token.substring(0, 8)}...${token.substring(token.length - 4)}`);
      } else {
        console.log('No token configured');
        console.log('\nRun "curak setup" to configure your token');
      }
      console.log(`\nTheme: ${getTheme()}`);
      console.log(`Start screen: ${getStartScreen()}`);
      return;
    }

    case 'theme': {
      const themeName = args[1] as ThemeName | undefined;
      const availableThemes = getAvailableThemes();

      if (!themeName) {
        // Interactive theme selector
        const { waitUntilExit } = render(<ThemeSelector />);
        await waitUntilExit();
        return;
      }

      if (!availableThemes.includes(themeName)) {
        console.log(`✗ Unknown theme: ${themeName}`);
        console.log(`Available: ${availableThemes.join(', ')}`);
        return;
      }

      setTheme(themeName);
      console.log(`✓ Theme set to: ${themeName}`);
      return;
    }

    case 'start-screen': {
      const screen = args[1] as StartScreen | undefined;

      if (!screen) {
        console.log(`Current start screen: ${getStartScreen()}`);
        console.log('\nUsage: curak start-screen <unread|read>');
        return;
      }

      if (screen !== 'unread' && screen !== 'read') {
        console.log(`✗ Invalid start screen: ${screen}`);
        console.log('Available: unread, read');
        return;
      }

      setStartScreen(screen);
      console.log(`✓ Start screen set to: ${screen}`);
      return;
    }

    case 'clear': {
      clearToken();
      console.log('✓ Token cleared');
      return;
    }

    case 'help':
    case '--help':
    case '-h': {
      console.log(`CuraK - CuraQ TUI Client

Usage:
  curak                       Start the TUI application
  curak setup                 Configure API token
  curak config                Show current configuration
  curak theme [name]          Set theme (default, ocean, forest, sunset, mono)
  curak start-screen [mode]   Set start screen (unread, read)
  curak clear                 Clear saved token
  curak help                  Show this help message

Environment Variables:
  CURAQ_MCP_TOKEN    API token (overrides saved token)`);
      return;
    }
  }

  // Check for token before starting
  if (!hasToken()) {
    console.log('No API token configured.\n');
    console.log('Run "curak setup" to configure your token');
    console.log('Or set the CURAQ_MCP_TOKEN environment variable');
    process.exit(1);
  }

  // Start the TUI
  const { waitUntilExit } = render(<App />);
  await waitUntilExit();
}

main().catch(console.error);
