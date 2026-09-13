"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Lock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import type { PrivateAlbumAccessRequest, PrivateAlbumDetail } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PrivatePhotoImage } from "./PrivatePhotoImage";
import { PrivateAlbumRequests } from "./PrivateAlbumRequests";

interface PrivateAlbumManagerProps {
  onAlbumsChange?: () => void;
}

export function PrivateAlbumManager({ onAlbumsChange }: PrivateAlbumManagerProps) {
  const [albums, setAlbums] = useState<PrivateAlbumDetail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requests, setRequests] = useState<PrivateAlbumAccessRequest[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const loadRequests = useCallback(async (albumId: string) => {
    const res = await api.privateAlbums.listRequests(albumId);
    setRequests(res.requests);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.privateAlbums.listMine();
      const details = await Promise.all(res.albums.map((a) => api.privateAlbums.getMine(a.id)));
      setAlbums(details);
      setSelectedId((prev) => {
        if (prev && details.some((d) => d.id === prev)) return prev;
        return details[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger vos albums");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selectedId) loadRequests(selectedId);
  }, [selectedId, loadRequests]);

  const selected = albums.find((a) => a.id === selectedId) ?? null;

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const album = await api.privateAlbums.create({ title: title.trim(), description: description || undefined });
      setTitle("");
      setDescription("");
      await load();
      setSelectedId(album.id);
      onAlbumsChange?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Création impossible");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm("Supprimer cet album et toutes ses photos ?")) return;
    await api.privateAlbums.delete(albumId);
    await load();
    onAlbumsChange?.();
  };

  const handleUpload = async (file: File) => {
    if (!selected) return;
    setUploading(true);
    try {
      await api.privateAlbums.uploadPhoto(selected.id, file);
      await load();
      onAlbumsChange?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload impossible");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!selected || !confirm("Supprimer cette photo ?")) return;
    await api.privateAlbums.deletePhoto(selected.id, photoId);
    await load();
    onAlbumsChange?.();
  };

  if (loading && albums.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="glass-card space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-[#c9a962]" />
          <h2 className="font-medium">Créer un album privé</h2>
        </div>
        <Input
          placeholder="Titre de l'album"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="input-field min-h-[80px] w-full resize-none"
          placeholder="Description (optionnelle)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <Button variant="gold" size="sm" loading={creating} onClick={handleCreate}>
          <Plus className="h-4 w-4" /> Créer l&apos;album
        </Button>
      </div>

      {albums.length === 0 && (
        <p className="text-center text-sm text-[#9a8f8a]">Vous n&apos;avez pas encore d&apos;album privé.</p>
      )}

      {albums.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            {albums.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedId(a.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedId === a.id
                    ? "border-[#c9a962]/40 bg-[#c9a962]/10"
                    : "border-white/10 hover:bg-white/[0.03]"
                }`}
              >
                <p className="truncate font-medium">{a.title}</p>
                <p className="text-xs text-[#9a8f8a]">
                  {a.photo_count} photo{a.photo_count !== 1 ? "s" : ""}
                  {a.pending_request_count > 0 ? ` · ${a.pending_request_count} en attente` : ""}
                </p>
              </button>
            ))}
          </div>

          {selected && (
            <div className="space-y-4">
              <div className="premium-card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold text-[#c9a962]">{selected.title}</h3>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteAlbum(selected.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {selected.description && (
                  <p className="mb-4 text-sm text-[#9a8f8a]">{selected.description}</p>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  loading={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="h-4 w-4" /> Ajouter photo / vidéo
                </Button>
                <p className="mt-2 text-xs text-[#9a8f8a]">Vidéos privées réservées aux membres Premium (MP4, WebM, max 50 Mo).</p>

                {selected.photos.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {selected.photos.map((p) => (
                      <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg">
                        <PrivatePhotoImage
                          albumId={selected.id}
                          photoId={p.id}
                          alt=""
                          mediaType={p.media_type ?? "photo"}
                          className="h-full w-full"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(p.id)}
                          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100"
                        >
                          <Trash2 className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[#9a8f8a]">Aucune photo dans cet album.</p>
                )}
              </div>

              <div className="premium-card p-5">
                <h3 className="mb-4 font-display text-lg font-semibold text-[#c9a962]">
                  Demandes d&apos;accès
                </h3>
                <PrivateAlbumRequests
                  albumId={selected.id}
                  requests={requests}
                  onChange={() => {
                    loadRequests(selected.id);
                    load();
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
