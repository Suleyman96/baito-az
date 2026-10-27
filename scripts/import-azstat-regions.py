"""
Builds the list of Azerbaijan's cities, districts and settlements from the State Statistics Committee's
official classification ("İnzibati ərazi bölgüsü təsnifatı"):
  https://www.azstat.gov.az/tesnifat/cedeveller/arazi.jsp?parm=arazi

Usage:
  curl -sL -o /tmp/arazi.html "https://www.azstat.gov.az/tesnifat/cedeveller/arazi.jsp?parm=arazi"
  python3 scripts/import-azstat-regions.py /tmp/arazi.html

Writes prisma/data/az-regions.json and src/config/regions.ts. The migration that loads the data into the
database (prisma/migrations/*_all_regions) was generated from the same JSON with --sql.

How the classification is read (8-digit codes; the last digit is the kind of unit):
  2 = city of republican subordination, 1 = district (rayon), 3 = Baku's administrative districts,
  5/9 = administrative units (groupings, not places), 4 = town (ş.), 6 = settlement (q.), 8 = village (k.).
  The first 3 digits name the city or district a place belongs to; the first 5 its administrative unit.
Nothing is guessed: every place keeps its official code, and a place listed twice under one code is kept once.
"""
import html, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UP, LOW = "A-ZƏIÖÜĞŞÇİ", "a-zəıöüğşç"
ALPHABET = "aAbBcCçÇdDeEəƏfFgGğĞhHxXıIiİjJkKqQlLmMnNoOöÖpPrRsSşŞtTuUüÜvVyYzZ"


def az_key(s):
    """Sort key in Azerbaijani alphabetical order."""
    return [ALPHABET.index(ch) // 2 if ch in ALPHABET else 100 + ord(ch) for ch in s]


def rows(path):
    page = Path(path).read_text(encoding="utf-8")
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", page, re.S | re.I):
        cells = [html.unescape(re.sub(r"<[^>]+>", "", c)).strip() for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S | re.I)]
        if len(cells) == 2 and re.fullmatch(r"\d{8}", cells[0]):
            yield cells[0], cells[1]


def clean(name):
    """Row name -> place name: drops the kind marker ("k.", "q.", "ş.") and undoes letter spacing."""
    n = re.sub(r"\s+(k|q|ş)\s*\.?$", "", name.strip())
    tokens = [t for t in n.split(" ") if t]
    if len(tokens) >= 3 and sum(len(t) <= 2 for t in tokens) / len(tokens) > 0.7:
        # The unit's centre is letter-spaced in the original, which also hides word breaks;
        # every word of a place name starts with a capital ("Aşağı Göynük", "28 May")
        n = re.sub(r"\s+", "", n)
        n = re.sub(rf"(?<=[{LOW}])(?=[{UP}])", " ", n)
        n = re.sub(rf"(?<=\d)(?=[{UP}{LOW}])", " ", n)
    return re.sub(r"\s+", " ", n).strip()


def title(s):
    """'BALAKƏN RAYONU' -> 'Balakən', 'GƏNCƏ ŞƏHƏRİ' -> 'Gəncə'"""
    s = re.sub(r"\s+(RAYONU|ŞƏHƏRİ)$", "", re.sub(r"\s+", " ", s.strip()))
    return " ".join(w[:1] + w[1:].replace("I", "ı").replace("İ", "i").lower() for w in s.split(" "))


SLUG = str.maketrans({"ə": "e", "ı": "i", "ö": "o", "ü": "u", "ğ": "g", "ş": "sh", "ç": "ch"})


def slug(name):
    return re.sub(r"[^a-z]+", "-", name.lower().replace("i̇", "i").translate(SLUG)).strip("-")


def build(path):
    data = list(rows(path))
    units_of_places = {c[:5]: re.sub(r"\s+((kənd|qəsəbə|şəhər)\s+)?s?iəd\.?$", "", re.sub(r"^\d+\.\s*", "", n)).strip() for c, n in data if c[-1] in "59"}
    districts = {}
    for c, n in data:
        if c[-1] in "12":
            districts[c[:3]] = {"slug": slug(title(n)), "code": c, "name": title(n), "kind": "city" if c[-1] == "2" else "rayon", "naxcivan": c[0] == "1", "locations": []}
    baku = districts["000"]
    for d in districts.values():
        if d["kind"] == "city":  # the city itself, for jobs anywhere in it
            d["locations"].append({"code": d["code"], "name": f"{d['name']} şəhəri", "kind": "city"})
    for c, n in data:
        if c[-1] == "3":  # Baku's administrative districts are places inside Baku
            baku["locations"].append({"code": c, "name": re.sub(r"\s*\(.*\)$", "", re.sub(r"^[IVX]+\.\s*", "", n)).strip(), "kind": "baku_rayon"})
    seen, repeated = set(), []
    suffix = {"4": "şəhəri", "6": "qəsəbəsi", "8": ""}
    for c, n in data:
        if c[-1] not in "468":
            continue
        if c in seen:
            repeated.append([c, n])
            continue
        seen.add(c)
        parent = districts.get(c[:3]) or baku  # codes 001..012 are Baku's districts
        parent["locations"].append({"code": c, "name": f"{clean(n)} {suffix[c[-1]]}".strip(), "kind": {"4": "town", "6": "settlement", "8": "village"}[c[-1]], "unit": units_of_places.get(c[:5])})
    # The same name twice in one city/district: different places in different units -> name the unit
    for d in districts.values():
        names = [l["name"] for l in d["locations"]]
        for l in d["locations"]:
            if names.count(l["name"]) > 1:
                l["name"] = f"{l['name']} ({l['unit']} i.ə.d.)"
        order = {"city": 0, "baku_rayon": 1, "town": 2, "settlement": 3, "village": 4}
        d["locations"].sort(key=lambda l: (order[l["kind"]], az_key(l["name"])))
        for l in d["locations"]:
            l.pop("unit", None)
    result = sorted(districts.values(), key=lambda d: az_key(d["name"]))
    assert len({d["slug"] for d in result}) == len(result), "district slugs must be unique"
    return result, repeated


def write(path):
    districts, repeated = build(path)
    meta = {
        "source": "Azərbaycan Respublikasının Dövlət Statistika Komitəsi — İnzibati ərazi bölgüsü təsnifatı, 2024",
        "url": "https://www.azstat.gov.az/tesnifat/cedeveller/arazi.jsp?parm=arazi",
        "repeatedInSource": repeated,
    }
    (ROOT / "prisma/data/az-regions.json").write_text(json.dumps({**meta, "districts": districts}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    lines = ",\n".join(f'  {{ slug: "{d["slug"]}", code: "{d["code"]}", name: "{d["name"]}", kind: "{d["kind"]}"{", naxcivan: true" if d["naxcivan"] else ""} }}' for d in districts)
    (ROOT / "src/config/regions.ts").write_text(
        "// Generated by scripts/import-azstat-regions.py from the State Statistics Committee's classification\n"
        "// (İnzibati ərazi bölgüsü təsnifatı, 2024). Do not edit by hand; settlements are in the database.\n\n"
        "/** Azerbaijan's cities of republican subordination and districts, in Azerbaijani alphabetical order */\n"
        f"export const regions = [\n{lines},\n] as const;\n",
        encoding="utf-8",
    )
    print(f"{len(districts)} cities/districts, {sum(len(d['locations']) for d in districts)} places; repeated in source: {repeated}")


def sql(path):
    """Migration body: adds codes and every official place, keeping (and updating) existing rows."""
    districts, _ = build(path)
    q = lambda s: "'" + s.replace("'", "''") + "'"
    out = ['INSERT INTO "District" ("slug", "code") VALUES']
    out.append(",\n".join(f"  ({q(d['slug'])}, {q(d['code'])})" for d in districts))
    out.append('ON CONFLICT ("slug") DO UPDATE SET "code" = EXCLUDED."code";\n')
    out.append('INSERT INTO "Location" ("name", "districtId", "code", "position")')
    out.append('SELECT v."name", d."id", v."code", v."position" FROM (VALUES')
    values = []
    for d in districts:
        for i, l in enumerate(d["locations"]):
            values.append(f"  ({q(d['slug'])}, {q(l['name'])}, {q(l['code'])}, {i})")
    out.append(",\n".join(values))
    out.append(') AS v("slug", "name", "code", "position")')
    out.append('JOIN "District" d ON d."slug" = v."slug"')
    out.append('ON CONFLICT ("districtId", "name") DO UPDATE SET "code" = EXCLUDED."code", "position" = EXCLUDED."position";')
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    if "--sql" in sys.argv:
        print(sql(sys.argv[1]), end="")
    else:
        write(sys.argv[1])
