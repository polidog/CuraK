export interface Article {
  id: string;
  title: string;
  url: string;
  summary?: string;
  content?: string;
  tags?: string[];
  reading_time_minutes?: number;
  content_type?: string;
  priority?: number;
  created_at?: string;
  updated_at?: string;
  is_read?: boolean;
}

export interface DiscoveryItem {
  id: string;
  title: string;
  url: string;
  summary?: string;
  tags?: string[];
  reading_time_minutes?: number;
  source?: string;
}

export interface ArticleListResponse {
  articles: Article[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface DiscoveryListResponse {
  items?: DiscoveryItem[];
  discoveries?: DiscoveryItem[];
  total?: number;
}

export interface SearchResponse {
  articles?: Article[];
  data?: Article[];
  total?: number;
}

export type ViewType = 'articles' | 'discovery' | 'search' | 'detail' | 'token-setup';
