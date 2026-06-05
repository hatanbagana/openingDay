export type EntityId = number | string;

export interface Comment {
  id: EntityId;
  author: string;
  text: string;
  created_at?: string;
  updated_at?: string;
}

export interface Post {
  id: EntityId;
  author: string;
  title: string;
  content?: string | null;
  caption?: string | null;
  image_url?: string | null;
  likes: number;
  comments_count: number;
  comments?: Comment[] | null;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostPayload {
  author: string;
  title: string;
  caption: string;
  image_url: string;
}

export interface UpdatePostPayload {
  title: string;
  caption: string;
  image_url: string;
}

export interface CommentPayload {
  author: string;
  text: string;
}

export interface UpdateCommentPayload {
  text: string;
}
