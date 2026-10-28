import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/PasswordResetForms";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { RESET_LINK_MINUTES } from "@/lib/auth/password-reset";

export default async function ForgotPasswordPage() {
  const lang = await getLocale();
  const dict = getDictionary(lang);

  return (
    <AuthCard title={dict.passwordReset.forgotTitle}>
      <ForgotPasswordForm lang={lang} minutes={RESET_LINK_MINUTES} t={dict.passwordReset} auth={dict.auth} />
    </AuthCard>
  );
}
