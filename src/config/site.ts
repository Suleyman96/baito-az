// District-specific settings. Change these to adapt the site to another district.
export const site = {
  name: "ZaqaWork",
  currency: "AZN",
  categories: [
    "sales",
    "service",
    "agriculture",
    "construction",
    "education",
    "healthcare",
    "transport",
    "it",
    "office",
    "other",
  ],
  // District slugs are translated in the UI (see dictionaries); village names are proper nouns
  districts: {
    zaqatala: [
      "Zaqatala şəhəri", "Əliabad", "Aşağı Tala", "Yuxarı Tala", "Aşağı Çardaxlar", "Yuxarı Çardaxlar",
      "Bazar", "Car", "Danaçı", "Faldarlı", "Göyəm", "Kəpənəkçi", "Mamrux", "Maqov", "Mosul", "Muxax",
      "Qandax", "Qımır", "Sumaqallı", "Suvagil", "Tasmalı", "Zərnə",
    ],
    balaken: [
      "Balakən şəhəri", "Qabaqçöl", "Ağzıbirçala", "Böyük Bəhmətli", "Kiçik Bəhmətli", "Gülüzanbinə", "Hənifə",
      "İtitala", "Katex", "Mahamalar", "Mazımçay", "Püştətala", "Qarabaldır", "Qullar", "Şambul", "Talalar", "Tülü",
    ],
    qax: [
      "Qax şəhəri", "Qaşqaçay", "Almalı", "Əlibəyli", "Əmbərçay", "Ərəbbinə", "Fıstıqlı", "İlisu", "Kötüklü",
      "Lələpaşa", "Ləkit", "Marsan", "Meşəbaş", "Oncallı", "Qaxbaş", "Qax İngiloy", "Qaxmuğal", "Qorağan",
      "Qum", "Sarıbaş",
    ],
    sheki: [
      "Şəki şəhəri", "Aşağı Göynük", "Baş Göynük", "Aşağı Küngüt", "Baş Küngüt", "Aşağı Layısqı", "Baş Layısqı",
      "Aşağı Şabalıd", "Baş Şabalıd", "Baltalı", "Bideyiz", "Cunud", "Daşüz", "Dəhnə", "İnçə", "Kiş", "Oxud",
      "Qoxmuq", "Turan", "Zəyzid",
    ],
  },
} as const;

export type CategorySlug = (typeof site.categories)[number];
export type DistrictSlug = keyof typeof site.districts;
