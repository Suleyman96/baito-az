import type { LegalDocument } from "@/components/legal/LegalDocument";

// The Privacy Policy and Terms of Use, in Azerbaijani only (the official text for every language).
// Each statement describes what the code actually does today; if a feature changes (e.g. new
// kinds of email, analytics, a new third-party service), update the text and legal.version.
// {placeholders} are filled from src/config/legal.ts and shown highlighted while still empty.

export const privacyPolicy: LegalDocument = {
  title: "Məxfilik siyasəti",
  lead: "Bu sənəd {site} saytında hansı şəxsi məlumatları topladığımızı, onlardan nə üçün istifadə etdiyimizi, kimin nəyi gördüyünü və məlumatlarınızla bağlı hüquqlarınızı izah edir.",
  sections: [
    {
      id: "operator",
      title: "Ümumi müddəalar və məlumatların operatoru",
      blocks: [
        "{site} iş axtaranlarla işəgötürənləri bir araya gətirən onlayn elan platformasıdır. Şəxsi məlumatlarınızın emalına görə məsul operator: {operatorName}, VÖEN: {operatorTaxId}, ünvan: {operatorAddress}.",
        "Məlumatlarınızı «Fərdi məlumatlar haqqında» Azərbaycan Respublikasının Qanunu və tətbiq olunan digər qanunvericilik əsasında emal edirik. Qeydiyyatdan keçərkən bu siyasəti və İstifadə qaydalarını oxuyub qəbul etdiyinizi təsdiq edirsiniz; razılığın tarixi və sənədlərin versiyası hesabınızla birlikdə saxlanılır.",
        "Vakansiyalara, şirkətlərə və açıq işçi profillərinə hesab olmadan baxmaq mümkündür. Bu zaman sizdən heç bir şəxsi məlumat istənilmir.",
      ],
    },
    {
      id: "data",
      title: "Hansı məlumatları toplayırıq",
      blocks: [
        "Yalnız aşağıdakı məlumatları, özünüz daxil etdikdə və ya saytdan istifadə etdikdə toplayırıq:",
        {
          list: [
            "Hesab məlumatları: ad, e-poçt ünvanı və/və ya mobil nömrə (ən azı biri), hesab növü (iş axtaran və ya işəgötürən), şifrə, qeydiyyat tarixi. Şifrə açıq şəkildə saxlanılmır, yalnız geri qaytarıla bilməyən şifrələnmiş formada (hash) saxlanılır.",
            "Profil şəkli (istəyə bağlı). İşəgötürənlərdə profil şəkli şirkətin loqosu kimi də göstərilir.",
            "Sosial şəbəkə linkləri (istəyə bağlı): Instagram, Facebook, TikTok, WhatsApp, Telegram.",
            "İşçi profili (iş axtaranlar üçün, istəyə bağlı): peşələr, bacarıqlar, təcrübə ili, iş tarixçəsi, sertifikatlar, özünüz haqqında mətn, yaş aralığı, yaşadığınız rayon və kənd, işləmək istədiyiniz rayonlar, gediş məsafəsi, köçməyə hazır olub-olmamağınız, iş növləri, işə başlama tarixi, iş günləri, gözlənilən əmək haqqı, iş yeri forması və 5-ə qədər portfolio şəkli.",
            "CV (iş axtaranlar üçün, istəyə bağlı; tam ştat vakansiyaya müraciət üçün tələb olunur): PDF, DOC və ya DOCX faylı, ən çox 5 MB.",
            "Şirkət məlumatları (işəgötürənlər üçün): şirkət adı (fərdi işəgötürənlər üçün boş qala bilər), təsvir, telefon, ünvan və xəritədə seçilmiş yer (koordinatlar).",
            "Elanlar: vakansiyanın mətni, əmək haqqı, iş yeri, əlaqə telefonu və 5-ə qədər şəkil.",
            "Saytdakı əlaqələr: müraciətlər və onlara əlavə etdiyiniz mesajlar, müraciətin statusu, yeni müraciət barədə bildirişlər və onların e-poçtla göndərilib-göndərilmədiyi, işəgötürənlərin göndərdiyi iş təklifləri və onlara cavablarınız, tamamlanmış iş üzrə yazdığınız və aldığınız rəylər (qiymət və şərh), saytdaxili bildirişlər.",
            "Texniki məlumatlar: giriş sessiyası (aşağıdakı «Cookie və brauzer yaddaşı» bölməsinə baxın) uğursuz giriş cəhdləri (daxil edilən e-poçt və ya telefon və cəhdin vaxtı) – şifrənin təxmin edilməsinin qarşısını almaq üçün, və şifrə bərpası linkləri (linkin yalnız şifrələnmiş forması (hash), göndərildiyi e-poçt və ya linki yaradan administrator, yaradılma və bitmə vaxtı).",
          ],
        },
        "Saytın dili brauzerinizin dil ayarına görə seçilir; bu ayar saxlanılmır. Saytın proqram kodu IP ünvanınızı verilənlər bazasında saxlamır, lakin hostinq provayderinin standart texniki jurnalları ola bilər (aşağıdakı «Üçüncü tərəf xidmətləri» bölməsinə baxın).",
      ],
    },
    {
      id: "purposes",
      title: "Məlumatlardan nə üçün istifadə edirik",
      blocks: [
        {
          list: [
            "Hesab yaratmaq, sizi tanımaq və hesabınıza girişi təmin etmək.",
            "Elanları dərc etmək, axtarmaq və filtrləmək; elanları dərcdən əvvəl moderasiya etmək.",
            "Müraciət göndərməyiniz, CV-nizin seçdiyiniz işəgötürənə çatdırılması və müraciətin statusunu izləməyiniz üçün.",
            "İşəgötürənə onun vakansiyasına gələn yeni müraciət barədə saytda və e-poçtla bildiriş göndərmək.",
            "Şifrənizi unutduqda, hesabınızın e-poçtuna şifrəni yeniləmək üçün link göndərmək; hesabınızda e-poçt yoxdursa, sizə e-poçtu hesaba əlavə etməyi xatırlatmaq.",
            "İşəgötürənlərin açıq profili olan namizədlərə sayt vasitəsilə iş təklifi göndərməsi üçün.",
            "Tamamlanmış iş üzrə qarşılıqlı rəyləri göstərmək.",
            "Saytın təhlükəsizliyini qorumaq: saxta elanların, spamın və icazəsiz girişin qarşısını almaq, qaydaları pozan hesabları məhdudlaşdırmaq.",
            "Qanunvericilikdən irəli gələn öhdəlikləri yerinə yetirmək.",
          ],
        },
        "Məlumatlarınızı satmırıq, reklam məqsədilə istifadə etmirik və reklam şəbəkələrinə ötürmürük. Sayt reklam və ya marketinq məktubları və SMS göndərmir. Yalnız iki növ xidməti məktub göndərilir. Birincisi, hesabında e-poçt ünvanı olan işəgötürənə onun vakansiyasına yeni müraciət gələndə: məktubda vakansiyanın adı, namizədin adı, müraciətin tarixi və müraciətə keçid olur; namizədin CV-si, telefonu və e-poçtu məktuba əlavə edilmir – onlara yalnız hesaba daxil olduqdan sonra saytda baxmaq olar. İkincisi, şifrənin bərpası istənildikdə, hesabın e-poçtuna: məktubda hesab sahibinin adı və şifrəni yeniləmək üçün birdəfəlik link olur. Yeni növ məktublar göndərilməzdən əvvəl bu siyasət yenilənəcək.",
      ],
    },
    {
      id: "visibility",
      title: "Kim nəyi görür",
      blocks: [
        {
          list: [
            "Hər kəs (hesabı olmayanlar da daxil olmaqla): moderasiyadan keçmiş elanları və onlardakı əlaqə telefonunu (elanda ayrıca telefon yoxdursa, şirkətin telefonunu); şirkət səhifəsini – adı, loqosu, təsviri, telefonu, ünvanı, xəritədəki yeri və sosial linkləri; profillərdəki rəyləri.",
            "İşçi profili: yalnız «Profilimi «İş axtaranlar» səhifəsində göstər» seçimini aktiv etdikdə iş axtaranlar kataloqunda və açıq profil səhifəsində hər kəsə görünür. Açıq profildə adınız, şəkliniz, işçi profilinin sahələri, portfolio şəkilləri və əlavə etdiyiniz sosial linklər göstərilir. E-poçt ünvanınız və telefon nömrəniz açıq profildə göstərilmir. Gizli profili yalnız siz görürsünüz.",
            "Müraciət etdiyiniz işəgötürən: adınızı, şəklinizi, telefon nömrənizi və e-poçtunuzu, müraciət mesajınızı və müraciətlə göndərilmiş CV-ni görür.",
            "CV: yalnız sizə, müraciət göndərdiyiniz işəgötürənlərə və saytın administratorlarına açıqdır. Digər hər kəs üçün bağlıdır və axtarış sistemlərində göstərilmir.",
            "İş təklifi: təklifi işəgötürən göndərir və onu yalnız siz və həmin işəgötürən görürsünüz; cavabınızı da yalnız həmin işəgötürən görür.",
            "Saytın administratorları: moderasiya və təhlükəsizlik üçün bütün hesabları (ad, e-poçt, telefon), elanları və müraciətlərin CV-lərini görə bilər.",
          ],
        },
        "Məlumatlarınızı qanunla nəzərdə tutulmuş hallarda və qaydada səlahiyyətli dövlət orqanlarına təqdim edə bilərik. Bundan və aşağıdakı «Üçüncü tərəf xidmətləri» bölməsində göstərilən hallardan başqa, məlumatlarınızı üçüncü şəxslərə ötürmürük.",
      ],
    },
    {
      id: "third-parties",
      title: "Üçüncü tərəf xidmətləri",
      blocks: [
        {
          list: [
            "Hostinq: sayt və verilənlər bazası {hosting} tərəfindən yerləşdirilir.",
            "E-poçt göndərişi: saytın məktubları (müraciət bildirişləri və şifrə bərpası) ABŞ şirkəti olan Resend xidməti vasitəsilə göndərilir. Bunun üçün alıcının e-poçt ünvanı və məktubun məzmunu (yuxarıdakı «Məlumatlardan nə üçün istifadə edirik» bölməsinə baxın) Resend-ə ötürülür və onun Azərbaycandan kənarda yerləşə bilən serverlərində emal olunur. Resend-in öz məxfilik qaydaları tətbiq olunur.",
            "Google Maps: xəritə funksiyası aktiv olduqda, şirkətin yerini seçmək və göstərmək üçün xəritə Google serverlərindən yüklənir. Bu zaman brauzeriniz Google ilə birbaşa əlaqə qurur və Google-un öz məxfilik qaydaları tətbiq olunur. «Google Maps-da aç» linkinə kliklədikdə Google Maps səhifəsinə keçirsiniz.",
            "Sosial şəbəkələr: profillərdəki Instagram, Facebook, TikTok, WhatsApp və Telegram linklərinə kliklədikdə həmin xidmətin saytına keçirsiniz; orada onların öz qaydaları tətbiq olunur.",
          ],
        },
        "Saytın şriftləri saytın öz serverindən yüklənir. Analitika, reklam və ya izləmə xidmətlərindən istifadə etmirik.",
      ],
    },
    {
      id: "cookies",
      title: "Cookie və brauzer yaddaşı",
      blocks: [
        {
          list: [
            "zw_session – hesaba daxil olduqda yaradılan zəruri cookie. Daxil olduğunuzu yadda saxlayır, JavaScript tərəfindən oxuna bilmir və 30 gün və ya hesabdan çıxana qədər qüvvədədir. Bazada yalnız onun şifrələnmiş (hash) forması saxlanılır.",
            "theme – brauzerinizin yaddaşında (localStorage) saxlanılan açıq/qaranlıq görünüş seçimi. Serverə göndərilmir.",
          ],
        },
        "Reklam və ya analitika cookie-lərindən istifadə etmirik. Brauzerinizdə cookie-ləri silə və ya bloklaya bilərsiniz, lakin bu halda hesaba daxil olmaq mümkün olmayacaq.",
      ],
    },
    {
      id: "security",
      title: "Məlumatların qorunması",
      blocks: [
        {
          list: [
            "Şifrələr və sessiya açarları geri qaytarıla bilməyən şifrələnmiş formada (hash) saxlanılır.",
            "Çoxsaylı uğursuz giriş cəhdindən sonra həmin hesaba giriş müvəqqəti bağlanır.",
            "Şifrə bərpası linki birdəfəlikdir, 60 dəqiqə etibarlıdır və bazada yalnız şifrələnmiş formada (hash) saxlanılır. Bir hesaba 60 dəqiqədə ən çox 3 belə məktub göndərilir. Şifrə link vasitəsilə yeniləndikdən sonra bütün cihazlarda hesabdan çıxılır.",
            "Hesabında e-poçt olmayan istifadəçi şifrəsini unutduqda, administrator onun müraciəti əsasında və şəxsiyyətini yoxladıqdan sonra (məsələn, hesaba bağlı nömrəyə zəng edərək) 24 saat etibarlı birdəfəlik bərpa linki yarada və onu istifadəçiyə verə bilər. Linki hansı administratorun yaratdığı qeyd olunur. Administrator hesabları üçün belə link yaradılmır.",
            "CV fayllarına giriş hər sorğuda yoxlanılır; yüklənən şəkil və sənədlərin növü faylın məzmununa görə yoxlanılır.",
            "Elanlar dərcdən əvvəl administrator tərəfindən yoxlanılır; qaydaları pozan hesablar bloklana bilər.",
          ],
        },
        "Məlumatları qorumaq üçün ağlabatan texniki və təşkilati tədbirlər görürük, lakin internet üzərindən heç bir ötürmə və saxlama üsulu tam təhlükəsizliyə zəmanət vermir. Hesabınızdan icazəsiz istifadə etdiyindən şübhələnirsinizsə, dərhal şifrənizi dəyişin və bizimlə əlaqə saxlayın.",
      ],
    },
    {
      id: "retention",
      title: "Məlumatların saxlanma müddəti",
      blocks: [
        {
          list: [
            "Hesab və profil məlumatları hesabınız aktiv olduğu müddətdə saxlanılır.",
            "Giriş sessiyası 30 gündən sonra və ya hesabdan çıxdıqda qüvvədən düşür.",
            "Uğursuz giriş cəhdləri 15 dəqiqədən sonra nəzərə alınmır və bazadan təmizlənir; uğurlu girişdən sonra həmin hesab üzrə qeydlər dərhal silinir.",
            "Şifrə bərpası linki istifadə edildikdə, şifrə dəyişdirildikdə və ya hesab silindikdə silinir; vaxtı keçmiş linklər növbəti bərpa sorğusunda bazadan təmizlənir.",
            "CV-ni dəyişdikdə və ya sildikdə köhnə fayl, heç bir müraciətə qoşulmayıbsa, silinir. Müraciətlə göndərilmiş CV, həmin işəgötürənin müraciəti görə bilməsi üçün müraciətlə birlikdə saxlanılır.",
            "Hesabı sildikdən sonra nəyin silindiyi və nəyin saxlandığı aşağıdakı «Hesabın silinməsi» bölməsində izah olunur.",
            "Ehtiyat nüsxələrdə məlumatların saxlanma müddəti: {backupRetention}.",
          ],
        },
      ],
    },
    {
      id: "rights",
      title: "Hüquqlarınız",
      blocks: [
        "Qanunvericiliyə uyğun olaraq aşağıdakı hüquqlara maliksiniz:",
        {
          list: [
            "Haqqınızda hansı məlumatların emal edildiyini, emalın məqsədini və məlumatların kimlərə açıq olduğunu bilmək.",
            "Məlumatlarınıza baxmaq və onların surətini tələb etmək. Məlumatların əksəriyyətini «Profil» və «İşçi profilim» səhifələrində özünüz görə bilərsiniz.",
            "Səhv və ya köhnəlmiş məlumatları düzəltmək. Ad, əlaqə məlumatları, profil, şirkət məlumatları, şəkil və CV-ni istənilən vaxt saytda özünüz dəyişə bilərsiniz.",
            "Məlumatlarınızın silinməsini tələb etmək və ya hesabınızı özünüz silmək.",
            "Razılığınızı geri götürmək. Bunun üçün hesabınızı silə və ya bizə yaza bilərsiniz; razılığın geri götürülməsi ondan əvvəl aparılmış emalın qanuniliyinə təsir etmir.",
            "Məlumatlarınızın emalına etiraz etmək və hüquqlarınızın pozulduğunu düşündükdə qanunvericiliklə müəyyən edilmiş səlahiyyətli dövlət orqanına və ya məhkəməyə müraciət etmək.",
          ],
        },
        "Saytda özünüz edə bilmədiyiniz sorğular üçün {operatorEmail} ünvanına yazın. Sorğunun sizə aid olduğunu yoxlamaq üçün hesabınıza bağlı e-poçt və ya telefondan yazmağınızı xahiş edə bilərik. Sorğulara {responseDays} gün ərzində cavab veririk.",
      ],
    },
    {
      id: "deletion",
      title: "Hesabın silinməsi",
      blocks: [
        "Hesabınızı «Profil» səhifəsindəki «Profili sil» bölməsində silə bilərsiniz: bunun üçün şifrənizi daxil edib silinməni təsdiqləməlisiniz. Silinmə geri qaytarılmır. Silinmə zamanı:",
        {
          list: [
            "e-poçt, telefon, profil şəkli, sosial linklər, bütün CV-lər, işçi profili və portfolio şəkilləri silinir;",
            "e-poçt və telefon nömrəniz azad olunur – onlarla yenidən qeydiyyatdan keçə bilərsiniz;",
            "işəgötürənin açıq və yoxlanışda olan elanları bağlanır, elanlardakı əlaqə telefonu, şirkətin təsviri, telefonu, ünvanı və xəritədəki yeri silinir;",
            "cavablanmamış iş təklifləri ləğv olunur və bütün giriş sessiyaları bitir.",
          ],
        },
        "Başqa istifadəçilərin tarixçəsini pozmamaq üçün hesabın qeydi silinmiş kimi işarələnərək saxlanılır: göndərilmiş müraciətlər (CV-siz), cavablanmış təkliflər və rəylər qalır, lakin onlarda adınızın yerinə «Silinmiş istifadəçi» göstərilir. Bu məlumatların da tam silinməsini istəyirsinizsə, {operatorEmail} ünvanına yazın.",
        "Hesabınız bloklanıbsa və daxil ola bilmirsinizsə, silinmə sorğusunu {operatorEmail} ünvanına göndərin.",
      ],
    },
    {
      id: "age",
      title: "Yaş həddi",
      blocks: [
        "Sayt 18 yaşı tamam olmuş şəxslər üçün nəzərdə tutulub. 18 yaşından kiçik şəxsin məlumatlarının saytda yerləşdirildiyini bilirsinizsə, bizə yazın.",
      ],
    },
    {
      id: "changes",
      title: "Siyasətdə dəyişikliklər",
      blocks: [
        "Bu siyasəti saytın funksiyaları və ya qanunvericilik dəyişdikdə yeniləyə bilərik. Hazırkı mətnin qüvvəyə minmə tarixi səhifənin yuxarısında göstərilib. Əhəmiyyətli dəyişikliklər barədə saytda əvvəlcədən məlumat veriləcək.",
      ],
    },
    {
      id: "contact",
      title: "Əlaqə",
      blocks: ["Məxfiliklə bağlı suallar və sorğular üçün: {operatorName}, {operatorAddress}, e-poçt: {operatorEmail}, telefon: {operatorPhone}."],
    },
  ],
};

export const termsOfUse: LegalDocument = {
  title: "İstifadə qaydaları",
  lead: "Bu qaydalar {site} saytından istifadənin şərtlərini müəyyən edir. Qeydiyyatdan keçməklə və ya saytdan istifadə etməklə bu qaydaları qəbul etmiş olursunuz.",
  sections: [
    {
      id: "general",
      title: "Ümumi müddəalar",
      blocks: [
        "{site} saytını {operatorName} (VÖEN: {operatorTaxId}, ünvan: {operatorAddress}) idarə edir (bundan sonra «biz»). Şəxsi məlumatlarınızın necə emal edildiyi Məxfilik siyasətində izah olunur və bu qaydaların ayrılmaz hissəsidir.",
        "Hazırda saytdan istifadə pulsuzdur. Saytdan yalnız 18 yaşı tamam olmuş şəxslər qeydiyyatdan keçə bilər.",
      ],
    },
    {
      id: "purpose",
      title: "Platformanın məqsədi və rolu",
      blocks: [
        "{site} iş elanlarının dərc edildiyi və iş axtaranlarla işəgötürənlərin bir-birini tapdığı onlayn platformadır. Sayt vasitəsilə işəgötürənlər elan yerləşdirir və namizədlərə iş təklifi göndərir, iş axtaranlar isə elanlara baxır, profil yaradır və müraciət edir.",
        "Biz işəgötürən, məşğulluq agentliyi və ya tərəflər arasında bağlanan əmək və ya xidmət müqaviləsinin tərəfi deyilik. İşə qəbul, əmək haqqı, iş şəraiti və digər şərtlər barədə qərarı yalnız iş axtaran və işəgötürən verir və bunlara görə özləri məsuliyyət daşıyırlar. Sayt iş tapılmasına və ya namizəd tapılmasına zəmanət vermir.",
      ],
    },
    {
      id: "account",
      title: "Hesab",
      blocks: [
        {
          list: [
            "Qeydiyyat zamanı öz real adınızı və sizə məxsus e-poçt və ya mobil nömrəni göstərin. Bir e-poçt və ya nömrə ilə yalnız bir hesab yaratmaq olar.",
            "Hesab növünü (iş axtaran və ya işəgötürən) düzgün seçin. Başqa şəxsin və ya şirkətin adından, onun icazəsi olmadan hesab yaratmaq qadağandır.",
            "Şifrənizi heç kimlə paylaşmayın. Hesabınız vasitəsilə edilən hərəkətlərə görə siz məsuliyyət daşıyırsınız. Hesabınızdan icazəsiz istifadə edildiyindən şübhələnirsinizsə, şifrəni dəyişin və bizə məlumat verin.",
          ],
        },
      ],
    },
    {
      id: "seekers",
      title: "İş axtaranların öhdəlikləri",
      blocks: [
        {
          list: [
            "Profildə, CV-də və müraciətlərdə yalnız doğru və aktual məlumat göstərin; təcrübənizi, bacarıqlarınızı və sənədlərinizi təhrif etməyin.",
            "Yalnız həqiqətən maraqlandığınız vakansiyalara müraciət edin.",
            "CV-yə və profilə başqa şəxslərin şəxsi məlumatlarını onların razılığı olmadan əlavə etməyin.",
          ],
        },
      ],
    },
    {
      id: "employers",
      title: "İşəgötürənlərin öhdəlikləri",
      blocks: [
        {
          list: [
            "Yalnız real, mövcud və qanuni işlər üçün elan yerləşdirin. Vəzifə, iş yeri, iş qrafiki, əmək haqqı və digər şərtlər doğru və aydın göstərilməlidir.",
            "Elanda və şirkət profilində sizə məxsus və ya istifadəsinə icazəniz olan əlaqə məlumatlarını göstərin.",
            "İş axtaranlardan işə qəbul müqabilində, sənəd, təlim, forma və ya hər hansı başqa ad altında ödəniş tələb etməyin.",
            "Namizədlərin müraciət, CV və əlaqə məlumatlarından yalnız həmin işə qəbul məqsədilə istifadə edin, onları üçüncü şəxslərə ötürməyin və işə qəbul başa çatdıqdan sonra lazımsız yerə saxlamayın.",
            "İş təkliflərini yalnız real vakansiyalar üçün göndərin. Sayt bir işəgötürənin bir gündə göndərə biləcəyi təkliflərin sayını məhdudlaşdırır.",
          ],
        },
        "Yeni və redaktə edilmiş elanlar administrator yoxlanışından sonra dərc olunur. Bir günlük işlər başlama vaxtı keçdikdən sonra siyahıdan avtomatik çıxarılır. Elan dərc edildikdən sonra onun məzmununa görə məsuliyyəti elanı yerləşdirən işəgötürən daşıyır.",
      ],
    },
    {
      id: "prohibited",
      title: "Qadağan olunan hərəkətlər və məzmun",
      blocks: [
        "Saytda aşağıdakılar qadağandır:",
        {
          list: [
            "saxta, mövcud olmayan və ya yanıldıcı elanlar, profillər və rəylər;",
            "dələduzluq: ilkin ödəniş, «qeydiyyat haqqı» və ya sənədlərin girov saxlanması tələbi, piramida və şəbəkə marketinqi sxemlərinə cəlb etmə və şəxsi və ya bank məlumatlarının aldadıcı yolla toplanması;",
            "cinsə, irqə, milliyyətə, dinə, dilə, yaşa, ailə vəziyyətinə, əqidəyə, əlilliyə və ya qanunla qorunan digər əlamətlərə görə ayrı-seçkilik edən tələblər və ifadələr (qanunla icazə verilən hallar istisna olmaqla);",
            "qanunsuz işlərə və fəaliyyətə dəvət, qanunsuz və ya təhqiramiz məzmun, nifrət nitqi, hədə və təqib;",
            "spam, eyni elanın təkrar-təkrar yerləşdirilməsi və işlə əlaqəsi olmayan reklam;",
            "başqa şəxsin adından çıxış etmək və ya başqalarının şəxsi məlumatlarını icazəsiz yerləşdirmək;",
            "saytdan məlumatların avtomatik vasitələrlə kütləvi toplanması, saytın təhlükəsizlik və moderasiya mexanizmlərindən yayınma, başqa hesablara icazəsiz giriş cəhdi, zərərli fayl və ya kod yükləmək.",
          ],
        },
      ],
    },
    {
      id: "content",
      title: "Müraciətlər, sosial linklər, rəylər və digər məzmun",
      blocks: [
        {
          list: [
            "Müraciətlər və iş təklifləri sayt vasitəsilə göndərilir. Müraciətin statusunu (məsələn, «Baxılıb», «Qəbul edildi», «Rədd edildi») işəgötürən təyin edir; status məlumat xarakterlidir və öz-özlüyündə müqavilə yaratmır.",
            "Profilə yalnız özünüzə və ya təmsil etdiyiniz şirkətə məxsus sosial şəbəkə hesablarının linklərini əlavə edin. Əlavə etdiyiniz linklər açıq profilinizdə hər kəsə görünür. Xarici saytların məzmununa görə məsuliyyət daşımırıq.",
            "Rəyi yalnız tamamlanmış işin iştirakçıları – işəgötürən və işə qəbul edilmiş iş axtaran – bir-biri haqqında yaza bilər. Rəy şəxsi təcrübəyə əsaslanmalı, dürüst olmalı, təhqir və başqalarının şəxsi məlumatlarını ehtiva etməməlidir.",
            "Yerləşdirdiyiniz məzmuna (mətn, şəkil, CV, rəy) görə siz məsuliyyət daşıyırsınız və onu yerləşdirmək hüququnuzun olduğunu təsdiq edirsiniz. Məzmun sizə məxsus qalır; onu yerləşdirməklə bizə həmin məzmunu saytın məqsədi üçün, bu qaydalara və Məxfilik siyasətinə uyğun olaraq saytda göstərmək hüququ verirsiniz.",
          ],
        },
      ],
    },
    {
      id: "moderation",
      title: "Moderasiya, hesabın məhdudlaşdırılması və silinməsi",
      blocks: [
        "Bu qaydaları və ya qanunvericiliyi pozan məzmuna və hesablara qarşı aşağıdakı tədbirləri görə bilərik:",
        {
          list: [
            "elanı səbəbini göstərərək rədd etmək və ya dərc edilmiş elanı saytdan çıxarmaq;",
            "qaydaları pozan rəyi və ya digər məzmunu silmək;",
            "hesabı bloklamaq: bloklanmış hesaba daxil olmaq mümkün olmur, onun bütün sessiyaları bitir və elanları gizlədilir.",
          ],
        },
        "Mümkün olduqda tədbirin səbəbi barədə məlumat veririk. Qərarla razı deyilsinizsə, {operatorEmail} ünvanına yaza bilərsiniz.",
        "Hesabınızı istənilən vaxt «Profil» səhifəsindəki «Profili sil» bölməsində silə bilərsiniz. Silinmə zamanı hansı məlumatların silindiyi Məxfilik siyasətində izah olunur.",
      ],
    },
    {
      id: "liability",
      title: "Məsuliyyətin məhdudlaşdırılması",
      blocks: [
        {
          list: [
            "Elanlar, profillər, CV-lər və rəylər istifadəçilər tərəfindən yerləşdirilir. Elanları dərcdən əvvəl yoxlasaq da, istifadəçilərin təqdim etdiyi məlumatların doğruluğuna, tamlığına və aktuallığına zəmanət vermirik.",
            "İşəgötürənlə görüşməzdən, sənəd təqdim etməzdən və ya razılığa gəlməzdən əvvəl məlumatları özünüz yoxlayın. Heç vaxt işə qəbul üçün ödəniş etməyin və şübhəli elanlar barədə bizə məlumat verin.",
            "Saytın fasiləsiz və xətasız işləməsinə çalışırıq, lakin texniki işlər, nasazlıqlar və ya bizdən asılı olmayan səbəblərdən fasilələr ola bilər.",
            "Qanunvericiliyin icazə verdiyi həddə, istifadəçilər arasındakı münasibətlərdən, istifadəçilərin hərəkətlərindən və ya yerləşdirdiyi məzmundan yaranan zərərə görə məsuliyyət daşımırıq. Bu müddəa qanunla məhdudlaşdırıla bilməyən məsuliyyətə şamil edilmir.",
          ],
        },
      ],
    },
    {
      id: "changes",
      title: "Qaydalarda dəyişikliklər",
      blocks: [
        "Bu qaydaları yeniləyə bilərik. Hazırkı mətnin qüvvəyə minmə tarixi səhifənin yuxarısında göstərilib. Əhəmiyyətli dəyişikliklər barədə saytda əvvəlcədən məlumat veriləcək; dəyişiklikdən sonra saytdan istifadəni davam etdirmək yeni qaydaları qəbul etmək deməkdir.",
      ],
    },
    {
      id: "law",
      title: "Tətbiq olunan hüquq və mübahisələr",
      blocks: [
        "Bu qaydalara Azərbaycan Respublikasının qanunvericiliyi tətbiq olunur. Mübahisələr ilk növbədə danışıqlar yolu ilə həll edilir; razılıq əldə olunmadıqda mübahisələrə Azərbaycan Respublikasının qanunvericiliyinə uyğun olaraq məhkəmədə baxılır.",
      ],
    },
    {
      id: "contact",
      title: "Əlaqə",
      blocks: ["Qaydalarla bağlı suallar və şikayətlər üçün: {operatorName}, {operatorAddress}, e-poçt: {operatorEmail}, telefon: {operatorPhone}."],
    },
  ],
};
