import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/storage';

export type KesfetPost = {
  id: string;
  authorName: string;
  authorTag: string;
  isMe: boolean;
  text: string;
  imageUri?: string;
  createdAt: string;
  baseLikeCount: number;
  commentCount: number;
};

export type KesfetFeedPost = KesfetPost & { liked: boolean; likeCount: number };

// Gerçek backend (Faz 0/1) devreye girene kadar Keşfet'i canlı hissettiren
// sabit topluluk gönderileri — uygulamanın kendi fal türlerinden (tarot,
// kahve, katina, I Ching, rüya) birer örnek veriyor.
const SEED_POSTS: KesfetPost[] = [
  {
    id: 'seed-1',
    authorName: 'Kadim Ruh',
    authorTag: '@kadimruh',
    isMe: false,
    text: 'Bu akşam dolunay enerjisiyle küçük bir niyet ritüeli yaptım 🌕✨ Siz de deniyor musunuz?',
    createdAt: '2026-08-27T21:10:00.000Z',
    baseLikeCount: 34,
    commentCount: 6,
  },
  {
    id: 'seed-2',
    authorName: 'Yıldız Tozu',
    authorTag: '@yildiztozu',
    isMe: false,
    text: 'Kahve fincanımda bugün bir kuş figürü çıktı 🕊️ Yorumu olan var mı?',
    createdAt: '2026-08-27T18:42:00.000Z',
    baseLikeCount: 12,
    commentCount: 9,
  },
  {
    id: 'seed-3',
    authorName: 'Gece Yarısı Kâhini',
    authorTag: '@gecekahini',
    isMe: false,
    text: 'Merkür retrosu bitti sanıyordum ama telefonum yine suya düştü 😅 Evrenin bir planı var galiba.',
    createdAt: '2026-08-27T15:05:00.000Z',
    baseLikeCount: 58,
    commentCount: 14,
  },
  {
    id: 'seed-4',
    authorName: 'Ay Çocuğu',
    authorTag: '@aycocugu',
    isMe: false,
    text: 'Bugünkü tarot çekilişim: Yıldız kartı 🌟 Umut dolu bir gün diliyorum herkese.',
    createdAt: '2026-08-27T11:30:00.000Z',
    baseLikeCount: 21,
    commentCount: 3,
  },
  {
    id: 'seed-5',
    authorName: 'Kristal Bahçe',
    authorTag: '@kristalbahce',
    isMe: false,
    text: 'Ametist taşımı pencere kenarına koydum, enerjisi tüm odayı sarmış gibi hissediyorum.',
    createdAt: '2026-08-26T20:15:00.000Z',
    baseLikeCount: 17,
    commentCount: 2,
  },
  {
    id: 'seed-6',
    authorName: 'Rüzgârın Sesi',
    authorTag: '@ruzgarinsesi',
    isMe: false,
    text: 'Katina falımda art arda iki kez Kupa Ası çıktı — bu bir işaret olmalı 💛',
    createdAt: '2026-08-26T16:50:00.000Z',
    baseLikeCount: 9,
    commentCount: 5,
  },
  {
    id: 'seed-7',
    authorName: 'Gölgeler Ustası',
    authorTag: '@golgelerustasi',
    isMe: false,
    text: "I Ching'de Kien heksagramını çektim bugün — büyük bir gücün eşiğinde hissediyorum kendimi.",
    createdAt: '2026-08-26T09:20:00.000Z',
    baseLikeCount: 27,
    commentCount: 4,
  },
  {
    id: 'seed-8',
    authorName: 'Tılsımlı Kalem',
    authorTag: '@tilsimlikalem',
    isMe: false,
    text: 'Rüyamda uçtuğumu gördüm, kitaplığa bakınca özgürlük ve yeni başlangıçlar deniyor 🕊️',
    createdAt: '2026-08-25T22:05:00.000Z',
    baseLikeCount: 15,
    commentCount: 7,
  },
];

async function readOwnPosts(): Promise<KesfetPost[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.kesfetPosts);
  return raw ? (JSON.parse(raw) as KesfetPost[]) : [];
}

async function writeOwnPosts(posts: KesfetPost[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.kesfetPosts, JSON.stringify(posts));
}

async function readLikedIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.kesfetLikes);
  return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
}

async function writeLikedIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.kesfetLikes, JSON.stringify([...ids]));
}

export async function getFeed(): Promise<KesfetFeedPost[]> {
  const [ownPosts, likedIds] = await Promise.all([readOwnPosts(), readLikedIds()]);
  const all = [...ownPosts, ...SEED_POSTS].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return all.map((post) => {
    const liked = likedIds.has(post.id);
    return { ...post, liked, likeCount: post.baseLikeCount + (liked ? 1 : 0) };
  });
}

export async function addPost(text: string, imageUri?: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed && !imageUri) throw new Error('Boş bir gönderi paylaşılamaz.');
  const ownPosts = await readOwnPosts();
  const post: KesfetPost = {
    id: `me-${Date.now()}`,
    authorName: 'Sen',
    authorTag: '@sen',
    isMe: true,
    text: trimmed,
    imageUri,
    createdAt: new Date().toISOString(),
    baseLikeCount: 0,
    commentCount: 0,
  };
  await writeOwnPosts([post, ...ownPosts]);
}

export async function deletePost(id: string): Promise<void> {
  const ownPosts = await readOwnPosts();
  await writeOwnPosts(ownPosts.filter((post) => post.id !== id));
}

export async function toggleLike(id: string): Promise<boolean> {
  const likedIds = await readLikedIds();
  const nowLiked = !likedIds.has(id);
  if (nowLiked) likedIds.add(id);
  else likedIds.delete(id);
  await writeLikedIds(likedIds);
  return nowLiked;
}
