import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { execFile } from 'child_process';
import type { Article } from '../types/article.js';
import { getToken, getThemeColors, themes, setTheme, getTheme, type ThemeName } from '../config/token.js';
import { initClient, getClient } from '../api/client.js';
import { fetchReadableContent, type ReaderContent } from '../services/reader.js';
import Spinner from 'ink-spinner';

const openInBrowser = (url: string) => {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  execFile(cmd, [url]);
};

// ASCII Logo with rounded border
const LOGO_LABEL = 'CuraQ cli client';
const LOGO_CONTENT = [
  ' ██████╗██╗   ██╗██████╗  █████╗ ██╗  ██╗',
  '██╔════╝██║   ██║██╔══██╗██╔══██╗██║ ██╔╝',
  '██║     ██║   ██║██████╔╝███████║█████╔╝ ',
  '╚██████╗╚██████╔╝██║  ██║██║  ██║██║  ██╗',
  ' ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝',
];
const LOGO_WIDTH = 41;
const BOX_PADDING_X = 2; // horizontal padding
const BOX_PADDING_Y = 1; // vertical padding (empty lines)
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
  const topLine = `╭─ ${label} ${'─'.repeat(Math.max(0, innerWidth - label.length - 4))}╮`;
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

  const termWidth = stdout?.columns || 80;
  const termHeight = stdout?.rows || 24;

  // Colors from theme
  const primary = theme.primary;
  const textColor = theme.text;
  const textDim = theme.textDim;
  const accent = theme.accent;

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
    try {
      await client.markAsRead(articleId);
      setArticles(prev => prev.filter(a => a.id !== articleId));
      setSelectedIndex(i => Math.min(i, Math.max(0, articles.length - 2)));
    } catch (e) {
      // Ignore errors
    }
  };

  useInput((input, key) => {
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

    if (input === 'r' && key.ctrl && !showModal) {
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

    if (key.return && !showModal) {
      const article = articles[selectedIndex];
      if (article?.url) {
        loadReaderContent(article.url);
      }
      return;
    }

    if (key.downArrow || input === 'j') {
      if (showModal && readerContent) {
        const lines = readerContent.textContent.split('\n');
        const maxScroll = Math.max(0, lines.length - 10);
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
        const lines = readerContent.textContent.split('\n');
        const maxScroll = Math.max(0, lines.length - 10);
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

    // Calculate display width (full-width chars = 2, others = 1)
    const getDisplayWidth = (str: string): number => {
      let width = 0;
      for (const char of str) {
        const code = char.charCodeAt(0);
        if ((code >= 0x1100 && code <= 0x11FF) ||
            (code >= 0x3000 && code <= 0x9FFF) ||
            (code >= 0xAC00 && code <= 0xD7AF) ||
            (code >= 0xF900 && code <= 0xFAFF) ||
            (code >= 0xFE10 && code <= 0xFE1F) ||
            (code >= 0xFE30 && code <= 0xFE6F) ||
            (code >= 0xFF00 && code <= 0xFF60) ||
            (code >= 0xFFE0 && code <= 0xFFE6)) {
          width += 2;
        } else {
          width += 1;
        }
      }
      return width;
    };

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
      lines.push({ text: ` ${title}`, color: primary });

      // URL
      if (selectedArticle.url) {
        const url = truncateToWidth(selectedArticle.url, panelInnerWidth - 2);
        lines.push({ text: ` ${url}`, color: textDim });
      }

      // Tags
      if (selectedArticle.tags?.length) {
        const tags = selectedArticle.tags.slice(0, 5).map(t => `#${t}`).join(' ');
        const tagsLine = truncateToWidth(tags, panelInnerWidth - 2);
        lines.push({ text: ` ${tagsLine}`, color: accent });
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
  const renderHeader = () => (
    <Box flexDirection="row" marginBottom={1}>
      <Box flexDirection="column">
        {LOGO.map((line, i) => (
          <Text key={i} color={primary}>{line}</Text>
        ))}
      </Box>
      <Text> </Text>
      <Box flexDirection="column">
        <Text color={primary}>{detailPanel.topLine}</Text>
        {detailPanel.contentLines.map((line, i) => (
          <Text key={i}>
            <Text color={primary}>│</Text>
            <Text color={line.color}>{line.content}</Text>
            <Text color={primary}>│</Text>
          </Text>
        ))}
        <Text color={primary}>{detailPanel.bottomLine}</Text>
      </Box>
    </Box>
  );

  // Loading screen
  if (loading) {
    return (
      <Box flexDirection="column">
        {LOGO.map((line, i) => (
          <Text key={i} color={primary}>{line}</Text>
        ))}
        <Text> </Text>
        <Text color={textDim}>Loading...</Text>
      </Box>
    );
  }

  // Error screen
  if (error) {
    return (
      <Box flexDirection="column">
        {LOGO.map((line, i) => (
          <Text key={i} color={primary}>{line}</Text>
        ))}
        <Text> </Text>
        <Text color="red">Error: {error}</Text>
        <Text color={textDim}>^R: Retry  q: Quit</Text>
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
          <Text color={primary}>{topLine}</Text>
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
                  <Text color={primary}>│</Text>
                  <Text color={selected ? primary : textDim} bold={selected}>{paddedLabel}</Text>
                  <Text color={primary}>│</Text>
                </Text>
                {selected && (
                  <Text>
                    <Text color={primary}>│</Text>
                    <Text>  </Text>
                    <Text color={t.primary}>████</Text>
                    <Text> </Text>
                    <Text color={t.secondary}>████</Text>
                    <Text> </Text>
                    <Text color={t.accent}>████</Text>
                    <Text> </Text>
                    <Text color={t.textDim}>████</Text>
                    <Text>{''.padEnd(modalInnerWidth - 24, ' ')}</Text>
                    <Text color={primary}>│</Text>
                  </Text>
                )}
              </Box>
            );
          })}
          <Text color={primary}>{bottomLine}</Text>
        </Box>
        <Text color={textDim}>j/k:Select  Enter:Apply  q:Cancel</Text>
      </Box>
    );
  }

  // Modal view
  if (showModal) {
    const readerWidth = termWidth - 2;
    const readerHeight = termHeight - LOGO.length - 6;

    if (readerLoading) {
      return (
        <Box flexDirection="column">
          {renderHeader()}
          <Text color={textColor}>Loading article...</Text>
        </Box>
      );
    }

    if (!readerContent) {
      return (
        <Box flexDirection="column">
          {renderHeader()}
          <Text color="red">Failed to load article</Text>
          <Text color={textDim}>Press Esc to go back</Text>
        </Box>
      );
    }

    const textLines = readerContent.textContent.split('\n');
    const contentHeight = readerHeight - 2; // minus top and bottom border
    const visibleLines = textLines.slice(readerScroll, readerScroll + contentHeight);
    const totalLines = textLines.length;
    const scrollInfo = totalLines > contentHeight
      ? `[${readerScroll + 1}-${Math.min(readerScroll + contentHeight, totalLines)}/${totalLines}]`
      : '';

    const boxInnerWidth = readerWidth - 2;
    const readerTopLine = `╭─ Reader ${scrollInfo} ${'─'.repeat(Math.max(0, boxInnerWidth - 10 - scrollInfo.length))}╮`;
    const readerBottomLine = `╰${'─'.repeat(boxInnerWidth)}╯`;

    // Pad content lines to fixed width
    const paddedLines = visibleLines.map(line => {
      const truncated = line.slice(0, boxInnerWidth - 2);
      return truncated.padEnd(boxInnerWidth, ' ');
    });

    // Fill remaining height with empty lines
    while (paddedLines.length < contentHeight) {
      paddedLines.push(' '.repeat(boxInnerWidth));
    }

    return (
      <Box flexDirection="column">
        {/* Header */}
        {renderHeader()}

        {/* Content Box */}
        <Text color={primary}>{readerTopLine}</Text>
        {paddedLines.map((line, i) => (
          <Text key={i}>
            <Text color={primary}>│</Text>
            <Text color={textColor}>{line}</Text>
            <Text color={primary}>│</Text>
          </Text>
        ))}
        <Text color={primary}>{readerBottomLine}</Text>

        {/* Footer */}
        <Text color={textDim}>
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

  const statsText = `${articles.length} articles  ~${totalReadingTime}min`;

  return (
    <Box flexDirection="column">
      {/* Header: Logo + Detail Panel */}
      {renderHeader()}

      {/* Stats */}
      <Text color={textDim}>{statsText}</Text>

      {/* Article List */}
      {(() => {
        const boxInnerWidth = contentWidth - 2;
        const titleMaxWidth = boxInnerWidth - 5; // "│ ► " + title + " │"
        const articleLines: { text: string; color: string; bold?: boolean }[] = [];

        // Calculate display width (full-width chars = 2, others = 1)
        const getDisplayWidth = (str: string): number => {
          let width = 0;
          for (const char of str) {
            const code = char.charCodeAt(0);
            // CJK and full-width characters
            if ((code >= 0x1100 && code <= 0x11FF) ||
                (code >= 0x3000 && code <= 0x9FFF) ||
                (code >= 0xAC00 && code <= 0xD7AF) ||
                (code >= 0xF900 && code <= 0xFAFF) ||
                (code >= 0xFE10 && code <= 0xFE1F) ||
                (code >= 0xFE30 && code <= 0xFE6F) ||
                (code >= 0xFF00 && code <= 0xFF60) ||
                (code >= 0xFFE0 && code <= 0xFFE6)) {
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
            if (width + charWidth > maxWidth - 3) {
              return result + '...';
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

        if (visibleArticles.length === 0) {
          articleLines.push({ text: padToWidth(' No articles', boxInnerWidth), color: textDim });
        } else {
          visibleArticles.forEach((article, i) => {
            const idx = startIdx + i;
            const selected = idx === selectedIndex;
            const fullTitle = article.title || 'Untitled';
            const marker = selected ? '>' : ' ';
            // " > " = 3 chars prefix
            const title = truncateToWidth(fullTitle, boxInnerWidth - 3);
            const line = padToWidth(` ${marker} ${title}`, boxInnerWidth);

            articleLines.push({
              text: line,
              color: selected ? primary : textDim,
              bold: selected
            });
          });
        }

        const topLine = `╭─ Articles ${'─'.repeat(Math.max(0, boxInnerWidth - 12))}╮`;
        const bottomLine = `╰${'─'.repeat(boxInnerWidth)}╯`;

        return (
          <Box flexDirection="column">
            <Text color={primary}>{topLine}</Text>
            {articleLines.map((line, i) => (
              <Text key={i}>
                <Text color={primary}>│</Text>
                <Text color={line.color} bold={line.bold}>{line.text}</Text>
                <Text color={primary}>│</Text>
              </Text>
            ))}
            <Text color={primary}>{bottomLine}</Text>
          </Box>
        );
      })()}

      {/* Footer */}
      <Box marginTop={1}>
        <Text color={textDim}>
          j/k:Navigate  Enter:Read  m:Done  o:Open  T:Theme  ^R:Refresh  q:Quit
        </Text>
      </Box>
    </Box>
  );
}
