"use client";

import { Camera, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { removeAvatar, updateAvatar } from "@/lib/auth/account-actions";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/images";
import { resizeImage } from "@/lib/resize-image";
import { Avatar } from "../Avatar";
import { buttonClass } from "../ui";

/**
 * Profile photo with preview: choose → see it → save. Also used as the company logo for employers.
 * Render it with key={avatarId}: after a save the id changes and the form starts fresh.
 */
export function AvatarForm({ lang, dict, name, avatarId }: { lang: Locale; dict: Dictionary; name: string; avatarId: string | null }) {
  const [state, action, pending] = useActionState(updateAvatar, undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const u = dict.upload;

  // Free the preview's memory when it is replaced or the form goes away
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);
  const shownPreview = preview;

  async function choose(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setClientError(null);
    if (!file) return setPreview(null);
    // Profile photos are shown small, so 512 px is plenty
    const small = await resizeImage(file, 512);
    if (small.size > MAX_IMAGE_BYTES) return setClientError(u.imageTooLarge);
    const files = new DataTransfer();
    files.items.add(small);
    e.target.files = files.files;
    setPreview(URL.createObjectURL(small));
  }

  const error = clientError ?? (state?.error ? u[state.error] : null);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-lg font-semibold">{u.photoTitle}</h2>
      <p className="text-sm text-muted">{u.photoHint}</p>
      <div className="mt-4 flex flex-wrap items-center gap-5">
        {shownPreview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview of a file not uploaded yet
          <img src={shownPreview} alt="" className="size-24 rounded-3xl object-cover" />
        ) : (
          <Avatar name={name} imageId={avatarId} size="xl" />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <form action={action} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="lang" value={lang} />
            <label className={`${buttonClass.secondary} cursor-pointer focus-within:ring-4 focus-within:ring-accent/20`}>
              <Camera className="size-4" aria-hidden />
              {avatarId || shownPreview ? u.changePhoto : u.choosePhoto}
              <input type="file" name="avatar" accept={ALLOWED_IMAGE_TYPES.join(",")} onChange={choose} className="sr-only" />
            </label>
            {shownPreview && (
              <button type="submit" disabled={pending} className={buttonClass.primary}>
                {pending ? u.uploading : dict.account.save}
              </button>
            )}
          </form>
          {avatarId && !shownPreview && (
            <form action={removeAvatar}>
              <input type="hidden" name="lang" value={lang} />
              <button type="submit" className={`${buttonClass.secondary} hover:border-error hover:text-error`}>
                <Trash2 className="size-4" aria-hidden />
                {u.removePhoto}
              </button>
            </form>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      )}
    </section>
  );
}
