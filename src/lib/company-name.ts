/**
 * The key two company names are compared by: case, extra spaces and the dotted/dotless "i" do not
 * matter ("BƏRƏKƏT  Market" = "Bərəkət market", "İSTİ" = "isti").
 * The migration that added Company.nameKey computes the same key in SQL; keep the two in step.
 */
export function companyNameKey(name: string): string {
  return name
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[İIı]/g, "i")
    .toLowerCase()
    .replace(/̇/g, "");
}
