import React, { useState } from 'react';
import { Box, Text, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { setToken, getTheme, themes } from '../config/token.js';

declare const __APP_VERSION__: string;
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

const LOGO = [
  ' ██████╗██╗   ██╗██████╗  █████╗ ██╗  ██╗',
  '██╔════╝██║   ██║██╔══██╗██╔══██╗██║ ██╔╝',
  '██║     ██║   ██║██████╔╝███████║█████╔╝ ',
  '╚██████╗╚██████╔╝██║  ██║██║  ██║██║  ██╗',
  ' ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝',
];

interface TokenSetupProps {
  onComplete: (success: boolean) => void;
}

export function TokenSetup({ onComplete }: TokenSetupProps) {
  const { exit } = useApp();
  const [token, setTokenValue] = useState('');
  const [status, setStatus] = useState<'input' | 'saving' | 'done'>('input');

  const theme = themes[getTheme()];
  const logoColor = theme.logo;
  const primary = theme.primary;
  const textDim = theme.textDim;
  const successColor = theme.success;
  const boxBorder = theme.boxBorder;

  const handleSubmit = (value: string) => {
    if (!value.trim()) {
      exit();
      onComplete(false);
      return;
    }

    setStatus('saving');
    setToken(value.trim());
    setStatus('done');

    setTimeout(() => {
      onComplete(true);
      exit();
    }, 1000);
  };

  const LOGO_LABEL = `CuraK v${APP_VERSION}`;
  const LOGO_WIDTH = 41;
  const BOX_PADDING_X = 2;
  const BOX_INNER_WIDTH = LOGO_WIDTH + BOX_PADDING_X * 2;

  const topLine = `╭─ ${LOGO_LABEL} ${'─'.repeat(BOX_INNER_WIDTH - LOGO_LABEL.length - 3)}╮`;
  const bottomLine = `╰${'─'.repeat(BOX_INNER_WIDTH)}╯`;
  const padX = ' '.repeat(BOX_PADDING_X);

  return (
    <Box flexDirection="column">
      <Text color={logoColor}>{topLine}</Text>
      <Text color={logoColor}>│{' '.repeat(BOX_INNER_WIDTH)}│</Text>
      {LOGO.map((line, i) => (
        <Text key={i} color={logoColor}>│{padX}{line}{padX}│</Text>
      ))}
      <Text color={logoColor}>│{' '.repeat(BOX_INNER_WIDTH)}│</Text>
      <Text color={logoColor}>{bottomLine}</Text>

      <Box marginTop={1} marginBottom={1}>
        <Text color={primary} bold>Welcome to CuraK!</Text>
      </Box>

      <Text color={textDim}>No API token configured.</Text>
      <Text color={textDim}>Please enter your CuraQ API token to get started.</Text>

      <Box marginTop={1}>
        {status === 'input' && (
          <Box>
            <Text color={boxBorder}>Token: </Text>
            <TextInput
              value={token}
              onChange={setTokenValue}
              onSubmit={handleSubmit}
              placeholder="Enter your token..."
              mask="*"
            />
          </Box>
        )}
        {status === 'saving' && (
          <Text color={textDim}>Saving token...</Text>
        )}
        {status === 'done' && (
          <Text color={successColor}>✓ Token saved! Starting CuraK...</Text>
        )}
      </Box>

      <Box marginTop={1}>
        <Text color={textDim}>Press Enter to confirm, or Ctrl+C to cancel</Text>
      </Box>
    </Box>
  );
}
