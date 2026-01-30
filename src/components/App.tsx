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

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [readerContent, setReaderContent] = useState<ReaderContent | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerScroll, setReaderScroll] = useState(0);

  const termWidth = stdout?.columns || 80;
  const termHeight = stdout?.rows || 24;

  // Colors from theme
  const primary = theme.primary;
  const textColor = theme.text;
  const textDim = theme.textDim;
  const accent = theme.accent;

  // Layout
  const contentWidth = Math.min(termWidth - 4, 80);
  const listHeight = Math.min(termHeight - 12, 20);

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

  // Modal view
  if (showModal) {
    const readerWidth = Math.min(termWidth - 4, 80);
    const readerHeight = termHeight - 8;

    if (readerLoading) {
      return (
        <Box flexDirection="column">
          <Text color={textColor}>Loading article...</Text>
        </Box>
      );
    }

    if (!readerContent) {
      return (
        <Box flexDirection="column">
          <Text color="red">Failed to load article</Text>
          <Text color={textDim}>Press Esc to go back</Text>
        </Box>
      );
    }

    const textLines = readerContent.textContent.split('\n');
    const visibleLines = textLines.slice(readerScroll, readerScroll + readerHeight);
    const totalLines = textLines.length;
    const scrollInfo = totalLines > readerHeight
      ? `[${readerScroll + 1}-${Math.min(readerScroll + readerHeight, totalLines)}/${totalLines}]`
      : '';

    return (
      <Box flexDirection="column">
        {/* Title */}
        <Text color={primary} bold>{readerContent.title}</Text>
        {readerContent.byline && (
          <Text color={textDim}>{readerContent.byline}</Text>
        )}
        <Text color={textDim}>{'─'.repeat(Math.min(50, readerWidth))}</Text>
        <Text> </Text>

        {/* Content */}
        {visibleLines.map((line, i) => (
          <Text key={i} color={textColor}>{line.slice(0, readerWidth)}</Text>
        ))}

        {/* Footer */}
        <Text> </Text>
        <Text color={textDim}>
          {scrollInfo}  j/k:Scroll  Space:Page  o:Open  Esc:Back
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
      {/* Header */}
      <Box flexDirection="column" marginBottom={1}>
        {LOGO.map((line, i) => (
          <Text key={i} color={primary}>{line}</Text>
        ))}
        <Text color={textDim}>{statsText}</Text>
      </Box>

      {/* Article List */}
      <Box flexDirection="column">
        {visibleArticles.length === 0 ? (
          <Text color={textDim}>  No articles</Text>
        ) : (
          visibleArticles.map((article, i) => {
            const idx = startIdx + i;
            const selected = idx === selectedIndex;
            const maxWidth = contentWidth - 10;
            const fullTitle = article.title || 'Untitled';
            const title = fullTitle.length > maxWidth
              ? fullTitle.slice(0, maxWidth - 3) + '...'
              : fullTitle;
            const readingTime = article.reading_time_minutes
              ? `${article.reading_time_minutes}min`
              : '';

            if (selected) {
              return (
                <Box key={article.id || idx} flexDirection="column" marginY={0}>
                  <Text color={primary}>
                    {' ► '}<Text bold>{title}</Text>
                  </Text>
                  {article.url && (
                    <Text color={textDim}>
                    {'   '}{article.url.slice(0, maxWidth)}
                    </Text>
                  )}
                  {(article.tags?.length || readingTime) && (
                    <Text color={accent}>
                    {'   '}{article.tags?.slice(0, 3).map(t => `#${t}`).join(' ')}  {readingTime}
                    </Text>
                  )}
                </Box>
              );
            }

            return (
              <Text key={article.id || idx} color={textDim}>
                {'   '}{title}
              </Text>
            );
          })
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text color={textDim}>
          j/k:Navigate  Enter:Read  m:Done  o:Open  ^R:Refresh  q:Quit
        </Text>
      </Box>
    </Box>
  );
}
