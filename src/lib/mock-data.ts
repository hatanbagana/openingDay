import type { Post } from "@/types/post";

const MOCK_POSTS: Post[] = [
  {
    id: "mock-1",
    author: "puujee",
    title: "Coffee time",
    caption: "Morning light, clean desk, strong coffee.",
    content: "Morning light, clean desk, strong coffee.",
    image_url:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
    likes: 128,
    comments_count: 2,
    comments: [
      {
        id: "mock-1-comment-1",
        author: "temka",
        text: "Nice setup bro.",
        created_at: "2026-06-05T09:15:00.000Z",
        updated_at: "2026-06-05T09:15:00.000Z",
      },
      {
        id: "mock-1-comment-2",
        author: "naraa",
        text: "That cup color is clean.",
        created_at: "2026-06-05T09:40:00.000Z",
        updated_at: "2026-06-05T09:40:00.000Z",
      },
    ],
    is_liked: false,
    created_at: "2026-06-05T09:00:00.000Z",
    updated_at: "2026-06-05T09:00:00.000Z",
  },
  {
    id: "mock-2",
    author: "anu",
    title: "Golden hour run",
    caption: "City air finally feels soft after work.",
    content: "City air finally feels soft after work.",
    image_url:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    likes: 301,
    comments_count: 3,
    comments: [
      {
        id: "mock-2-comment-1",
        author: "bold",
        text: "Frame ni goy boljee.",
        created_at: "2026-06-04T13:10:00.000Z",
        updated_at: "2026-06-04T13:10:00.000Z",
      },
      {
        id: "mock-2-comment-2",
        author: "zoloo",
        text: "Color palette ni taalagdlaa.",
        created_at: "2026-06-04T13:18:00.000Z",
        updated_at: "2026-06-04T13:18:00.000Z",
      },
      {
        id: "mock-2-comment-3",
        author: "mendee",
        text: "Run route share hiigeerei.",
        created_at: "2026-06-04T13:28:00.000Z",
        updated_at: "2026-06-04T13:28:00.000Z",
      },
    ],
    is_liked: true,
    created_at: "2026-06-04T12:48:00.000Z",
    updated_at: "2026-06-04T12:48:00.000Z",
  },
  {
    id: "mock-3",
    author: "saraa",
    title: "Late night sketch",
    caption: "Paper, marker, no pressure.",
    content: "Paper, marker, no pressure.",
    image_url:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    likes: 94,
    comments_count: 1,
    comments: [
      {
        id: "mock-3-comment-1",
        author: "odko",
        text: "Texture ni dajgui suuj ee.",
        created_at: "2026-06-03T17:05:00.000Z",
        updated_at: "2026-06-03T17:05:00.000Z",
      },
    ],
    is_liked: false,
    created_at: "2026-06-03T16:40:00.000Z",
    updated_at: "2026-06-03T16:40:00.000Z",
  },
];

export function createMockPosts() {
  return MOCK_POSTS.map((post) => ({
    ...post,
    comments: post.comments?.map((comment) => ({ ...comment })) ?? [],
  }));
}
