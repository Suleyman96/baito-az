import { notFound } from "next/navigation";

// Any address under a language that no other route matches (e.g. /az/old-link). Without this, such
// URLs never reach the [lang] layout and get Next.js's built-in English 404; this way they show
// [lang]/not-found.tsx in the visitor's language, with the site's header and footer.
export default function MissingPage() {
  notFound();
}
