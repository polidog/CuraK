import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface ReaderContent {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline: string | null;
  siteName: string | null;
}

export async function fetchReadableContent(url: string): Promise<ReaderContent | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CuraK/1.0; +https://github.com/polidog/curaK)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    // Remove <style> tags to avoid JSDOM CSS parsing errors
    const htmlWithoutStyles = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
    const dom = new JSDOM(htmlWithoutStyles, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return null;
    }

    return {
      title: article.title || '',
      content: article.content || '',
      textContent: article.textContent || '',
      excerpt: article.excerpt || '',
      byline: article.byline,
      siteName: article.siteName,
    };
  } catch (error) {
    console.error('Failed to fetch readable content:', error);
    return null;
  }
}
