import { AdminNav } from "@/components/admin/AdminNav";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

// Each page checks the admin role itself (inside <Suspense>); the layout only renders navigation
export default async function AdminLayout({ children }: LayoutProps<"/[lang]/admin">) {
  const lang = await getLocale();
  const nav = getDictionary(lang).admin.nav;

  return (
    <div className="space-y-5">
      <AdminNav
        links={[
          { href: `/${lang}/admin`, label: nav.overview },
          { href: `/${lang}/admin/jobs`, label: nav.jobs },
          { href: `/${lang}/admin/users`, label: nav.users },
        ]}
      />
      {children}
    </div>
  );
}
