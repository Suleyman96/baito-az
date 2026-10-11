import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type EmploymentType } from "../src/generated/prisma/client";
import { site, type DistrictSlug } from "../src/config/site";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Demo accounts are listed in the README so reviewers can try the site
const DEMO_PASSWORD = "demo1234";

const jobs: {
  title: string;
  description: string;
  type: EmploymentType;
  salary: [number | null, number | null];
  category: string;
  location: [DistrictSlug, string];
  company: 0 | 1;
}[] = [
  { title: "Satış məsləhətçisi", description: "Mağazada müştərilərə xidmət, kassa ilə iş. Təcrübə tələb olunmur, təlim veriləcək.", type: "FULL_TIME", salary: [450, 600], category: "sales", location: ["zaqatala", "Zaqatala şəhəri"], company: 0 },
  { title: "Kassir (axşam növbəsi)", description: "Həftədə 4 gün, 18:00–23:00. Tələbələr üçün uyğundur.", type: "PART_TIME", salary: [300, 350], category: "sales", location: ["zaqatala", "Zaqatala şəhəri"], company: 0 },
  { title: "Anbar işçisi", description: "Malların qəbulu və yerləşdirilməsi. Fiziki cəhətdən sağlam olmaq.", type: "FULL_TIME", salary: [500, null], category: "other", location: ["zaqatala", "Əliabad"], company: 0 },
  { title: "Ofisiant", description: "Restoranda ofisiant. Nəzakətli ünsiyyət, komanda işi.", type: "PART_TIME", salary: [250, 400], category: "service", location: ["sheki", "Şəki şəhəri"], company: 1 },
  { title: "Aşpaz köməkçisi", description: "Mətbəxdə hazırlıq işləri. Yemək və iş geyimi təmin olunur.", type: "FULL_TIME", salary: [450, 550], category: "service", location: ["sheki", "Şəki şəhəri"], company: 1 },
  { title: "Fındıq bağında mövsümi işçi", description: "Avqust–sentyabr ayları fındıq yığımı. Nəqliyyat təmin olunur.", type: "PART_TIME", salary: [null, null], category: "agriculture", location: ["qax", "İlisu"], company: 1 },
  { title: "Sürücü (B kateqoriya)", description: "Məhsulların kəndlərə çatdırılması. Ən azı 2 il sürücülük təcrübəsi.", type: "FULL_TIME", salary: [600, 700], category: "transport", location: ["balaken", "Katex"], company: 0 },
  { title: "İngilis dili müəllimi", description: "Uşaqlar üçün kurs, həftədə 3 gün.", type: "PART_TIME", salary: [400, null], category: "education", location: ["balaken", "Balakən şəhəri"], company: 1 },
  { title: "Kompüter operatoru", description: "Sənədlərin hazırlanması, Excel və Word biliyi.", type: "FULL_TIME", salary: [500, 600], category: "office", location: ["qax", "Qax şəhəri"], company: 0 },
  { title: "Veb sayt dəstəyi (uzaqdan)", description: "Mağazanın onlayn kataloqunun yenilənməsi. HTML/CSS əsas bilikləri.", type: "PART_TIME", salary: [300, 500], category: "it", location: ["zaqatala", "Car"], company: 0 },
];

async function main() {
  // Start from a clean slate so the seed can be re-run safely
  await db.application.deleteMany();
  await db.job.deleteMany();
  await db.company.deleteMany();
  await db.user.deleteMany();
  // Removes villages that were dropped from the config
  await db.location.deleteMany();

  for (const slug of site.categories) {
    await db.category.upsert({ where: { slug }, update: {}, create: { slug } });
  }
  for (const [slug, villages] of Object.entries(site.districts)) {
    const district = await db.district.upsert({ where: { slug }, update: {}, create: { slug } });
    for (const name of villages) {
      await db.location.upsert({
        where: { districtId_name: { districtId: district.id, name } },
        update: {},
        create: { name, districtId: district.id },
      });
    }
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await db.user.create({
    data: { email: "admin@zaqawork.test", name: "Admin", role: "ADMIN", passwordHash },
  });
  await db.user.create({
    data: { email: "seeker@zaqawork.test", phone: "+994501110001", name: "Əli Məmmədov", role: "SEEKER", passwordHash },
  });

  const companies = await Promise.all(
    [
      { email: "market@zaqawork.test", owner: "Rəşad Həsənov", name: "Bərəkət Market", phone: "+994 50 000 00 01" },
      { email: "restoran@zaqawork.test", owner: "Leyla Quliyeva", name: "Dağ Restoranı", phone: "+994 50 000 00 02" },
    ].map((c) =>
      db.company.create({
        data: {
          name: c.name,
          phone: c.phone,
          owner: { create: { email: c.email, name: c.owner, role: "EMPLOYER", passwordHash } },
        },
      }),
    ),
  );

  const categories = await db.category.findMany();
  const locations = await db.location.findMany({ include: { district: true } });

  for (const [i, job] of jobs.entries()) {
    await db.job.create({
      data: {
        title: job.title,
        description: job.description,
        employmentType: job.type,
        salaryMin: job.salary[0],
        salaryMax: job.salary[1],
        companyId: companies[job.company].id,
        categoryId: categories.find((c) => c.slug === job.category)!.id,
        locationId: locations.find((l) => l.district.slug === job.location[0] && l.name === job.location[1])!.id,
        // Spread creation dates so "newest first" ordering is visible
        createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 20),
      },
    });
  }

  console.log(`Seeded ${jobs.length} jobs. Demo password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
