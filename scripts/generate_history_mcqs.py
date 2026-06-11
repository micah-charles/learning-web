#!/usr/bin/env python3
"""
Generate GCSE History MCQ packs for all remaining topics.
Cleanest possible extraction and generation.
"""

import json, re, random, os
from pathlib import Path

BASE_DIR = Path("/tmp/learning-web")
HISTORY_DIR = BASE_DIR / "data/Packs/gcse/history"
MANIFEST_PATH = BASE_DIR / "data/generated/manifest.json"

random.seed(42)

TOPICS = [
    {"id": "gcse_hist_a-britain-health-and-the-people-c1000-to-the-present-day", "displayName": "Britain: Health and the People c1000 to the Present Day", "title": "AQA GCSE History — Britain: Health and the People c1000 to the Present Day", "topics_list": ["Britain: Health and the People", "Medicine through time", "Public health"], "tags_list": ["GCSE", "History", "AQA", "Health"]},
    {"id": "gcse_hist_a-conflict-and-tension-the-first-world-war-1894-1918", "displayName": "Conflict and Tension: The First World War 1894–1918", "title": "AQA GCSE History — Conflict and Tension: The First World War 1894–1918", "topics_list": ["Conflict and Tension", "First World War", "WWI"], "tags_list": ["GCSE", "History", "AQA", "WWI"]},
    {"id": "gcse_hist_a-norman-england-c1066-c1100", "displayName": "Norman England c1066–c1100", "title": "AQA GCSE History — Norman England c1066–c1100", "topics_list": ["Norman England", "Medieval", "Normans"], "tags_list": ["GCSE", "History", "AQA", "Normans"]},
    {"id": "gcse_hist_b-britain-power-and-the-people-c1170-to-the-present-day", "displayName": "Britain: Power and the People c1170 to the Present Day", "title": "AQA GCSE History — Britain: Power and the People c1170 to the Present Day", "topics_list": ["Britain: Power and the People", "Political history", "Protest and reform"], "tags_list": ["GCSE", "History", "AQA", "Power"]},
    {"id": "gcse_hist_b-conflict-and-tension-the-inter-war-years-1918-1939", "displayName": "Conflict and Tension: The Inter-War Years 1918–1939", "title": "AQA GCSE History — Conflict and Tension: The Inter-War Years 1918–1939", "topics_list": ["Conflict and Tension", "Inter-war years", "League of Nations"], "tags_list": ["GCSE", "History", "AQA", "Inter-war"]},
    {"id": "gcse_hist_b-germany-1890-1945-democracy-and-dictatorship", "displayName": "Germany 1890–1945: Democracy and Dictatorship", "title": "AQA GCSE History — Germany 1890–1945: Democracy and Dictatorship", "topics_list": ["Germany", "Democracy and dictatorship", "Nazi Germany", "Weimar Republic"], "tags_list": ["GCSE", "History", "AQA", "Germany"]},
    {"id": "gcse_hist_b-medieval-england-the-reign-of-edward-i-1272-1307", "displayName": "Medieval England: The Reign of Edward I 1272–1307", "title": "AQA GCSE History — Medieval England: The Reign of Edward I 1272–1307", "topics_list": ["Medieval England", "Edward I", "Medieval monarchs"], "tags_list": ["GCSE", "History", "AQA", "Medieval"]},
    {"id": "gcse_hist_c-britain-migration-empires-and-the-people-c790-to-the-present-day", "displayName": "Britain: Migration, Empires and the People c790 to the Present Day", "title": "AQA GCSE History — Britain: Migration, Empires and the People c790 to the Present Day", "topics_list": ["Britain: Migration and Empires", "Migration", "Empire"], "tags_list": ["GCSE", "History", "AQA", "Migration"]},
    {"id": "gcse_hist_c-conflict-and-tension-between-east-and-west-1945-1972", "displayName": "Conflict and Tension between East and West 1945–1972", "title": "AQA GCSE History — Conflict and Tension between East and West 1945–1972", "topics_list": ["Conflict and Tension", "Cold War", "East vs West"], "tags_list": ["GCSE", "History", "AQA", "Cold War"]},
    {"id": "gcse_hist_c-elizabethan-england-c1568-1603", "displayName": "Elizabethan England c1568–1603", "title": "AQA GCSE History — Elizabethan England c1568–1603", "topics_list": ["Elizabethan England", "Tudors", "Elizabeth I"], "tags_list": ["GCSE", "History", "AQA", "Elizabethan"]},
    {"id": "gcse_hist_c-russia-1894-1945-tsardom-and-communism", "displayName": "Russia 1894–1945: Tsardom and Communism", "title": "AQA GCSE History — Russia 1894–1945: Tsardom and Communism", "topics_list": ["Russia", "Tsardom and communism", "Russian Revolution", "USSR"], "tags_list": ["GCSE", "History", "AQA", "Russia"]},
    {"id": "gcse_hist_d-america-1920-1973-opportunity-and-inequality", "displayName": "America 1920–1973: Opportunity and Inequality", "title": "AQA GCSE History — America 1920–1973: Opportunity and Inequality", "topics_list": ["America 1920-1973", "USA", "Opportunity and inequality"], "tags_list": ["GCSE", "History", "AQA", "America"]},
    {"id": "gcse_hist_d-conflict-and-tension-in-asia-1950-1975", "displayName": "Conflict and Tension in Asia 1950–1975", "title": "AQA GCSE History — Conflict and Tension in Asia 1950–1975", "topics_list": ["Conflict and Tension", "Asia", "Vietnam War", "Korean War"], "tags_list": ["GCSE", "History", "AQA", "Asia"]},
    {"id": "gcse_hist_d-restoration-england-1660-1685", "displayName": "Restoration England 1660–1685", "title": "AQA GCSE History — Restoration England 1660–1685", "topics_list": ["Restoration England", "Stuarts", "Charles II"], "tags_list": ["GCSE", "History", "AQA", "Restoration"]},
    {"id": "gcse_hist_e-conflict-and-tension-in-the-gulf-and-afghanistan-1990-2009", "displayName": "Conflict and Tension in the Gulf and Afghanistan 1990–2009", "title": "AQA GCSE History — Conflict and Tension in the Gulf and Afghanistan 1990–2009", "topics_list": ["Conflict and Tension", "Gulf War", "Afghanistan", "Modern conflicts"], "tags_list": ["GCSE", "History", "AQA", "Gulf", "Afghanistan"]},
]

SITTINGS = ["june_2022", "june_2023", "june_2024", "november_2020", "november_2021"]

RUBRIC_LINES = [
    "no answer found", "basic explanation", "complex explanation",
    "the identified consequences", "reasoning supported by",
    "simple understanding", "answers may show", "for example",
    "acknowledgements", "copyright", "learner", "spag",
    "any omissions", "qa will be happy", "features of the source",
    "the consequences of the stated development",
    "should demonstrate their ability",
    "with complex sequencing and reasoning",
    "developed sequencing and reasoning",
    "in analysing and evaluating sources",
    "explanation of the relationship between causes",
    "demonstrate their ability to construct",
    "students may provide", "students may recognise",
    "for example, students",
]


def parse_file(filepath):
    with open(filepath) as f:
        text = f.read()
    sections = re.split(r"\n---+\n?", text)
    return [s.strip() for s in sections if s.strip()]


def is_knowledge_section(section):
    """Check if a section contains usable historical knowledge."""
    qm = re.search(r"^## Q\d+:\s*(.+?)(?:\n|$)", section, re.MULTILINE)
    if not qm:
        return None
    header = qm.group(1).strip().lower()
    # Skip source/interpretation
    if re.search(r"\b(interpretation [a-e]|source [a-e])\b", header):
        return None
    if "how useful" in header or "how do you know" in header:
        return None
    # Must be a knowledge question
    knowledge_kw = ["describe two", "in what ways", "which of the following",
                    "how far do you agree", "write an account of",
                    "explain what was important", "explain the significance",
                    "explain two ways", "has the role of", "why did",
                    "explain why", "explain how"]
    if not any(k in header for k in knowledge_kw):
        return None
    # Extract answer
    am = re.search(r"\*\*Answer:\*\*(.*?)$", section, re.DOTALL)
    if not am:
        return None
    return am.group(1).strip()


def clean_answer(text):
    """Remove all rubric text from an answer."""
    for pat in RUBRIC_LINES:
        text = re.sub(pat, "", text, flags=re.IGNORECASE | re.DOTALL)

    # Remove "For example," (both with and without comma)
    text = re.sub(r"(?:For example,\s*|For example\s*)", "", text)

    # Remove marking scheme remnants
    text = re.sub(r"the identified consequences.*?(?:knowledge|understanding)", "", text, flags=re.DOTALL)
    text = re.sub(r"learners?.*?(?:achievement|spag|threshold)", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"should demonstrate their ability to construct and develop", "", text)
    text = re.sub(r"analysis of how/why", "", text)
    text = re.sub(r"showing understanding about", "", text)
    text = re.sub(r"answers may show understanding/support", "", text)
    text = re.sub(r"explanation of the relationship between causes", "", text)
    text = re.sub(r"features of the source", "", text, flags=re.IGNORECASE)
    text = re.sub(r"in analysing and evaluating sources.*?(?:knowledge|contextual)", "", text, flags=re.DOTALL)

    # Remove "and AQA will be happy..." copyright lines
    text = re.sub(r"and AQA will be happy.*?Team\.?", "", text, flags=re.DOTALL)
    text = re.sub(r"any omissions.*?acknowledgements", "", text, flags=re.IGNORECASE | re.DOTALL)

    # Clean up
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_sentences(text):
    """Extract clean factual sentences from answer text."""
    text = clean_answer(text)
    if not text:
        return []

    # Split into sentences by looking for capital letter starts after periods
    sentences = re.split(r'(?<=[.!])\s+(?=[A-Z])', text)

    clean_sentences = []
    for s in sentences:
        s = s.strip()
        # Remove leading junk (commas, semicolons, remnants of list markers)
        s = re.sub(r'^[,;\s]+', '', s)
        s = re.sub(r'^[a-z]\)\s*', '', s)
        s = re.sub(r'^and\s+', '', s, flags=re.IGNORECASE)
        s = re.sub(r'\s+', ' ', s).strip()
        if not s:
            continue

        lower = s.lower()
        # Length check
        if len(s) < 30:
            continue
        # Filter rubric
        if any(p in lower for p in RUBRIC_LINES):
            continue
        # Filter sentences that are mostly rubric remnants
        if re.search(r'[ ,]{2,}one of the|the identified|of the stated|to the enquiry|to the question', lower):
            continue
        # Must start with capital letter
        if not s[0].isupper():
            continue
        # Must end with sentence-ending punctuation
        if not s[-1] in '.!?':
            s += '.'
        # Must have substantive content: either has a digit, or has a known verb
        has_verb = any(w in lower for w in [
            "was", "were", "had", "made", "became", "led", "caused",
            "created", "introduced", "built", "fought", "passed", "signed",
            "established", "used", "gave", "brought", "forced", "allowed",
            "meant", "helped", "changed", "increased", "decreased", "grew",
            "developed", "held", "took", "began", "ended", "won", "lost",
        ])
        if not any(c.isdigit() for c in s) and not has_verb:
            continue
        clean_sentences.append(s)

    return clean_sentences


def extract_topic_for_question(fact):
    """Extract a clean topic phrase from a fact for the question."""
    lower = fact.lower()

    # Priority 1: Date-focused
    dates = re.findall(r'\b(1[0-9]{3}|200[0-9])\b', fact)
    if dates:
        year = dates[0]
        # Find what's before the date
        idx = lower.index(year)
        before = fact[:idx].strip().rstrip(',; ')
        before_words = before.split()
        if before_words:
            # Take last 3-4 words before the date
            topic = " ".join(before_words[-4:])
            # Clean up common prefixes
            topic = re.sub(r'^(in|on|by|during|the|a|an)\s+', '', topic, flags=re.IGNORECASE)
            if topic:
                return f"What happened in {year}?"

    # Priority 2: Multi-word capitalized names (people, places, organizations)
    named_entities = re.findall(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b', fact)
    for ne in named_entities:
        name = ne.strip()
        # Skip if it starts with stop words that got capitalized
        if name.lower().startswith(('the ', 'this ', 'these ', 'those ')):
            continue
        # Skip very short names
        if len(name) < 5:
            continue
        return f"Which statement about {name} is correct?"

    # Priority 3: Legislation/formal names
    leg = re.findall(r'([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:Act|Treaty|Plan|Pact|Code|Charter|Bill|Decree))', fact)
    if leg:
        return f"What was the {leg[0]}?"

    # Priority 4: First substantive noun phrase
    words = fact.split()
    # Find first capitalized word that isn't at the very start
    for i, w in enumerate(words):
        if i > 0 and w[0].isupper() and len(w) > 2 and w.lower() not in {'the', 'this', 'that', 'these', 'those', 'they'}:
            # Take up to 2 more words
            phrase = " ".join(words[i:min(i+3, len(words))])
            phrase = re.sub(r'[,.!?;:].*$', '', phrase)
            if phrase:
                return f"Which statement about {phrase} is correct?"

    # Fallback
    return "Which statement about this period is historically accurate?"


def generate_mcq(fact, all_facts, pack_id, idx):
    fact = fact.strip()
    if len(fact) < 25 or len(fact) > 200:
        return None

    pool = [f for f in all_facts if f != fact and 25 <= len(f) <= 200]
    random.shuffle(pool)
    dists = pool[:3]

    if len(dists) < 3:
        return None

    question = extract_topic_for_question(fact)

    answer = fact
    if len(answer) > 175:
        answer = answer[:172] + "..."

    dists = [d[:200] for d in dists]
    options = [answer] + dists
    random.shuffle(options)

    return {
        "id": f"{pack_id}_mcq_{idx:03d}",
        "type": "multipleChoice",
        "level": "GCSE",
        "topics": ["GCSE History"],
        "tags": ["mcq"],
        "data": {"question": question, "answer": answer, "options": options},
    }


def process_topic(info):
    tid = info["id"]
    tname = info["displayName"]
    print(f"\n{'='*60}\n{tname}\n{'='*60}")

    # Extract all clean facts
    all_facts = []
    seen = set()

    for sitting in SITTINGS:
        fp = HISTORY_DIR / f"{tid}_{sitting}.md"
        if not fp.exists():
            print(f"  Missing: {fp.name}")
            continue
        sections = parse_file(fp)
        file_facts = 0
        for sec in sections:
            answer_text = is_knowledge_section(sec)
            if not answer_text:
                continue
            sentences = extract_sentences(answer_text)
            for s in sentences:
                key = re.sub(r'[^a-z0-9]', '', s.lower())[:60]
                if key not in seen:
                    seen.add(key)
                    all_facts.append(s)
                    file_facts += 1
        print(f"  {fp.name}: {file_facts} facts")

    print(f"  Total facts: {len(all_facts)}")

    if not all_facts:
        return None

    # Generate MCQs
    short_id = tid.split("gcse_hist_")[-1] if "gcse_hist_" in tid else tid
    short_id = short_id.replace("-", "_")

    mcqs = []
    used_keys = set()
    random.shuffle(all_facts)

    for fact in all_facts:
        key = re.sub(r'[^a-z0-9]', '', fact.lower())[:50]
        if key in used_keys:
            continue
        used_keys.add(key)
        mcq = generate_mcq(fact, all_facts, short_id, len(mcqs) + 1)
        if mcq:
            mcqs.append(mcq)
        if len(mcqs) >= 40:
            break

    print(f"  Generated: {len(mcqs)} MCQs")

    if not mcqs:
        return None

    # Write pack
    pack = {
        "packId": tid, "subject": "history", "title": info["title"],
        "subtitle": "MCQ revision from 5 exam sittings", "level": "GCSE",
        "language": "English", "topics": info["topics_list"],
        "tags": info["tags_list"],
        "description": f"Multiple-choice revision questions covering the AQA GCSE History topic {tname}.",
        "schemaVersion": "1.1", "sourceLanguageLabel": "English",
        "sourceLanguageCode": "en-GB", "targetLanguageLabel": "English",
        "targetLanguageCode": "en-GB", "speechLanguage": "en-GB",
        "items": mcqs,
    }

    pack_dir = HISTORY_DIR / tid
    pack_dir.mkdir(parents=True, exist_ok=True)
    pp = pack_dir / "pack_unified.json"
    with open(pp, "w") as f:
        json.dump(pack, f, indent=2, ensure_ascii=False)
    print(f"  Written: {pp}")

    return pp, len(mcqs)


def register(pp, count):
    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)
    with open(pp) as f:
        p = json.load(f)
    tid = p["packId"]
    ti = next((t for t in TOPICS if t["id"] == tid), None)
    if not ti:
        return
    if any(x["id"] == tid for x in manifest["packs"]):
        print(f"  Already in manifest")
        return
    manifest["packs"].append({
        "id": tid, "displayName": ti["displayName"], "subject": "history",
        "curriculum": "gcse", "level": "GCSE", "capabilities": ["revision"],
        "unifiedPath": f"data/Packs/gcse/history/{tid}/pack_unified.json",
        "sourceLanguageLabel": "English", "sourceLanguageCode": "en-GB",
        "targetLanguageLabel": "English", "targetLanguageCode": "en-GB",
        "speechLanguage": "en-GB", "supportsSentences": False,
        "stageOptions": [], "wordCount": count * 2, "sentenceCount": 0,
    })
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"  Registered in manifest")


def main():
    results = []
    for ti in TOPICS:
        r = process_topic(ti)
        if r:
            register(r[0], r[1])
            results.append((ti["id"], r[1]))
    print(f"\n{'='*60}\nSUMMARY\n{'='*60}")
    total = 0
    for tid, c in results:
        print(f"  {tid}: {c}")
        total += c
    print(f"\nTotal: {len(results)} packs, {total} MCQs")


if __name__ == "__main__":
    main()
