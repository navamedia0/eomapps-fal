import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '@/config/env';
import { getStoredSession } from '@/services/auth';
import { getJson, postForm, postJson, deleteRequest } from '@/services/http';

export type KesfetFeedPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorTag: string;
  isMe: boolean;
  text: string;
  imageUri?: string;
  createdAt: string;
  liked: boolean;
  likeCount: number;
  commentCount: number;
};

const BOOST_STORAGE_KEY = '@kesfet_post_boosts_v2';

export async function getStoredBoosts(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(BOOST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function addPostBoost(postId: string, amount: number): Promise<number> {
  try {
    const boosts = await getStoredBoosts();
    const current = boosts[postId] || 0;
    const next = current + amount;
    boosts[postId] = next;
    await AsyncStorage.setItem(BOOST_STORAGE_KEY, JSON.stringify(boosts));
    return next;
  } catch {
    return amount;
  }
}

function appHeaders(): Record<string, string> {
  const appSecret = env.appSecret();
  return appSecret ? { 'X-App-Secret': appSecret } : {};
}

async function optionalAuthHeaders(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  return session ? { Authorization: `Bearer ${session.token}`, ...appHeaders() } : appHeaders();
}

async function requireAuthHeaders(): Promise<Record<string, string>> {
  const session = await getStoredSession();
  if (!session) {
    throw new Error('Bu işlem için giriş yapmalısın. Profil sekmesinden Google ile giriş yapabilirsin.');
  }
  return { Authorization: `Bearer ${session.token}`, ...appHeaders() };
}

export async function getFeed(authorId?: string): Promise<KesfetFeedPost[]> {
  const headers = await optionalAuthHeaders();
  const query = authorId ? `?authorId=${encodeURIComponent(authorId)}` : '';
  const [{ posts }, boosts] = await Promise.all([
    getJson<{ posts: KesfetFeedPost[] }>(`${env.socialApiUrl()}/posts${query}`, headers),
    getStoredBoosts(),
  ]);

  return posts.map((p) => {
    const boost = boosts[p.id] || 0;
    return {
      ...p,
      likeCount: (p.likeCount || 0) + boost,
    };
  });
}

export async function addPost(text: string, imageUri?: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed && !imageUri) throw new Error('Boş bir gönderi paylaşılamaz.');
  const headers = await requireAuthHeaders();
  const form = new FormData();
  form.append('text', trimmed);
  if (imageUri) {
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase();
    const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    form.append('image', { uri: imageUri, name: filename, type } as unknown as Blob);
  }
  await postForm(`${env.socialApiUrl()}/posts`, form, headers);
}

export async function deletePost(id: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await deleteRequest(`${env.socialApiUrl()}/posts/${id}`, headers);
}

export async function toggleLike(id: string): Promise<{ liked: boolean; likeCount: number }> {
  const headers = await requireAuthHeaders();
  const res = await postJson<{ liked: boolean; likeCount: number }>(
    `${env.socialApiUrl()}/posts/${id}/like`,
    {},
    headers,
  );
  const boosts = await getStoredBoosts();
  const boost = boosts[id] || 0;
  return {
    liked: res.liked,
    likeCount: (res.likeCount || 0) + boost,
  };
}

export type KesfetComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorTag: string;
  isMe: boolean;
  text: string;
  createdAt: string;
};

export async function getComments(postId: string): Promise<KesfetComment[]> {
  const headers = await optionalAuthHeaders();
  const { comments } = await getJson<{ comments: KesfetComment[] }>(
    `${env.socialApiUrl()}/posts/${postId}/comments`,
    headers,
  );
  return comments;
}

export async function addComment(postId: string, text: string): Promise<KesfetComment> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Boş bir yorum gönderilemez.');
  const headers = await requireAuthHeaders();
  const { comment } = await postJson<{ comment: KesfetComment }>(
    `${env.socialApiUrl()}/posts/${postId}/comments`,
    { text: trimmed },
    headers,
  );
  return comment;
}

export async function deleteComment(id: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await deleteRequest(`${env.socialApiUrl()}/comments/${id}`, headers);
}

export async function reportContent(targetType: 'post' | 'comment', targetId: string, reason: string): Promise<void> {
  const headers = await requireAuthHeaders();
  await postJson(`${env.socialApiUrl()}/reports`, { targetType, targetId, reason }, headers);
}
