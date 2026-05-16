import json
import pathlib

PACK_PATH = pathlib.Path(
    "/Volumes/ExtremePro/project/learning-web/data/Packs/ks3/history/black_death/pack_unified.json"
)

TERM_MAP = {
    "bd_vocab_001": "The Black Death",
    "bd_vocab_002": "Bubonic plague",
    "bd_vocab_003": "Fleas",
    "bd_vocab_004": "Rats",
    "bd_vocab_005": "Trade routes",
    "bd_vocab_006": "Central Asia",
    "bd_vocab_007": "June 1348",
    "bd_vocab_008": "Melcombe Regis",
    "bd_vocab_009": "August 1348 (Bristol)",
    "bd_vocab_010": "November 1348 (London)",
    "bd_vocab_011": "1349 (Parliament)",
    "bd_vocab_012": "Summer 1349",
    "bd_vocab_013": "1349 (Wales)",
    "bd_vocab_014": "1349 (Ireland)",
    "bd_vocab_015": "One third",
    "bd_vocab_016": "1.5 million deaths",
    "bd_vocab_017": "25 million deaths in Europe",
    "bd_vocab_018": "5,000 deaths per day",
    "bd_vocab_019": "Early symptoms",
    "bd_vocab_020": "Buboes",
    "bd_vocab_021": "High fever",
    "bd_vocab_022": "Black blotches",
    "bd_vocab_023": "Five days",
    "bd_vocab_024": "Miasma theory",
    "bd_vocab_025": "Bad air",
    "bd_vocab_026": "God's punishment",
    "bd_vocab_027": "Prayer",
    "bd_vocab_028": "Flagellants",
    "bd_vocab_029": "Astrology",
    "bd_vocab_030": "Planetary conjunction",
    "bd_vocab_031": "Poor sanitation",
    "bd_vocab_032": "Open sewers",
    "bd_vocab_033": "Illiteracy",
    "bd_vocab_034": "Pomanders",
    "bd_vocab_035": "Leeches",
    "bd_vocab_036": "Live animals",
    "bd_vocab_037": "Butter",
    "bd_vocab_038": "Physicians",
    "bd_vocab_039": "Diagnosis by observation",
    "bd_vocab_040": "Social upheaval",
    "bd_vocab_041": "Deserted villages",
    "bd_vocab_042": "New towns",
    "bd_vocab_043": "Scapegoating",
    "bd_vocab_044": "Jewish persecution",
    "bd_vocab_045": "Economic disruption",
    "bd_vocab_046": "Abandoned farmland",
    "bd_vocab_047": "Livestock deaths",
    "bd_vocab_048": "Food price rises",
    "bd_vocab_049": "Higher wages",
    "bd_vocab_050": "Villeins (serfs)",
    "bd_vocab_051": "Lords offering incentives",
    "bd_vocab_052": "Statute of Labourers (1351)",
    "bd_vocab_053": "Peasants' Revolt (1381)",
    "bd_vocab_054": "Poll Tax (1381)",
    "bd_vocab_055": "Crisis of faith",
    "bd_vocab_056": "40% of clergy died",
    "bd_vocab_057": "Recurring outbreaks",
    "bd_vocab_058": "Eyam",
    "bd_vocab_059": "King Edward III",
    "bd_vocab_060": "Princess Joan",
    "bd_vocab_061": "Rapid spread",
}


def main():
    with PACK_PATH.open("r", encoding="utf-8") as f:
        pack = json.load(f)

    patched = 0
    skipped = []

    for item in pack.get("items", []):
        item_id = item.get("id")
        if item.get("type") != "vocab":
            continue

        if item_id not in TERM_MAP:
            skipped.append(item_id)
            continue

        data = item.get("data", {})

        # Extract the existing definition from translations
        translations = data.get("translations", {})
        definition = translations.get("en-GB")

        if definition is None:
            print(f"WARNING: {item_id} has no translations['en-GB'] — skipping")
            skipped.append(item_id)
            continue

        data["sourceWord"] = TERM_MAP[item_id]
        data["targetWord"] = definition
        del data["translations"]

        patched += 1

    with PACK_PATH.open("w", encoding="utf-8") as f:
        json.dump(pack, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Patched {patched} vocab item(s).")
    if skipped:
        print(f"Skipped {len(skipped)} item(s): {', '.join(skipped)}")


if __name__ == "__main__":
    main()
