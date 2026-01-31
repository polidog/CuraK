import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import { execFile } from 'child_process';
import type { Article } from '../types/article.js';
import { getToken, getThemeColors, themes, setTheme, getTheme, type ThemeName } from '../config/token.js';
import { initClient, getClient } from '../api/client.js';
import { fetchReadableContent, type ReaderContent } from '../services/reader.js';
import Spinner from 'ink-spinner';

declare const __APP_VERSION__: string;
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

const openInBrowser = (url: string) => {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  execFile(cmd, [url]);
};

const getClipboardText = (): Promise<string> => {
  return new Promise((resolve) => {
    const platform = process.platform;
    let cmd: string;
    let args: string[];

    if (platform === 'darwin') {
      cmd = 'pbpaste';
      args = [];
    } else if (platform === 'win32') {
      cmd = 'powershell';
      args = ['-command', 'Get-Clipboard'];
    } else {
      // Linux - use xclip
      cmd = 'xclip';
      args = ['-selection', 'clipboard', '-o'];
    }

    execFile(cmd, args, (error, stdout) => {
      if (error) {
        resolve('');
        return;
      }
      resolve(stdout.trim());
    });
  });
};

// ASCII Logo with rounded border
const LOGO_LABEL = `CuraK v${APP_VERSION}`;
const LOGO_CONTENT = [
  ' ██████╗██╗   ██╗██████╗  █████╗ ██╗  ██╗',
  '██╔════╝██║   ██║██╔══██╗██╔══██╗██║ ██╔╝',
  '██║     ██║   ██║██████╔╝███████║█████╔╝ ',
  '╚██████╗╚██████╔╝██║  ██║██║  ██║██║  ██╗',
  ' ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝',
];
const LOGO_WIDTH = 41;
const BOX_PADDING_X = 2; // horizontal padding
const BOX_PADDING_Y = 2; // vertical padding (empty lines)
const BOX_INNER_WIDTH = LOGO_WIDTH + BOX_PADDING_X * 2;

// Build bordered logo
const buildBorderedLogo = () => {
  const topLine = `╭─ ${LOGO_LABEL} ${'─'.repeat(BOX_INNER_WIDTH - LOGO_LABEL.length - 3)}╮`;
  const bottomLine = `╰${'─'.repeat(BOX_INNER_WIDTH)}╯`;
  const padX = ' '.repeat(BOX_PADDING_X);
  const emptyLine = `│${' '.repeat(BOX_INNER_WIDTH)}│`;

  const paddingLines = Array(BOX_PADDING_Y).fill(emptyLine);

  return [
    topLine,
    ...paddingLines,
    ...LOGO_CONTENT.map(line => `│${padX}${line}${padX}│`),
    ...paddingLines,
    bottomLine,
  ];
};

const LOGO = buildBorderedLogo();

// Helper to build bordered text lines (same style as logo)
const buildBorderedLines = (
  lines: string[],
  label: string,
  width: number,
  padding: number = 1
): string[] => {
  const innerWidth = width - 2;
  const topLine = `╭─ ${label} ${'─'.repeat(Math.max(0, innerWidth - label.length - 3))}╮`;
  const bottomLine = `╰${'─'.repeat(innerWidth)}╯`;
  const pad = ' '.repeat(padding);

  return [
    topLine,
    ...lines.map(line => {
      const content = pad + line;
      const paddedContent = content.padEnd(innerWidth, ' ');
      return `│${paddedContent}│`;
    }),
    bottomLine,
  ];
};

// Calculate display width (full-width chars = 2, others = 1)
const getDisplayWidth = (str: string): number => {
  let width = 0;
  for (const char of str) {
    const code = char.codePointAt(0) || 0;
    // Zero-width characters (variation selectors, combining marks, etc.)
    if ((code >= 0xFE00 && code <= 0xFE0F) ||   // Variation Selectors
        (code >= 0x200B && code <= 0x200F) ||   // Zero-width spaces
        (code >= 0x2028 && code <= 0x202F) ||   // Line/paragraph separators
        (code >= 0x2060 && code <= 0x206F)) {   // Word joiner, etc.
      width += 0;
    // Emoji ranges (most common)
    } else if ((code >= 0x1F300 && code <= 0x1F9FF) ||  // Misc Symbols, Emoticons, etc.
        (code >= 0x2600 && code <= 0x26FF) ||    // Misc Symbols
        (code >= 0x2700 && code <= 0x27BF) ||    // Dingbats
        (code >= 0x23E9 && code <= 0x23FF) ||    // Misc technical symbols (⏱ etc.)
        (code >= 0x1F600 && code <= 0x1F64F) ||  // Emoticons
        (code >= 0x1F680 && code <= 0x1F6FF) ||  // Transport symbols
        // CJK and full-width characters
        (code >= 0x1100 && code <= 0x11FF) ||
        (code >= 0x3000 && code <= 0x9FFF) ||
        (code >= 0xAC00 && code <= 0xD7AF) ||
        (code >= 0xF900 && code <= 0xFAFF) ||
        (code >= 0xFE10 && code <= 0xFE1F) ||
        (code >= 0xFE30 && code <= 0xFE6F) ||
        (code >= 0xFF00 && code <= 0xFF60) ||
        (code >= 0xFFE0 && code <= 0xFFE6)) {
      width += 2;
    } else if (code > 0xFFFF) {
      // Surrogate pair (astral plane) - likely emoji, count as 2
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
};

// Truncate string to fit display width
const truncateToWidth = (str: string, maxWidth: number): string => {
  let width = 0;
  let result = '';
  for (const char of str) {
    const charWidth = getDisplayWidth(char);
    if (width + charWidth > maxWidth) {
      break;
    }
    result += char;
    width += charWidth;
  }
  return result;
};

// Pad string to exact display width
const padToWidth = (str: string, targetWidth: number): string => {
  const currentWidth = getDisplayWidth(str);
  const padding = targetWidth - currentWidth;
  return str + ' '.repeat(Math.max(0, padding));
};

// Process text content into wrapped lines
// Process text content into wrapped and padded lines (pre-computed for performance)
const processTextContent = (text: string, maxWidth: number): string[] => {
  const rawLines = text.split('\n');
  const processedLines: string[] = [];

  for (const line of rawLines) {
    if (line.length === 0) {
      // Pre-pad empty lines
      processedLines.push(' '.repeat(maxWidth));
      continue;
    }

    let remaining = line;
    while (remaining.length > 0) {
      const truncated = truncateToWidth(remaining, maxWidth);
      // Pre-pad the line to fixed width
      processedLines.push(padToWidth(truncated, maxWidth));

      // Remove processed characters
      let usedChars = 0;
      let usedWidth = 0;
      for (const char of remaining) {
        const charWidth = getDisplayWidth(char);
        if (usedWidth + charWidth > maxWidth) break;
        usedChars++;
        usedWidth += charWidth;
      }
      remaining = remaining.slice(usedChars);
    }
  }

  return processedLines;
};

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentTheme, setCurrentTheme] = useState<ThemeName>(getTheme());
  const theme = themes[currentTheme];
  const [articles, setArticles] = useState<Article[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [readerContent, setReaderContent] = useState<ReaderContent | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerScroll, setReaderScroll] = useState(0);

  // Theme selector modal state
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeIndex, setThemeIndex] = useState(() => {
    const themeNames = Object.keys(themes) as ThemeName[];
    return themeNames.indexOf(currentTheme);
  });
  const themeNames = Object.keys(themes) as ThemeName[];

  // Mark as read loading state
  const [markingArticleId, setMarkingArticleId] = useState<string | null>(null);

  // Add article modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [addStatus, setAddStatus] = useState<'input' | 'submitting' | 'success' | 'error'>('input');
  const [addError, setAddError] = useState<string | null>(null);

  const termWidth = stdout?.columns || 80;
  const termHeight = stdout?.rows || 24;

  // Colors from theme
  const primary = theme.primary;
  const textColor = theme.text;
  const textDim = theme.textDim;
  const accent = theme.accent;
  const logoColor = theme.logo;
  const boxBorder = theme.boxBorder;
  const titleColor = theme.title;
  const urlColor = theme.url;
  const tagsColor = theme.tags;
  const helpColor = theme.help;
  const statsColor = theme.stats;
  const spinnerColor = theme.spinner;
  const errorColor = theme.error;
  const successColor = theme.success;

  // Layout - use full terminal width
  const contentWidth = termWidth - 2;
  const listHeight = Math.min(termHeight - 14, 20);

  // Stats
  const totalReadingTime = articles.reduce((sum, a) => sum + (a.reading_time_minutes || 0), 0);

  useEffect(() => {
    const token = getToken();
    if (token) {
      initClient(token);
    }
    loadArticles();
  }, []);

  const loadArticles = async () => {
    const client = getClient();
    if (!client) {
      setError('No API client');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await client.getArticles(1, 100);
      setArticles(response.articles || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const loadReaderContent = async (url: string) => {
    setReaderLoading(true);
    setShowModal(true);
    setReaderScroll(0);
    try {
      const content = await fetchReadableContent(url);
      setReaderContent(content);
    } catch (e) {
      setReaderContent(null);
    } finally {
      setReaderLoading(false);
    }
  };

  const markAsRead = async (articleId: string) => {
    const client = getClient();
    if (!client) return;
    setMarkingArticleId(articleId);
    try {
      await client.markAsRead(articleId);
      setArticles(prev => prev.filter(a => a.id !== articleId));
      setSelectedIndex(i => Math.min(i, Math.max(0, articles.length - 2)));
    } catch (e) {
      // Ignore errors
    } finally {
      setMarkingArticleId(null);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAddArticle = async () => {
    const trimmedUrl = addUrl.trim();
    if (!trimmedUrl) {
      setAddError('URL is required');
      setAddStatus('error');
      return;
    }
    if (!isValidUrl(trimmedUrl)) {
      setAddError('Invalid URL format');
      setAddStatus('error');
      return;
    }

    const client = getClient();
    if (!client) {
      setAddError('No API client');
      setAddStatus('error');
      return;
    }

    setAddStatus('submitting');
    setAddError(null);
    try {
      await client.createArticle(trimmedUrl);
      setAddStatus('success');
      setTimeout(() => {
        setShowAddModal(false);
        setAddUrl('');
        setAddStatus('input');
        setAddError(null);
        loadArticles();
      }, 1000);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add article');
      setAddStatus('error');
    }
  };

  useInput((input, key) => {
    // Add article modal controls
    if (showAddModal) {
      if (key.escape) {
        setShowAddModal(false);
        setAddUrl('');
        setAddStatus('input');
        setAddError(null);
        return;
      }
      // Don't process other keys here - TextInput handles them
      return;
    }

    // Theme modal controls
    if (showThemeModal) {
      if (input === 'q' || key.escape) {
        setShowThemeModal(false);
        return;
      }
      if (key.downArrow || input === 'j') {
        setThemeIndex(i => Math.min(i + 1, themeNames.length - 1));
        return;
      }
      if (key.upArrow || input === 'k') {
        setThemeIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (key.return) {
        const selectedTheme = themeNames[themeIndex];
        setTheme(selectedTheme);
        setCurrentTheme(selectedTheme);
        setShowThemeModal(false);
        return;
      }
      return;
    }

    if (input === 'q') {
      if (showModal) {
        setShowModal(false);
        setReaderContent(null);
      } else {
        exit();
      }
      return;
    }

    if (key.escape) {
      if (showModal) {
        setShowModal(false);
        setReaderContent(null);
      }
      return;
    }

    // Open theme selector with Shift+T
    if (input === 'T' && !showModal) {
      setThemeIndex(themeNames.indexOf(currentTheme));
      setShowThemeModal(true);
      return;
    }

    if (input === 'R' && !showModal) {
      loadArticles();
      return;
    }

    if (input === 'o') {
      const articleUrl = articles[selectedIndex]?.url;
      if (articleUrl) {
        openInBrowser(articleUrl);
      }
      return;
    }

    if (input === 'm' && !showModal) {
      const article = articles[selectedIndex];
      if (article?.id) {
        markAsRead(article.id);
      }
      return;
    }

    // Open add article modal
    if (input === 'a' && !showModal) {
      setShowAddModal(true);
      setAddStatus('input');
      setAddError(null);
      // Try to get URL from clipboard
      getClipboardText().then((text) => {
        if (isValidUrl(text)) {
          setAddUrl(text);
        } else {
          setAddUrl('');
        }
      });
      return;
    }

    if (key.return && !showModal) {
      const article = articles[selectedIndex];
      if (article?.url) {
        loadReaderContent(article.url);
      }
      return;
    }

    if (key.downArrow || input === 'j') {
      if (showModal && readerContent) {
        // Estimate max scroll (lines may wrap due to full-width chars, so use generous estimate)
        const rawLines = readerContent.textContent.split('\n');
        const estimatedLines = rawLines.length * 3; // Conservative estimate for wrapped lines
        const contentHeight = termHeight - LOGO.length - 8;
        const maxScroll = Math.max(0, estimatedLines - contentHeight);
        setReaderScroll(s => Math.min(s + 3, maxScroll));
      } else if (!showModal) {
        setSelectedIndex(i => Math.min(i + 1, articles.length - 1));
      }
    }

    if (key.upArrow || input === 'k') {
      if (showModal && readerContent) {
        setReaderScroll(s => Math.max(s - 3, 0));
      } else if (!showModal) {
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
    }

    if (showModal && readerContent) {
      if (key.pageDown || input === ' ') {
        const rawLines = readerContent.textContent.split('\n');
        const estimatedLines = rawLines.length * 3;
        const contentHeight = termHeight - LOGO.length - 8;
        const maxScroll = Math.max(0, estimatedLines - contentHeight);
        setReaderScroll(s => Math.min(s + 15, maxScroll));
      }
      if (key.pageUp) {
        setReaderScroll(s => Math.max(s - 15, 0));
      }
    }
  });

  const selectedArticle = articles[selectedIndex];

  // Build article detail panel (same height as logo)
  const buildDetailPanel = () => {
    const logoTotalWidth = BOX_INNER_WIDTH + 2; // including borders
    const panelWidth = Math.max(30, termWidth - logoTotalWidth - 3);
    const panelInnerWidth = panelWidth - 2;
    const logoHeight = LOGO.length;

    const truncateToWidth = (str: string, maxWidth: number): string => {
      let width = 0;
      let result = '';
      for (const char of str) {
        const charWidth = getDisplayWidth(char);
        if (width + charWidth > maxWidth - 3) {
          return result + '...';
        }
        result += char;
        width += charWidth;
      }
      return result;
    };

    const padToWidth = (str: string, targetWidth: number): string => {
      const currentWidth = getDisplayWidth(str);
      const padding = targetWidth - currentWidth;
      return str + ' '.repeat(Math.max(0, padding));
    };

    const lines: { text: string; color: string }[] = [];

    if (selectedArticle) {
      // Title
      const title = truncateToWidth(selectedArticle.title || 'Untitled', panelInnerWidth - 2);
      lines.push({ text: ` ${title}`, color: titleColor });

      // URL
      if (selectedArticle.url) {
        const url = truncateToWidth(selectedArticle.url, panelInnerWidth - 2);
        lines.push({ text: ` ${url}`, color: urlColor });
      }

      // Tags
      if (selectedArticle.tags?.length) {
        const tags = selectedArticle.tags.slice(0, 5).map(t => `#${t}`).join(' ');
        const tagsLine = truncateToWidth(tags, panelInnerWidth - 2);
        lines.push({ text: ` ${tagsLine}`, color: tagsColor });
      }

      // Reading time
      if (selectedArticle.reading_time_minutes) {
        lines.push({ text: ` ${selectedArticle.reading_time_minutes} min read`, color: textDim });
      }

      // Summary if available
      if (selectedArticle.summary) {
        lines.push({ text: '', color: textDim });
        const summaryLines = selectedArticle.summary.split('\n');
        for (const sLine of summaryLines) {
          if (lines.length >= logoHeight - 2) break;
          const truncated = truncateToWidth(sLine, panelInnerWidth - 2);
          lines.push({ text: ` ${truncated}`, color: textColor });
        }
      }
    } else {
      lines.push({ text: ' No article selected', color: textDim });
    }

    // Pad to match logo height (minus top and bottom border)
    const contentHeight = logoHeight - 2;
    while (lines.length < contentHeight) {
      lines.push({ text: '', color: textDim });
    }

    const topLine = `╭─ Detail ${'─'.repeat(Math.max(0, panelInnerWidth - 9))}╮`;
    const bottomLine = `╰${'─'.repeat(panelInnerWidth)}╯`;

    return {
      topLine,
      bottomLine,
      contentLines: lines.map(l => ({
        content: padToWidth(l.text, panelInnerWidth),
        color: l.color
      })),
      panelWidth
    };
  };

  const detailPanel = buildDetailPanel();

  // Header component for reuse
  const renderHeader = () => {
    return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        <Box flexDirection="column">
          {/* Full logo */}
          {LOGO.map((line, i) => (
            <Text key={i} color={logoColor}>{line}</Text>
          ))}
        </Box>
        <Text> </Text>
        <Box flexDirection="column">
          <Text color={boxBorder}>{detailPanel.topLine}</Text>
          {detailPanel.contentLines.map((line, i) => (
            <Text key={i}>
              <Text color={boxBorder}>│</Text>
              <Text color={line.color}>{line.content}</Text>
              <Text color={boxBorder}>│</Text>
            </Text>
          ))}
          <Text color={boxBorder}>{detailPanel.bottomLine}</Text>
        </Box>
      </Box>
      {/* Stats line - separate from boxes */}
      <Box marginTop={0} marginBottom={1}>
        <Text color={accent} bold> ● </Text>
        <Text color={accent} bold>{articles.length} unread</Text>
        <Text color={textDim}>  |  </Text>
        <Text color={accent} bold>~{totalReadingTime} min</Text>
        <Text color={textDim}> total reading time</Text>
      </Box>
    </Box>
  );
  };

  // Memoize processed lines for reader modal (expensive operation)
  // Must be before any conditional returns to follow Rules of Hooks
  const readerWidth = termWidth - 2;
  const boxInnerWidth = readerWidth - 2;
  const processedReaderLines = useMemo(() => {
    if (!readerContent) return [];
    return processTextContent(readerContent.textContent, boxInnerWidth);
  }, [readerContent, boxInnerWidth]);

  // Loading screen
  if (loading) {
    return (
      <Box flexDirection="column">
        {LOGO.map((line, i) => (
          <Text key={i} color={logoColor}>{line}</Text>
        ))}
        <Text> </Text>
        <Text color={spinnerColor}>Loading...</Text>
      </Box>
    );
  }

  // Error screen
  if (error) {
    return (
      <Box flexDirection="column">
        {LOGO.map((line, i) => (
          <Text key={i} color={logoColor}>{line}</Text>
        ))}
        <Text> </Text>
        <Text color={errorColor}>Error: {error}</Text>
        <Text color={helpColor}>^R: Retry  q: Quit</Text>
      </Box>
    );
  }

  // Theme selector modal
  if (showThemeModal) {
    const modalWidth = 40;
    const modalInnerWidth = modalWidth - 2;
    const topLine = `╭─ Theme ${'─'.repeat(modalInnerWidth - 8)}╮`;
    const bottomLine = `╰${'─'.repeat(modalInnerWidth)}╯`;

    return (
      <Box flexDirection="column">
        {renderHeader()}
        <Box flexDirection="column">
          <Text color={boxBorder}>{topLine}</Text>
          {themeNames.map((name, idx) => {
            const selected = idx === themeIndex;
            const isCurrent = name === currentTheme;
            const t = themes[name];
            const marker = selected ? '>' : ' ';
            const label = `${marker} ${name}${isCurrent ? ' (current)' : ''}`;
            const paddedLabel = label.padEnd(modalInnerWidth, ' ');

            return (
              <Box key={name} flexDirection="column">
                <Text>
                  <Text color={boxBorder}>│</Text>
                  <Text color={selected ? primary : textDim} bold={selected}>{paddedLabel}</Text>
                  <Text color={boxBorder}>│</Text>
                </Text>
                {selected && (
                  <Text>
                    <Text color={boxBorder}>│</Text>
                    <Text>  </Text>
                    <Text color={t.primary}>████</Text>
                    <Text> </Text>
                    <Text color={t.secondary}>████</Text>
                    <Text> </Text>
                    <Text color={t.accent}>████</Text>
                    <Text> </Text>
                    <Text color={t.textDim}>████</Text>
                    <Text>{''.padEnd(modalInnerWidth - 21, ' ')}</Text>
                    <Text color={boxBorder}>│</Text>
                  </Text>
                )}
              </Box>
            );
          })}
          <Text color={boxBorder}>{bottomLine}</Text>
        </Box>
        <Text color={helpColor}>j/k:Select  Enter:Apply  q:Cancel</Text>
      </Box>
    );
  }

  // Add article modal
  if (showAddModal) {
    const modalWidth = 52;
    const modalInnerWidth = modalWidth - 2;
    const topLine = `╭─ Add Article ${'─'.repeat(modalInnerWidth - 14)}╮`;
    const bottomLine = `╰${'─'.repeat(modalInnerWidth)}╯`;
    const emptyLine = `│${' '.repeat(modalInnerWidth)}│`;

    return (
      <Box flexDirection="column">
        {renderHeader()}
        <Box flexDirection="column">
          <Text color={boxBorder}>{topLine}</Text>
          <Text color={boxBorder}>{emptyLine}</Text>
          {addStatus === 'submitting' ? (
            <>
              <Text>
                <Text color={boxBorder}>│</Text>
                <Text color={spinnerColor}> <Spinner type="dots" /> Adding article...</Text>
                <Text>{' '.repeat(Math.max(0, modalInnerWidth - 21))}</Text>
                <Text color={boxBorder}>│</Text>
              </Text>
            </>
          ) : addStatus === 'success' ? (
            <>
              <Text>
                <Text color={boxBorder}>│</Text>
                <Text color={successColor}> ✓ Article added successfully!</Text>
                <Text>{' '.repeat(Math.max(0, modalInnerWidth - 30))}</Text>
                <Text color={boxBorder}>│</Text>
              </Text>
            </>
          ) : (
            <>
              <Text>
                <Text color={boxBorder}>│</Text>
                <Text color={textColor}> Enter article URL:</Text>
                <Text>{' '.repeat(Math.max(0, modalInnerWidth - 19))}</Text>
                <Text color={boxBorder}>│</Text>
              </Text>
              <Text>
                <Text color={boxBorder}>│</Text>
                <Text color={textColor}> </Text>
                <TextInput
                  value={addUrl}
                  onChange={setAddUrl}
                  onSubmit={handleAddArticle}
                  placeholder="https://..."
                />
              </Text>
              {addError && (
                <Text>
                  <Text color={boxBorder}>│</Text>
                  <Text color={errorColor}> {addError}</Text>
                  <Text>{' '.repeat(Math.max(0, modalInnerWidth - addError.length - 2))}</Text>
                  <Text color={boxBorder}>│</Text>
                </Text>
              )}
            </>
          )}
          <Text color={boxBorder}>{emptyLine}</Text>
          <Text color={boxBorder}>{bottomLine}</Text>
        </Box>
        <Text color={helpColor}>Enter:Submit  Esc:Cancel</Text>
      </Box>
    );
  }

  // Modal view
  if (showModal) {
    const readerHeight = termHeight - LOGO.length - 6;

    if (readerLoading) {
      return (
        <Box flexDirection="column">
          {renderHeader()}
          <Text color={spinnerColor}>Loading article...</Text>
        </Box>
      );
    }

    if (!readerContent) {
      return (
        <Box flexDirection="column">
          {renderHeader()}
          <Text color={errorColor}>Failed to load article</Text>
          <Text color={helpColor}>Press Esc to go back</Text>
        </Box>
      );
    }

    const textLines = processedReaderLines;
    const contentHeight = readerHeight - 2; // minus top and bottom border
    const visibleLines = textLines.slice(readerScroll, readerScroll + contentHeight);
    const totalLines = textLines.length;
    const scrollInfo = totalLines > contentHeight
      ? `[${readerScroll + 1}-${Math.min(readerScroll + contentHeight, totalLines)}/${totalLines}]`
      : '';

    const readerTopLine = `╭─ Reader ${scrollInfo} ${'─'.repeat(Math.max(0, boxInnerWidth - 10 - scrollInfo.length))}╮`;
    const readerBottomLine = `╰${'─'.repeat(boxInnerWidth)}╯`;

    // Lines are already padded in processTextContent, just fill remaining height
    const emptyLine = ' '.repeat(boxInnerWidth);
    const paddedLines = [...visibleLines];
    while (paddedLines.length < contentHeight) {
      paddedLines.push(emptyLine);
    }

    return (
      <Box flexDirection="column">
        {/* Header */}
        {renderHeader()}

        {/* Content Box */}
        <Text color={boxBorder}>{readerTopLine}</Text>
        {paddedLines.map((line, i) => (
          <Text key={i}>
            <Text color={boxBorder}>│</Text>
            <Text color={textColor}>{line}</Text>
            <Text color={boxBorder}>│</Text>
          </Text>
        ))}
        <Text color={boxBorder}>{readerBottomLine}</Text>

        {/* Footer */}
        <Text color={helpColor}>
          j/k:Scroll  Space:Page  o:Open  Esc:Back
        </Text>
      </Box>
    );
  }

  // Calculate scroll window for articles
  const startIdx = Math.max(0, Math.min(
    selectedIndex - Math.floor(listHeight / 2),
    articles.length - listHeight
  ));
  const visibleArticles = articles.slice(startIdx, startIdx + listHeight);

  return (
    <Box flexDirection="column">
      {/* Header: Logo + Detail Panel */}
      {renderHeader()}

      {/* Article List */}
      {(() => {
        const boxInnerWidth = contentWidth - 2;
        const titleMaxWidth = boxInnerWidth - 5; // "│ ► " + title + " │"
        const articleLines: { text: string; color: string; bold?: boolean }[] = [];

        // Truncate string to fit display width (with ellipsis)
        const truncateWithEllipsis = (str: string, maxWidth: number): string => {
          let width = 0;
          let result = '';
          for (const char of str) {
            const charWidth = getDisplayWidth(char);
            if (width + charWidth > maxWidth - 3) {
              return result + '...';
            }
            result += char;
            width += charWidth;
          }
          return result;
        };

        if (visibleArticles.length === 0) {
          articleLines.push({ text: padToWidth(' No articles', boxInnerWidth), color: textDim, isMarking: false, articleId: '' });
        } else {
          visibleArticles.forEach((article, i) => {
            const idx = startIdx + i;
            const selected = idx === selectedIndex;
            const isMarking = article.id === markingArticleId;
            const fullTitle = article.title || 'Untitled';
            const marker = selected ? '>' : ' ';
            // For marking items, leave space for spinner (2 chars) + space
            const titleWidth = isMarking ? boxInnerWidth - 18 : boxInnerWidth - 3;
            const title = truncateWithEllipsis(fullTitle, titleWidth);
            const line = isMarking
              ? padToWidth(title, titleWidth)
              : padToWidth(` ${marker} ${title}`, boxInnerWidth);

            const itemColor = isMarking
              ? 'black'
              : selected
                ? (theme.listItemSelected || primary)
                : (theme.listItem || textDim);
            articleLines.push({
              text: line,
              color: itemColor,
              bold: selected,
              isMarking,
              articleId: article.id || ''
            });
          });
        }

        const topLine = `╭─ Articles ${'─'.repeat(Math.max(0, boxInnerWidth - 11))}╮`;
        const bottomLine = `╰${'─'.repeat(boxInnerWidth)}╯`;

        return (
          <Box flexDirection="column">
            <Text color={boxBorder}>{topLine}</Text>
            {articleLines.map((line, i) => (
              <Box key={i}>
                <Text color={boxBorder}>│</Text>
                {line.isMarking ? (
                  <Text backgroundColor={accent} color="black">
                    {' '}<Spinner type="dots" />{' '}✓ Marking done...{' '}{line.text}
                  </Text>
                ) : (
                  <Text color={line.color} bold={line.bold}>{line.text}</Text>
                )}
                <Text color={boxBorder}>│</Text>
              </Box>
            ))}
            <Text color={boxBorder}>{bottomLine}</Text>
          </Box>
        );
      })()}

      {/* Footer */}
      <Box marginTop={1}>
        <Text color={helpColor}>
          j/k:Navigate  Enter:Read  a:Add  m:Done  o:Open  T:Theme  ^R:Refresh  q:Quit
        </Text>
      </Box>
    </Box>
  );
}
