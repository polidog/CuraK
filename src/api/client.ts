import type {
  Article,
  ArticleListResponse,
  DiscoveryItem,
  DiscoveryListResponse,
  SearchResponse,
} from '../types/article.js';

const BASE_URL = 'https://curaq.app';

export class CuraQClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getArticles(page = 1, pageSize = 100): Promise<ArticleListResponse> {
    return this.request<ArticleListResponse>(
      `/api/v1/articles?page=${page}&pageSize=${pageSize}`
    );
  }

  async getArticle(id: string): Promise<Article> {
    return this.request<Article>(`/api/v1/articles/${id}`);
  }

  async searchArticles(query: string): Promise<SearchResponse> {
    return this.request<SearchResponse>(
      `/api/v1/articles/search?q=${encodeURIComponent(query)}`
    );
  }

  async semanticSearch(query: string): Promise<SearchResponse> {
    return this.request<SearchResponse>(
      `/api/v1/articles/semantic-search?q=${encodeURIComponent(query)}`
    );
  }

  async markAsRead(id: string): Promise<void> {
    await this.request(`/api/v1/articles/${id}/read`, {
      method: 'POST',
    });
  }

  async deleteArticle(id: string): Promise<void> {
    await this.request(`/api/v1/articles/${id}`, {
      method: 'DELETE',
    });
  }

  async getDiscovery(): Promise<DiscoveryListResponse> {
    return this.request<DiscoveryListResponse>('/api/v1/discovery');
  }

  async dismissDiscovery(id: string): Promise<void> {
    await this.request(`/api/v1/discovery/${id}/dismiss`, {
      method: 'POST',
    });
  }
}

let clientInstance: CuraQClient | null = null;

export function initClient(token: string): CuraQClient {
  clientInstance = new CuraQClient(token);
  return clientInstance;
}

export function getClient(): CuraQClient | null {
  return clientInstance;
}
