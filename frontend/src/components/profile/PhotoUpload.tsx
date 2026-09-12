"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Photo } from "@/types";
import { Button } from "@/components/ui/Button";

interface PhotoUploadProps {
  onUploaded?: (photo: Photo) => void;
  onProfileRefresh?: () => void;
  isPrimary?: boolean;
  label?: string;
  previewUrl?: string | null;
  compact?: boolean;
}

export function PhotoUpload({
  onUploaded,
  onProfileRefresh,
  isPrimary = false,
  label = "Ajouter une photo",
  previewUrl,
  compact,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setMessage(null);

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Impossible d'ajouter cette photo. Vérifiez le format et la taille.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Impossible d'ajouter cette photo. Vérifiez le format et la taille.");
      return;
    }

    setUploading(true);
    setMessage("Upload en cours...");
    setLocalPreview(URL.createObjectURL(file));

    try {
      const photo = await api.profiles.uploadPhoto(file, isPrimary);
      setMessage("Photo ajoutée.");
      onUploaded?.(photo);
      await onProfileRefresh?.();
    } catch (err) {
      setLocalPreview(null);
      setMessage(null);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Impossible d'ajouter cette photo. Vérifiez le format et la taille.");
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const displayUrl = localPreview || previewUrl;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {displayUrl && (
        <div className={`relative mx-auto overflow-hidden rounded-xl ${compact ? "aspect-square w-40" : "aspect-square max-w-[220px]"}`}>
          <Image src={displayUrl} alt="Aperçu" fill className="object-cover" sizes="220px" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <Button
        variant="gold"
        size={compact ? "sm" : "md"}
        className="w-full"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Upload en cours...
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" /> {label}
          </>
        )}
      </Button>

      {message && !error && <p className="text-center text-sm text-[#c9a962]">{message}</p>}
      {error && <p className="text-center text-sm text-red-300">{error}</p>}
      {!compact && (
        <p className="text-center text-xs text-[#9a8f8a]">
          JPEG, PNG ou WEBP — max. 5 Mo. Fonctionne sur téléphone, tablette et ordinateur.
        </p>
      )}
    </div>
  );
}
