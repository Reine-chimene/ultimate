"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Heart, ImagePlus, MessageCircle, Send, Trash2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { FeedPost } from "@/types";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function FeedPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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

  const clearImage = () => {
    setImageUrl(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelect = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    try {
      const { url } = await api.feed.uploadImage(file);
      setImageUrl(url);
    } catch (e) {
      clearImage();
      setError(e instanceof ApiError ? e.message : "Upload impossible");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!content.trim() && !imageUrl) return;
    setPosting(true);
    setError(null);
    try {
      await api.feed.create({
        content: content.trim(),
        image_url: imageUrl ?? undefined,
      });
      setContent("");
      clearImage();
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
        subtitle="Photos, envies, fantasmes — partagez visuellement avec la communauté."
      />

      <div className="premium-card mb-6 space-y-4 p-5">
        <textarea
          className="input-field min-h-[88px] w-full resize-none"
          placeholder="Qu'avez-vous envie de montrer ?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
        />

        {imagePreview && (
          <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10">
            <Image
              src={imagePreview}
              alt="Aperçu"
              width={800}
              height={600}
              unoptimized
              className="max-h-72 w-full object-cover"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white transition hover:bg-black"
              aria-label="Retirer l'image"
            >
              <X className="h-4 w-4" />
            </button>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
                Upload…
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void handleImageSelect(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            {imageUrl ? "Changer la photo" : "Ajouter une photo"}
          </Button>
          <Button
            variant="gold"
            loading={posting || uploading}
            disabled={(!content.trim() && !imageUrl) || uploading}
            onClick={handleCreate}
          >
            <Send className="h-4 w-4" /> Publier
          </Button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {loading ? (
        <LoadingSpinner />
      ) : posts.length === 0 ? (
        <p className="text-center text-sm text-[#9a8f8a]">
          Aucune publication. Montrez-vous — photo + message, ou photo seule.
        </p>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <article key={post.id} className="premium-card overflow-hidden">
              {post.image_url && (
                <div className="relative aspect-[4/5] max-h-[480px] w-full sm:aspect-[16/10]">
                  <Image
                    src={post.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 672px"
                    unoptimized={post.image_url.includes("localhost")}
                  />
                </div>
              )}
              <div className="p-5">
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
                    <button
                      type="button"
                      onClick={() => deletePost(post.id)}
                      className="text-[#9a8f8a] hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {post.content.trim() && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
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
                    placeholder="Commenter…"
                    value={commentDrafts[post.id] ?? ""}
                    onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  />
                  <Button variant="outline" size="sm" onClick={() => submitComment(post.id)}>
                    Envoyer
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
