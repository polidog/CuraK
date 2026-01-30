import React, { useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { themes, getTheme, setTheme, type ThemeName } from '../config/token.js';

const themeNames = Object.keys(themes) as ThemeName[];

export function ThemeSelector() {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const current = getTheme();
    return themeNames.indexOf(current);
  });

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
      return;
    }

    if (key.downArrow || input === 'j') {
      setSelectedIndex(i => Math.min(i + 1, themeNames.length - 1));
    }
    if (key.upArrow || input === 'k') {
      setSelectedIndex(i => Math.max(i - 1, 0));
    }

    if (key.return) {
      const themeName = themeNames[selectedIndex];
      setTheme(themeName);
      console.log(`\n✓ Theme set to: ${themeName}`);
      exit();
    }
  });

  const currentTheme = getTheme();

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>Select Theme</Text>
        <Text color="gray"> (↑↓:Navigate  Enter:Select  q:Cancel)</Text>
      </Box>

      {themeNames.map((name, idx) => {
        const selected = idx === selectedIndex;
        const isCurrent = name === currentTheme;
        const t = themes[name];

        return (
          <Box key={name} flexDirection="column">
            <Box>
              <Text color={selected ? 'cyan' : 'white'} bold={selected}>
                {selected ? '▶ ' : '  '}
                {name}
                {isCurrent ? ' (current)' : ''}
              </Text>
            </Box>
            {selected && (
              <Box paddingLeft={4} flexDirection="column">
                <Box>
                  <Text color={t.primary}>████</Text>
                  <Text color={t.secondary}> ████</Text>
                  <Text color={t.accent}> ████</Text>
                  <Text color={t.textDim}> ████</Text>
                </Box>
                <Text color="gray" dimColor>
                  Primary: {t.primary}, Secondary: {t.secondary}, Accent: {t.accent}
                </Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
