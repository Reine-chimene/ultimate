"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { FeedPost } from "@/types";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.feed.list();
      setPosts(res.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger le fil");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!content.trim()) return;
    setPosting(true);
    setError(null);
    try {
      await api.feed.create({
        content: content.trim(),
        image_url: imageUrl.trim() || undefined,
      });
      setContent("");
      setImageUrl("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Publication impossible");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post: FeedPost) => {
    try {
      const updated = post.liked_by_me
        ? await api.feed.unlike(post.id)
        : await api.feed.like(post.id);
      setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
    } catch {
      /* ignore */
    }
  };

  const submitComment = async (postId: string) => {
    const text = commentDrafts[postId]?.trim();
    if (!text) return;
    try {
      await api.feed.comment(postId, text);
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      await load();
    } catch {
      /* ignore */
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Supprimer cette publication ?")) return;
    await api.feed.delete(postId);
    await load();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Fil communautaire"
        subtitle="Partagez un moment, une envie ou une photo avec la communauté ULTIMATE."
      />

      <div className="premium-card mb-6 space-y-3 p-5">
        <textarea
          className="input-field min-h-[100px] w-full resize-none"
          placeholder="Qu'avez-vous envie de partager ?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
        />
        <input
          className="input-field w-full"
          placeholder="URL image (optionnel)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <Button variant="gold" loading={posting} onClick={handleCreate}>
          <Send className="h-4 w-4" /> Publier
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {loading ? (
        <LoadingSpinner />
      ) : posts.length === 0 ? (
        <p className="text-center text-sm text-[#9a8f8a]">Aucune publication pour le moment. Soyez le premier !</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="premium-card p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[#f5f0e8]">
                    {post.author_display_name}
                    {post.author_account_type === "couple" && (
                      <span className="ml-2 rounded-full bg-[#6b1d3a]/40 px-2 py-0.5 text-xs text-[#c9a962]">
                        Couple
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[#9a8f8a]">
                    {new Date(post.created_at).toLocaleString("fr-CA")}
                  </p>
                </div>
                {user?.id === post.author_id && (
                  <button type="button" onClick={() => deletePost(post.id)} className="text-[#9a8f8a] hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
              {post.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.image_url} alt="" className="mt-3 max-h-80 w-full rounded-lg object-cover" />
              )}
              <div className="mt-4 flex items-center gap-4 text-sm text-[#9a8f8a]">
                <button
                  type="button"
                  onClick={() => toggleLike(post)}
                  className={`flex items-center gap-1 transition ${post.liked_by_me ? "text-[#e8a0b4]" : "hover:text-[#f5f0e8]"}`}
                >
                  <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-current" : ""}`} />
                  {post.like_count}
                </button>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" /> {post.comment_count}
                </span>
              </div>
              {post.comments.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                  {post.comments.map((c) => (
                    <p key={c.id} className="text-sm">
                      <span className="font-medium text-[#c9a962]">{c.author_display_name}</span>{" "}
                      <span className="text-[#9a8f8a]">{c.content}</span>
                    </p>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <input
                  className="input-field flex-1 text-sm"
                  placeholder="Commenter..."
                  value={commentDrafts[post.id] ?? ""}
                  onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                />
                <Button variant="outline" size="sm" onClick={() => submitComment(post.id)}>
                  Envoyer
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
