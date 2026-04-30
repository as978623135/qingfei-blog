import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'blog.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function initDb(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  return db;
}

export function setupTables(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      category TEXT DEFAULT '未分类',
      tags TEXT DEFAULT '[]',
      created_at TEXT,
      updated_at TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

// 文章 CRUD
export function getAllPosts(): Post[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM posts ORDER BY created_at DESC');
  const rows = stmt.all() as any[];
  return rows.map(row => ({
    ...row,
    tags: JSON.parse(row.tags || '[]')
  }));
}

export function getPostById(id: string): Post | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM posts WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return null;
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]')
  };
}

export function createPost(post: Post): void {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO posts (id, title, content, summary, category, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(post.id, post.title, post.content, post.summary, post.category, JSON.stringify(post.tags || []), post.created_at, post.updated_at);
}

export function updatePost(id: string, post: Partial<Post>): void {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (post.title !== undefined) { fields.push('title = ?'); values.push(post.title); }
  if (post.content !== undefined) { fields.push('content = ?'); values.push(post.content); }
  if (post.summary !== undefined) { fields.push('summary = ?'); values.push(post.summary); }
  if (post.category !== undefined) { fields.push('category = ?'); values.push(post.category); }
  if (post.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(post.tags)); }
  if (post.updated_at !== undefined) { fields.push('updated_at = ?'); values.push(post.updated_at); }

  values.push(id);

  const stmt = db.prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
}

export function deletePost(id: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM posts WHERE id = ?');
  stmt.run(id);
}

export function getPostsByCategory(category: string): Post[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM posts WHERE category = ? ORDER BY created_at DESC');
  const rows = stmt.all(category) as any[];
  return rows.map(row => ({
    ...row,
    tags: JSON.parse(row.tags || '[]')
  }));
}

export function searchPosts(keyword: string): Post[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM posts WHERE title LIKE ? ORDER BY created_at DESC');
  const rows = stmt.all(`%${keyword}%`) as any[];
  return rows.map(row => ({
    ...row,
    tags: JSON.parse(row.tags || '[]')
  }));
}

export function getAllCategories(): string[] {
  const db = getDb();
  const stmt = db.prepare('SELECT DISTINCT category FROM posts');
  const rows = stmt.all() as any[];
  const categories = rows.map(r => r.category || '未分类');
  return ['全部分类', ...categories];
}

export function getAllTags(): string[] {
  const db = getDb();
  const stmt = db.prepare('SELECT tags FROM posts');
  const rows = stmt.all() as any[];
  const tagSet = new Set<string>();
  rows.forEach(r => {
    const tags = JSON.parse(r.tags || '[]') as string[];
    tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet);
}

export function getArchives(): { year: string; months: string[] }[] {
  const db = getDb();
  const stmt = db.prepare('SELECT created_at FROM posts WHERE created_at IS NOT NULL');
  const rows = stmt.all() as any[];
  const archives = new Map<string, Set<string>>();
  rows.forEach(r => {
    const date = new Date(r.created_at);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    if (!archives.has(year)) archives.set(year, new Set());
    archives.get(year)!.add(month);
  });
  return Array.from(archives.entries())
    .map(([year, months]) => ({ year, months: Array.from(months).sort() }))
    .sort((a, b) => parseInt(b.year) - parseInt(a.year));
}

// 管理员设置
export function getAdminSetting(key: string): string | null {
  const db = getDb();
  const stmt = db.prepare('SELECT value FROM admin_settings WHERE key = ?');
  const row = stmt.get(key) as any;
  return row ? row.value : null;
}

export function setAdminSetting(key: string, value: string): void {
  const db = getDb();
  const stmt = db.prepare('INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)');
  stmt.run(key, value);
}
