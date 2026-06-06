export interface Post {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string | null;
  tags: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

import safeStorage from '../utils/storage';

const API_BASE = '';

function getToken(): string | null {
  return safeStorage.getItem('admin_token');
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const api = {
  getPosts: async (): Promise<Post[]> => {
    return fetchJson<Post[]>('/api/posts');
  },

  getPostsByCategory: async (category: string): Promise<Post[]> => {
    return fetchJson<Post[]>(`/api/posts/category/${encodeURIComponent(category)}`);
  },

  getPostsByTag: async (tag: string): Promise<Post[]> => {
    const all = await api.getPosts();
    return all.filter(p => p.tags?.includes(tag));
  },

  searchPosts: async (keyword: string): Promise<Post[]> => {
    return fetchJson<Post[]>(`/api/posts/search/${encodeURIComponent(keyword)}`);
  },

  getCategories: async (): Promise<string[]> => {
    return fetchJson<string[]>('/api/posts/meta/categories');
  },

  getTags: async (): Promise<string[]> => {
    return fetchJson<string[]>('/api/posts/meta/tags');
  },

  getArchives: async (): Promise<{ year: string; months: string[] }[]> => {
    return fetchJson<{ year: string; months: string[] }[]>('/api/posts/meta/archives');
  },

  getPost: async (id: string): Promise<Post> => {
    return fetchJson<Post>(`/api/posts/${encodeURIComponent(id)}`);
  },

  createPost: async (postData: { title: string; content: string; summary?: string; category?: string; tags?: string[] }): Promise<Post> => {
    return fetchJson<Post>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  },

  updatePost: async (id: string, postData: { title: string; content: string; summary?: string; category?: string; tags?: string[] }): Promise<Post> => {
    return fetchJson<Post>(`/api/posts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(postData)
    });
  },

  deletePost: async (id: string): Promise<void> => {
    await fetchJson<void>(`/api/posts/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  login: async (password: string): Promise<{ success: boolean; token?: string }> => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '登录失败');
    }
    if (data.token) {
      safeStorage.setItem('admin_token', data.token);
    }
    return data;
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '上传失败' }));
      throw new Error(err.error || '上传失败');
    }
    return res.json();
  }
};
