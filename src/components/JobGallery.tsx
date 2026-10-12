import { imageUrl } from "@/lib/images";

/** Job images: the first one large, the rest as thumbnails. Each opens full size in a new tab. */
export function JobGallery({ images, title, label }: { images: { id: string }[]; title: string; label: string }) {
  if (images.length === 0) return null;
  const [first, ...rest] = images;
  const link = "block overflow-hidden rounded-xl border border-line bg-surface-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25";

  return (
    <section aria-label={label} className="space-y-2">
      <a href={imageUrl(first.id)} target="_blank" rel="noreferrer" className={link}>
        {/* eslint-disable-next-line @next/next/no-img-element -- our own image route with long caching */}
        <img src={imageUrl(first.id)} alt={title} className="aspect-[16/9] w-full object-cover" />
      </a>
      {rest.length > 0 && (
        <ul className="grid grid-cols-4 gap-2">
          {rest.map((image, i) => (
            <li key={image.id}>
              <a href={imageUrl(image.id)} target="_blank" rel="noreferrer" className={link}>
                {/* eslint-disable-next-line @next/next/no-img-element -- our own image route with long caching */}
                <img src={imageUrl(image.id)} alt={`${title} (${i + 2})`} loading="lazy" className="aspect-square w-full object-cover" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
