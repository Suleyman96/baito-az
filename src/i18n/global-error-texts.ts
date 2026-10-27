import { defaultLocale, hasLocale, type Locale } from "./config";

/**
 * The few texts of app/global-error.tsx, which replaces the whole layout when it fails and so has no
 * dictionary to read. Copied here instead of importing the dictionaries, which would put every
 * language's full JSON into the browser bundle; a test keeps them equal to dictionary.errorPage.
 */
export const globalErrorTexts: Record<Locale, { errorTitle: string; errorText: string; retry: string; home: string }> = {
  az: {
    errorTitle: "Nəsə alınmadı",
    errorText: "Səhifəni göstərərkən gözlənilməz xəta baş verdi. Bir az sonra yenidən cəhd edin. Problem davam edərsə, ana səhifəyə qayıdın.",
    retry: "Yenidən cəhd et",
    home: "Ana səhifəyə qayıt",
  },
  en: {
    errorTitle: "Something went wrong",
    errorText: "An unexpected error occurred while showing this page. Please try again in a moment. If the problem continues, go back to the home page.",
    retry: "Try again",
    home: "Back to the home page",
  },
  ja: {
    errorTitle: "問題が発生しました",
    errorText: "ページの表示中に予期しないエラーが発生しました。しばらくしてからもう一度お試しください。問題が続く場合は、ホームに戻ってください。",
    retry: "もう一度試す",
    home: "ホームに戻る",
  },
  ru: {
    errorTitle: "Что-то пошло не так",
    errorText: "При показе страницы произошла непредвиденная ошибка. Попробуйте ещё раз чуть позже. Если проблема не исчезнет, вернитесь на главную.",
    retry: "Попробовать снова",
    home: "На главную",
  },
};

/** The language from the address (/az/..., /en/...), or the default one */
export function localeFromPath(pathname: string | null): Locale {
  const segment = pathname?.split("/")[1] ?? "";
  return hasLocale(segment) ? segment : defaultLocale;
}
