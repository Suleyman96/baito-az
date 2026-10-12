"use client";

import { ImagePlus, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ALLOWED_IMAGE_TYPES, imageUrl, MAX_IMAGE_BYTES, MAX_JOB_IMAGES } from "@/lib/images";
import { resizeImage } from "@/lib/resize-image";
import { t } from "@/lib/format";

type Texts = {
  imagesTitle: string;
  imagesHint: string;
  addImages: string;
  removeImage: string;
  undoRemove: string;
  imagesTooMany: string;
  imageTooLarge: string;
};

/**
 * Optional job images: keep, remove or add, with previews. The chosen files and removals live in the
 * parent (outside the job <form>, which remounts after a server error), so nothing is lost when the form re-renders.
 * Sends new files as "images" and removed saved images as "removeImage".
 */
export function ImagesField({
  existing,
  files,
  setFiles,
  removed,
  setRemoved,
  error,
  texts,
}: {
  existing: string[];
  files: File[];
  setFiles: (files: File[]) => void;
  removed: string[];
  setRemoved: (ids: string[]) => void;
  error?: string;
  texts: Texts;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const kept = existing.filter((id) => !removed.includes(id));
  const room = MAX_JOB_IMAGES - kept.length - files.length;

  // The real <input type="file"> that the form submits always holds exactly `files`
  useEffect(() => {
    if (!fileInput.current) return;
    const list = new DataTransfer();
    files.forEach((f) => list.items.add(f));
    fileInput.current.files = list.files;
  }, [files]);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  async function add(e: ChangeEvent<HTMLInputElement>) {
    const chosen = [...(e.target.files ?? [])];
    e.target.value = "";
    setClientError(null);
    if (chosen.length > room) setClientError(t(texts.imagesTooMany, { max: MAX_JOB_IMAGES }));
    // Shrunk in the browser: 1600 px is sharp on any screen and keeps uploads small on mobile data
    const resized = await Promise.all(chosen.slice(0, Math.max(0, room)).map((f) => resizeImage(f, 1600)));
    const fitting = resized.filter((f) => f.size <= MAX_IMAGE_BYTES);
    if (fitting.length < resized.length) setClientError(texts.imageTooLarge);
    setFiles([...files, ...fitting]);
  }

  const tile = "relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface-2";
  const removeButton = "absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80";

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{texts.imagesTitle}</legend>
      <p className="text-xs text-muted">{t(texts.imagesHint, { max: MAX_JOB_IMAGES })}</p>
      {removed.map((id) => (
        <input key={id} type="hidden" name="removeImage" value={id} />
      ))}
      <input ref={fileInput} type="file" name="images" multiple accept={ALLOWED_IMAGE_TYPES.join(",")} className="hidden" tabIndex={-1} aria-hidden />

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {existing.map((id) => {
          const isRemoved = removed.includes(id);
          return (
            <li key={id} className={tile}>
              {/* eslint-disable-next-line @next/next/no-img-element -- our own image route */}
              <img src={imageUrl(id)} alt="" className={`size-full object-cover ${isRemoved ? "opacity-30 grayscale" : ""}`} />
              {isRemoved ? (
                <button type="button" onClick={() => setRemoved(removed.filter((r) => r !== id))} className={`${removeButton} w-auto gap-1 px-2.5 text-xs font-semibold`}>
                  <RotateCcw className="size-3.5" aria-hidden />
                  {texts.undoRemove}
                </button>
              ) : (
                <button type="button" onClick={() => setRemoved([...removed, id])} aria-label={texts.removeImage} className={removeButton}>
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </li>
          );
        })}
        {files.map((file, i) => (
          <li key={`${file.name}-${i}`} className={tile}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview of a file not uploaded yet */}
            <img src={previews[i]} alt="" className="size-full object-cover" />
            <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={texts.removeImage} className={removeButton}>
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
        {room > 0 && (
          <li>
            <label className={`${tile} flex cursor-pointer flex-col items-center justify-center gap-1 border-dashed border-line-strong text-sm font-medium text-muted hover:border-brand hover:text-brand focus-within:ring-4 focus-within:ring-brand/20`}>
              <ImagePlus className="size-6" aria-hidden />
              {texts.addImages}
              <input type="file" multiple accept={ALLOWED_IMAGE_TYPES.join(",")} onChange={add} className="sr-only" />
            </label>
          </li>
        )}
      </ul>
      {(clientError ?? error) && <p className="text-sm text-red-600 dark:text-red-400">{clientError ?? error}</p>}
    </fieldset>
  );
}
