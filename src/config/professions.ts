import type { Locale } from "@/i18n/config";

// Professions and skills for job seeker profiles: one place for the codes stored in the database
// (e.g. "electrician") and their names in every language. Add an entry here and it appears in the
// profile form, the directory filters and the profile pages.

type Names = Record<Locale, string>;
type Option = { slug: string; name: Names };
type Group = { slug: string; name: Names; items: Option[] };

const o = (slug: string, az: string, en: string, ja: string, ru: string): Option => ({ slug, name: { az, en, ja, ru } });

export const professionGroups: Group[] = [
  {
    slug: "construction",
    name: { az: "Tikinti və təmir", en: "Construction and repair", ja: "建設・修理", ru: "Строительство и ремонт" },
    items: [
      o("builder", "Bənna", "Builder", "建設作業員", "Каменщик"),
      o("laborer", "Fəhlə", "General laborer", "作業員", "Разнорабочий"),
      o("electrician", "Elektrik", "Electrician", "電気工", "Электрик"),
      o("plumber", "Santexnik", "Plumber", "配管工", "Сантехник"),
      o("painter", "Malyar", "Painter", "塗装工", "Маляр"),
      o("carpenter", "Dülgər", "Carpenter", "大工", "Плотник"),
      o("welder", "Qaynaqçı", "Welder", "溶接工", "Сварщик"),
      o("tiler", "Kafelçi", "Tiler", "タイル職人", "Плиточник"),
      o("roofer", "Dam ustası", "Roofer", "屋根職人", "Кровельщик"),
    ],
  },
  {
    slug: "hospitality",
    name: { az: "Restoran və qonaqlama", en: "Hospitality and food", ja: "飲食・宿泊", ru: "Общепит и гостиницы" },
    items: [
      o("waiter", "Ofisiant", "Waiter", "ウェイター", "Официант"),
      o("cook", "Aşpaz", "Cook", "調理師", "Повар"),
      o("cook_assistant", "Aşpaz köməkçisi", "Kitchen assistant", "調理補助", "Помощник повара"),
      o("barista", "Barista", "Barista", "バリスタ", "Бариста"),
      o("dishwasher", "Qabyuyan", "Dishwasher", "皿洗い", "Посудомойщик"),
      o("hotel_staff", "Otel işçisi", "Hotel staff", "ホテルスタッフ", "Сотрудник отеля"),
    ],
  },
  {
    slug: "logistics",
    name: { az: "Nəqliyyat və logistika", en: "Transport and logistics", ja: "運輸・物流", ru: "Транспорт и логистика" },
    items: [
      o("driver", "Sürücü", "Driver", "運転手", "Водитель"),
      o("courier", "Kuryer", "Courier", "配達員", "Курьер"),
      o("warehouse_worker", "Anbar işçisi", "Warehouse worker", "倉庫作業員", "Работник склада"),
      o("loader", "Yükdaşıyan", "Loader", "荷役作業員", "Грузчик"),
      o("tractor_driver", "Traktorçu", "Tractor driver", "トラクター運転手", "Тракторист"),
    ],
  },
  {
    slug: "cleaning",
    name: { az: "Təmizlik və həyət işləri", en: "Cleaning and yard work", ja: "清掃・庭仕事", ru: "Уборка и работа во дворе" },
    items: [
      o("cleaner", "Təmizlikçi", "Cleaner", "清掃員", "Уборщик"),
      o("housekeeper", "Ev işləri köməkçisi", "Housekeeper", "家事代行", "Домработница"),
      o("gardener", "Bağban", "Gardener", "庭師", "Садовник"),
      o("yard_worker", "Həyət işçisi", "Yard worker", "庭の作業員", "Дворник"),
    ],
  },
  {
    slug: "sales",
    name: { az: "Satış və ticarət", en: "Sales and retail", ja: "販売・小売", ru: "Продажи и торговля" },
    items: [
      o("sales_assistant", "Satış məsləhətçisi", "Sales assistant", "販売員", "Продавец-консультант"),
      o("cashier", "Kassir", "Cashier", "レジ係", "Кассир"),
      o("market_seller", "Bazar satıcısı", "Market seller", "市場の販売員", "Продавец на рынке"),
      o("merchandiser", "Merçendayzer", "Merchandiser", "品出し担当", "Мерчендайзер"),
    ],
  },
  {
    slug: "agriculture",
    name: { az: "Kənd təsərrüfatı", en: "Agriculture", ja: "農業", ru: "Сельское хозяйство" },
    items: [
      o("farm_worker", "Ferma işçisi", "Farm worker", "農場作業員", "Работник фермы"),
      o("harvester", "Məhsul yığımı (fındıq, meyvə)", "Harvest worker (hazelnut, fruit)", "収穫作業員（ヘーゼルナッツ・果物）", "Сборщик урожая (фундук, фрукты)"),
      o("shepherd", "Çoban", "Shepherd", "羊飼い", "Пастух"),
      o("beekeeper", "Arıçı", "Beekeeper", "養蜂家", "Пчеловод"),
    ],
  },
  {
    slug: "manufacturing",
    name: { az: "İstehsal və sənət", en: "Manufacturing and crafts", ja: "製造・工芸", ru: "Производство и ремёсла" },
    items: [
      o("factory_worker", "Fabrik işçisi", "Factory worker", "工場作業員", "Рабочий на производстве"),
      o("machine_operator", "Dəzgah operatoru", "Machine operator", "機械オペレーター", "Оператор станка"),
      o("tailor", "Dərzi", "Tailor", "仕立て職人", "Портной"),
      o("baker", "Çörəkçi", "Baker", "パン職人", "Пекарь"),
    ],
  },
  {
    slug: "it",
    name: { az: "İT və dizayn", en: "IT and design", ja: "IT・デザイン", ru: "IT и дизайн" },
    items: [
      o("web_developer", "Veb proqramçı", "Web developer", "ウェブ開発者", "Веб-разработчик"),
      o("it_support", "İT dəstək", "IT support", "ITサポート", "IT-поддержка"),
      o("designer", "Dizayner", "Designer", "デザイナー", "Дизайнер"),
      o("smm", "SMM mütəxəssisi", "Social media manager", "SNS運用担当", "SMM-специалист"),
    ],
  },
  {
    slug: "office",
    name: { az: "Ofis işi", en: "Office work", ja: "事務", ru: "Офисная работа" },
    items: [
      o("office_assistant", "Ofis köməkçisi", "Office assistant", "事務補助", "Офис-ассистент"),
      o("computer_operator", "Kompüter operatoru", "Computer operator", "パソコンオペレーター", "Оператор ПК"),
      o("accountant", "Mühasib", "Accountant", "経理", "Бухгалтер"),
      o("receptionist", "Resepşn", "Receptionist", "受付", "Администратор на ресепшене"),
    ],
  },
  {
    slug: "education",
    name: { az: "Təhsil", en: "Education", ja: "教育", ru: "Образование" },
    items: [
      o("teacher", "Müəllim", "Teacher", "教師", "Учитель"),
      o("tutor", "Repetitor", "Tutor", "家庭教師", "Репетитор"),
      o("preschool_teacher", "Tərbiyəçi", "Preschool teacher", "保育士", "Воспитатель"),
    ],
  },
  {
    slug: "care",
    name: { az: "Səhiyyə və qulluq", en: "Health and care", ja: "医療・介護", ru: "Здоровье и уход" },
    items: [
      o("nurse", "Tibb bacısı", "Nurse", "看護師", "Медсестра"),
      o("caregiver", "Baxıcı", "Caregiver", "介護士", "Сиделка"),
      o("babysitter", "Dayə", "Babysitter", "ベビーシッター", "Няня"),
    ],
  },
  {
    slug: "other",
    name: { az: "Digər", en: "Other", ja: "その他", ru: "Другое" },
    items: [
      o("security_guard", "Mühafizəçi", "Security guard", "警備員", "Охранник"),
      o("hairdresser", "Bərbər / Saç ustası", "Hairdresser", "美容師", "Парикмахер"),
      o("mechanic", "Avtomexanik", "Car mechanic", "自動車整備士", "Автомеханик"),
      o("other_work", "Digər iş", "Other work", "その他の仕事", "Другая работа"),
    ],
  },
];

export const skillGroups: Group[] = [
  {
    slug: "driving",
    name: { az: "Sürücülük", en: "Driving", ja: "運転", ru: "Вождение" },
    items: [
      o("license_b", "B kateqoriyası", "Driving licence B", "普通免許（B）", "Права категории B"),
      o("license_c", "C kateqoriyası", "Driving licence C", "大型免許（C）", "Права категории C"),
      o("forklift", "Forklift idarəsi", "Forklift operation", "フォークリフト", "Погрузчик"),
    ],
  },
  {
    slug: "languages",
    name: { az: "Dillər", en: "Languages", ja: "言語", ru: "Языки" },
    items: [
      o("lang_russian", "Rus dili", "Russian", "ロシア語", "Русский язык"),
      o("lang_english", "İngilis dili", "English", "英語", "Английский язык"),
      o("lang_turkish", "Türk dili", "Turkish", "トルコ語", "Турецкий язык"),
      o("lang_georgian", "Gürcü dili", "Georgian", "ジョージア語", "Грузинский язык"),
    ],
  },
  {
    slug: "computer",
    name: { az: "Kompüter", en: "Computer", ja: "パソコン", ru: "Компьютер" },
    items: [
      o("computer_basics", "Kompüter bilikləri", "Computer basics", "パソコン基礎", "Базовые навыки ПК"),
      o("ms_office", "Word, Excel", "Word, Excel", "Word・Excel", "Word, Excel"),
      o("accounting_software", "1C / mühasibat proqramları", "Accounting software (1C)", "会計ソフト（1C）", "1С / бухгалтерские программы"),
      o("social_media", "Sosial media", "Social media", "SNS運用", "Социальные сети"),
    ],
  },
  {
    slug: "trades",
    name: { az: "Usta işləri", en: "Trade skills", ja: "技能", ru: "Ремесленные навыки" },
    items: [
      o("electrical_work", "Elektrik işləri", "Electrical work", "電気工事", "Электромонтаж"),
      o("plumbing_work", "Santexnika işləri", "Plumbing", "配管工事", "Сантехнические работы"),
      o("welding", "Qaynaq", "Welding", "溶接", "Сварка"),
      o("painting_work", "Rəngsazlıq", "Painting", "塗装", "Покраска"),
      o("woodwork", "Ağac işləri", "Woodwork", "木工", "Работа по дереву"),
      o("sewing", "Tikiş", "Sewing", "裁縫", "Шитьё"),
      o("car_repair", "Avtomobil təmiri", "Car repair", "自動車修理", "Ремонт автомобилей"),
    ],
  },
  {
    slug: "service",
    name: { az: "Xidmət", en: "Service", ja: "接客・サービス", ru: "Обслуживание" },
    items: [
      o("customer_service", "Müştəri ilə iş", "Customer service", "接客", "Работа с клиентами"),
      o("cash_handling", "Kassa ilə iş", "Cash handling", "レジ操作", "Работа с кассой"),
      o("cooking", "Yemək hazırlama", "Cooking", "調理", "Приготовление пищи"),
      o("cleaning_skill", "Təmizlik", "Cleaning", "清掃", "Уборка"),
    ],
  },
  {
    slug: "outdoor",
    name: { az: "Bağ və fiziki iş", en: "Garden and physical work", ja: "庭仕事・力仕事", ru: "Сад и физическая работа" },
    items: [
      o("gardening", "Bağçılıq", "Gardening", "園芸", "Садоводство"),
      o("animal_care", "Heyvanlara qulluq", "Animal care", "動物の世話", "Уход за животными"),
      o("heavy_lifting", "Ağır yük daşıma", "Heavy lifting", "重量物の運搬", "Переноска тяжестей"),
    ],
  },
  {
    slug: "care_skills",
    name: { az: "Qulluq", en: "Care", ja: "ケア", ru: "Уход" },
    items: [
      o("childcare", "Uşaq baxımı", "Childcare", "育児", "Уход за детьми"),
      o("elderly_care", "Yaşlılara qulluq", "Elderly care", "高齢者介護", "Уход за пожилыми"),
      o("first_aid", "İlk yardım", "First aid", "応急手当", "Первая помощь"),
    ],
  },
];

export const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+"] as const;
export type AgeRange = (typeof AGE_RANGES)[number];

const allOf = (groups: Group[]) => new Map(groups.flatMap((g) => g.items.map((i) => [i.slug, { ...i, group: g.slug }] as const)));
const PROFESSIONS = allOf(professionGroups);
const SKILLS = allOf(skillGroups);

export const isProfession = (slug: string) => PROFESSIONS.has(slug);
export const isSkill = (slug: string) => SKILLS.has(slug);
export const isProfessionGroup = (slug: string) => professionGroups.some((g) => g.slug === slug);

export const professionName = (slug: string, lang: Locale) => PROFESSIONS.get(slug)?.name[lang] ?? slug;
export const skillName = (slug: string, lang: Locale) => SKILLS.get(slug)?.name[lang] ?? slug;
export const professionGroupOf = (slug: string) => PROFESSIONS.get(slug)?.group;
export const professionsInGroup = (group: string) => professionGroups.find((g) => g.slug === group)?.items.map((i) => i.slug) ?? [];

/** Profession and skill codes whose name (in any language) contains `text`; used by the directory search. */
export function matchingSlugs(text: string) {
  const needle = text.toLocaleLowerCase();
  const match = (map: typeof PROFESSIONS) =>
    [...map.values()].filter((i) => Object.values(i.name).some((n) => n.toLocaleLowerCase().includes(needle))).map((i) => i.slug);
  return { professions: match(PROFESSIONS), skills: match(SKILLS) };
}

/** Options for a picker in one language: groups with their items. */
export function pickerOptions(groups: Group[], lang: Locale) {
  return groups.map((g) => ({ label: g.name[lang], items: g.items.map((i) => ({ value: i.slug, label: i.name[lang] })) }));
}
