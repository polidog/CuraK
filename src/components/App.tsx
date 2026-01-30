import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { execFile } from 'child_process';
import type { Article } from '../types/article.js';
import { getToken, getThemeColors } from '../config/token.js';
import { initClient, getClient } from '../api/client.js';
import { fetchReadableContent, type ReaderContent } from '../services/reader.js';
import Spinner from 'ink-spinner';

const openInBrowser = (url: string) => {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  execFile(cmd, [url]);
};

// ASCII Logo
const LOGO = [
  ' ██████╗██╗   ██╗██████╗  █████╗ ██╗  ██╗',
  '██╔════╝██║   ██║██╔══██╗██╔══██╗██║ ██╔╝',
  '██║     ██║   ██║██████╔╝███████║█████╔╝ ',
  '╚██████╗╚██████╔╝██║  ██║██║  ██║██║  ██╗',
  ' ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝',
];

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = getThemeColors();
  const [articles, setArticles] = useState<Article[]>([]);

  // Reader mode state
  const [readerContent, setReaderContent] = useState<ReaderContent | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [readerScroll, setReaderScroll] = useState(0);

  const termWidth = stdout?.columns || 80;
  const termHeight = stdout?.rows || 24;

  // Layout
  const headerHeight = 9; // Logo + label + border
  const mainHeight = Math.max(6, termHeight - headerHeight - 3);
  const listWidth = Math.max(26, Math.floor(termWidth * 0.38));
  const contentWidth = termWidth - listWidth - 1;
  const listVisibleCount = Math.max(3, mainHeight - 2);

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
    setShowReader(true);
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
    if (input === 'q') {
      exit();
    }

    if (key.escape || (showReader && input === 'b')) {
      setShowReader(false);
      setReaderContent(null);
      return;
    }

    if (input === 'r' && key.ctrl && !showReader) {
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

    if (input === 'm' && !showReader) {
      const article = articles[selectedIndex];
      if (article?.id) {
        markAsRead(article.id);
      }
      return;
    }

    if (key.return && !showReader) {
      const article = articles[selectedIndex];
      if (article?.url) {
        loadReaderContent(article.url);
      }
      return;
    }

    if (key.downArrow || input === 'j') {
      if (showReader && readerContent) {
        const lines = readerContent.textContent.split('\n');
        const maxScroll = Math.max(0, lines.length - 10);
        setReaderScroll(s => Math.min(s + 3, maxScroll));
      } else {
        setSelectedIndex(i => Math.min(i + 1, articles.length - 1));
      }
    }

    if (key.upArrow || input === 'k') {
      if (showReader && readerContent) {
        setReaderScroll(s => Math.max(s - 3, 0));
      } else {
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
    }

    if (showReader && readerContent) {
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

  // Retro terminal colors (sepia/cream on dark)
  const cream = '#d4be98';
  const dimCream = '#a89984';
  const highlight = '#e8c77b';

  // Loading screen
  if (loading) {
    const loadingWidth = 50;
    const loadingTitle = ' CuraK ';
    const loadingRemaining = loadingWidth - loadingTitle.length - 3;
    return (
      <Box flexDirection="column">
        <Text color={dimCream}>{'┌─' + loadingTitle + '─'.repeat(loadingRemaining) + '┐'}</Text>
        {LOGO.map((line, i) => (
          <Box key={i}>
            <Text color={dimCream}>{'│ '}</Text>
            <Text color={cream}>{line.padEnd(loadingWidth - 4)}</Text>
            <Text color={dimCream}>{' │'}</Text>
          </Box>
        ))}
        <Box>
          <Text color={dimCream}>{'│ '}</Text>
          <Text color={cream}>Loading... </Text>
          <Spinner type="dots" />
        </Box>
        <Text color={dimCream}>{'└' + '─'.repeat(loadingWidth - 2) + '┘'}</Text>
      </Box>
    );
  }

  // Error screen
  if (error) {
    const errorWidth = 50;
    const errorTitle = ' CuraK ';
    const errorRemaining = errorWidth - errorTitle.length - 3;
    return (
      <Box flexDirection="column">
        <Text color={dimCream}>{'┌─' + errorTitle + '─'.repeat(errorRemaining) + '┐'}</Text>
        {LOGO.map((line, i) => (
          <Box key={i}>
            <Text color={dimCream}>{'│ '}</Text>
            <Text color={cream}>{line.padEnd(errorWidth - 4)}</Text>
            <Text color={dimCream}>{' │'}</Text>
          </Box>
        ))}
        <Box>
          <Text color={dimCream}>{'│ '}</Text>
          <Text color="red">Error: {error}</Text>
        </Box>
        <Box>
          <Text color={dimCream}>{'│ '}</Text>
          <Text color={dimCream}>^R:Retry  q:Quit</Text>
        </Box>
        <Text color={dimCream}>{'└' + '─'.repeat(errorWidth - 2) + '┘'}</Text>
      </Box>
    );
  }

  // Header border with title
  const headerContentWidth = termWidth - 4; // Account for border chars and padding
  const titleText = ' CuraK ';
  const remainingWidth = Math.max(0, headerContentWidth - titleText.length - 1);

  return (
    <Box flexDirection="column">
      {/* ═══ Header ═══ */}
      {/* Top border with title */}
      <Text color={dimCream}>
        {'┌─' + titleText + '─'.repeat(remainingWidth) + '┐'}
      </Text>

      <Box flexDirection="row">
        <Text color={dimCream}>│ </Text>
        <Box flexDirection="row" justifyContent="space-between" width={headerContentWidth}>
          {/* Logo */}
          <Box flexDirection="column">
            {LOGO.map((line, i) => (
              <Text key={i} color={cream}>{line}</Text>
            ))}
          </Box>

          {/* Stats */}
          <Box flexDirection="column" justifyContent="center" alignItems="flex-end">
            <Box>
              <Text color={dimCream}>||| </Text>
              <Text color={cream}>{articles.length} articles</Text>
            </Box>
            <Box>
              <Text color={dimCream}>◎  </Text>
              <Text color={cream}>~{totalReadingTime}min read</Text>
            </Box>
          </Box>
        </Box>
        <Text color={dimCream}> │</Text>
      </Box>

      {/* Bottom border */}
      <Text color={dimCream}>
        {'└' + '─'.repeat(headerContentWidth + 2) + '┘'}
      </Text>

      {/* ═══ Main Content ═══ */}
      <Box flexDirection="row">
        {/* Articles List */}
        <Box width={listWidth} flexDirection="column">
          {/* Top border with title */}
          {(() => {
            const articlesTitle = ` Articles (${articles.length}) `;
            const innerWidth = listWidth - 2;
            const remaining = Math.max(0, innerWidth - articlesTitle.length - 1);
            const listColor = showReader ? dimCream : cream;
            return (
              <Text color={listColor}>
                {'┌─' + articlesTitle + '─'.repeat(remaining) + '┐'}
              </Text>
            );
          })()}

          {/* Article items */}
          {(() => {
            const startIdx = Math.max(0, Math.min(selectedIndex - Math.floor(listVisibleCount / 2), articles.length - listVisibleCount));
            const endIdx = Math.min(startIdx + listVisibleCount, articles.length);
            const visibleArticles = articles.slice(startIdx, endIdx);
            const listColor = showReader ? dimCream : cream;
            const innerWidth = listWidth - 4;

            if (visibleArticles.length === 0) {
              return (
                <Text color={listColor}>
                  {'│ ' + 'No articles'.padEnd(innerWidth) + ' │'}
                </Text>
              );
            }

            return visibleArticles.map((article, i) => {
              const idx = startIdx + i;
              const selected = idx === selectedIndex;
              const title = (article.title || 'Untitled').slice(0, innerWidth - 2);
              const prefix = selected ? '► ' : '  ';
              const content = (prefix + title).padEnd(innerWidth);

              return (
                <Box key={`${article.id}-${idx}`}>
                  <Text color={listColor}>{'│ '}</Text>
                  <Text color={selected ? cream : dimCream}>{content}</Text>
                  <Text color={listColor}>{' │'}</Text>
                </Box>
              );
            });
          })()}

          {/* Bottom border */}
          {(() => {
            const listColor = showReader ? dimCream : cream;
            return (
              <Text color={listColor}>
                {'└' + '─'.repeat(listWidth - 2) + '┘'}
              </Text>
            );
          })()}
        </Box>

        {/* Preview / Reader */}
        <Box width={contentWidth} flexDirection="column">
          {/* Top border with title */}
          {(() => {
            const previewTitle = showReader ? ' Reader ' : ' Preview ';
            const innerWidth = contentWidth - 2;
            const remaining = Math.max(0, innerWidth - previewTitle.length - 1);
            const previewColor = showReader ? cream : dimCream;
            return (
              <Text color={previewColor}>
                {'┌─' + previewTitle + '─'.repeat(remaining) + '┐'}
              </Text>
            );
          })()}

          {/* Content */}
          <Box flexDirection="column" height={mainHeight - 2}>
            {readerLoading ? (
              <Box>
                <Text color={dimCream}>{'│ '}</Text>
                <Text color={cream}>Loading article... </Text>
                <Spinner type="dots" />
              </Box>
            ) : showReader && readerContent ? (
              <>
                <Box>
                  <Text color={cream}>{'│ '}</Text>
                  <Text color={cream} bold>{readerContent.title.slice(0, contentWidth - 6)}</Text>
                </Box>
                {readerContent.byline && (
                  <Box>
                    <Text color={cream}>{'│ '}</Text>
                    <Text color={dimCream}>{readerContent.byline.slice(0, contentWidth - 6)}</Text>
                  </Box>
                )}
                {(() => {
                  const visibleLines = Math.max(5, mainHeight - 6);
                  const lines = readerContent.textContent.split('\n');
                  const displayLines = lines.slice(readerScroll, readerScroll + visibleLines);
                  return displayLines.map((line, i) => (
                    <Box key={i}>
                      <Text color={cream}>{'│ '}</Text>
                      <Text color={cream}>{line.slice(0, contentWidth - 6)}</Text>
                    </Box>
                  ));
                })()}
              </>
            ) : showReader && !readerContent ? (
              <>
                <Box>
                  <Text color={dimCream}>{'│ '}</Text>
                  <Text color="red">Failed to load article</Text>
                </Box>
                <Box>
                  <Text color={dimCream}>{'│ '}</Text>
                  <Text color={dimCream}>Esc: Back</Text>
                </Box>
              </>
            ) : selectedArticle ? (
              <>
                <Box>
                  <Text color={dimCream}>{'│ '}</Text>
                  <Text color={cream}>{selectedArticle.title?.slice(0, contentWidth - 6)}</Text>
                </Box>
                <Box>
                  <Text color={dimCream}>{'│ '}</Text>
                  <Text color={highlight}>{selectedArticle.url?.slice(0, contentWidth - 6)}</Text>
                </Box>
                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <Box>
                    <Text color={dimCream}>{'│ '}</Text>
                    {selectedArticle.tags.slice(0, 4).map((tag, i) => (
                      <Text key={i} color={highlight}>#{tag} </Text>
                    ))}
                  </Box>
                )}
                <Box>
                  <Text color={dimCream}>{'│ '}</Text>
                </Box>
                <Box>
                  <Text color={dimCream}>{'│ '}</Text>
                  <Text color={dimCream}>{selectedArticle.summary?.slice(0, contentWidth - 6) || ''}</Text>
                </Box>
              </>
            ) : (
              <Box>
                <Text color={dimCream}>{'│ '}</Text>
                <Text color={dimCream}>Select an article</Text>
              </Box>
            )}
          </Box>

          {/* Bottom border */}
          {(() => {
            const previewColor = showReader ? cream : dimCream;
            return (
              <Text color={previewColor}>
                {'└' + '─'.repeat(contentWidth - 2) + '┘'}
              </Text>
            );
          })()}
        </Box>
      </Box>

      {/* ═══ Commands ═══ */}
      <Box paddingX={1}>
        <Text color={dimCream}>└─ </Text>
        {showReader ? (
          <Text color={cream}>
            j/k:Scroll  Space:Page  Esc:Back  o:Open  q:Quit
          </Text>
        ) : (
          <Text color={cream}>
            j/k:Navigate  Enter:Read  m:Done  o:Open  ^R:Refresh  q:Quit
          </Text>
        )}
        <Text color={dimCream}> ─┘</Text>
      </Box>
    </Box>
  );
}
