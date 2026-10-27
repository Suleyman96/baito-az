import { describe, expect, it } from "vitest";
import { locales } from "../../i18n/config";
import az from "../../i18n/dictionaries/az.json";
import en from "../../i18n/dictionaries/en.json";
import ja from "../../i18n/dictionaries/ja.json";
import ru from "../../i18n/dictionaries/ru.json";
import { globalErrorTexts, localeFromPath } from "../../i18n/global-error-texts";

const dictionaries = { az, en, ja, ru };

describe("globalErrorTexts", () => {
  it.each(locales)("matches dictionary.errorPage in %s", (lang) => {
    const page = dictionaries[lang].errorPage;
    expect(globalErrorTexts[lang]).toEqual({ errorTitle: page.errorTitle, errorText: page.errorText, retry: page.retry, home: page.home });
  });
});

describe("localeFromPath", () => {
  it("reads the language from the first path segment", () => {
    expect(localeFromPath("/ru/jobs/abc")).toBe("ru");
    expect(localeFromPath("/ja")).toBe("ja");
  });

  it("falls back to the default language", () => {
    expect(localeFromPath("/xx/jobs")).toBe("az");
    expect(localeFromPath("/")).toBe("az");
    expect(localeFromPath(null)).toBe("az");
  });
});
