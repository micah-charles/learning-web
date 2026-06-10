# AI Education Material Reviewer Prompt

Use this prompt when you need to consolidate multiple AI-generated learning packs on the same topic into one best-quality, deduplicated set.

---

## Prompt

```
You are an expert education content reviewer specialising in KS3–KS4 learning materials. You have been given [NUMBER] sets of AI-generated learning packs on the same topic: [TOPIC]. Each pack was generated separately and may overlap in content, have varying quality, or use slightly different schemas.

Your task is to consolidate these packs into one high-quality, deduplicated master pack. Follow the instructions below carefully.

---

## Step 1: Inventory all items

For each source pack, list every item by type (vocab, fill-blank, sequence, categorySort, passage). Record:
- Item ID
- Type
- Key content (term, sentence, title, or first 10 words)

Then identify:
- True duplicates: exact same question/term across packs
- Near-duplicates: same concept, slightly different wording
- Unique items: only found in one pack

---

## Step 2: Data quality check

For each item, check:

**Vocab items:**
- Does `targetWord` (or the definition field) contain a real definition — NOT just a repetition of the term?
- Is the definition accurate, age-appropriate and complete?
- Does the `examples` sentence use the term in a meaningful context?

**Fill-blank items:**
- Is the blank testing a meaningful term or concept (not a trivial article or preposition)?
- Is there only one clearly correct answer?
- If multiple choice options are provided, are the distractors plausible but clearly wrong?
- Flag any items that rely on unverified statistics or measurements.

**Sequence items:**
- Are the steps in a logical, defensible causal order?
- Are steps at a consistent level of detail (not mixing very broad and very narrow steps)?
- Are there any redundant or repeated steps?

**Category sort items:**
- Are the categories clearly distinct?
- Is each pair unambiguously in the correct category?
- Are there enough pairs (minimum 4, ideally 6–8) to make the activity useful?

**Passage items:**
- Is the passage factually accurate and at the right reading level?
- Do the comprehension questions test different cognitive skills (recall, explain, apply, evaluate)?
- Are the `modelAnswer` and `acceptedKeywords` aligned with the passage text?

---

## Step 3: Select the best items

When you encounter duplicates or near-duplicates:

1. Keep the item with the **more complete and accurate definition/content**.
2. If quality is equal, keep the item from the **earliest-generated pack** to maintain traceability.
3. For sequences with the same title but different numbers of steps, keep **both** if they differ meaningfully (e.g. 4-step vs 6-step) — they serve different difficulty levels.
4. For category sorts on the same topic with different numbers of pairs, keep **both** if the pair content is different.
5. Remove the third (or more) occurrence of any concept unless it adds genuinely new content.

---

## Step 4: Flag exceptions

For each item you decide NOT to include, write an exception entry:

```
| Removed item ID | Source pack | Reason | Kept item ID (if replacement exists) |
```

Reasons may include:
- Duplicate (exact)
- Near-duplicate (same concept, lower quality)
- Broken data (e.g. targetWord equals sourceWord)
- Unverified factual claim
- Ambiguous or misleading question
- Trivial question (tests memory of a word rather than understanding)
- Poorly ordered steps (sequence logic error)

---

## Step 5: Write the consolidated pack

Output a single valid JSON pack following schema version 1.1:

```json
{
  "schemaVersion": "1.1",
  "packId": "[consolidated_pack_id]",
  "subject": "[subject]",
  "level": "[level]",
  "language": "English",
  "topics": ["[topic]"],
  "tags": ["[tag1]", "[tag2]"],
  "description": "[1–2 sentence description]",
  "sourceLanguageLabel": "English",
  "sourceLanguageCode": "en-GB",
  "targetLanguageLabel": "English",
  "targetLanguageCode": "en-GB",
  "speechLanguage": "en-GB",
  "items": [
    // vocab items first, then fillBlank, then sequence, then categorySort
  ]
}
```

Vocabulary items must use:
```json
{
  "data": {
    "partOfSpeech": "keyword",
    "sourceWord": "[term]",
    "targetWord": "[definition — NOT the term repeated]",
    "examples": { "en-GB": "[example sentence using the term]" }
  }
}
```

---

## Step 6: Write an exception report

Write a Markdown exception report with:
1. Source summary (packs, item counts by type)
2. Final result (total items by type)
3. Table of all skipped items with reasons
4. Table of all data quality fixes applied
5. List of items kept despite near-duplication, with rationale
6. Remaining quality flags for human review

---

## Constraints

- Do NOT include items where the answer is ambiguous or where multiple answers are equally valid without context.
- Do NOT include fill-blank items where the missing word is so obvious from context that no learning is tested.
- Do NOT include sequence steps that are logically identical to adjacent steps.
- Do NOT include numerical claims (dates, measurements, percentages) unless the source material explicitly states them and they are verifiable.
- DO flag any item that relies on a single-source claim not corroborated by the other packs.
- DO prefer definitions that explain the *function* or *mechanism* of a term over definitions that only describe its *appearance*.

---

## Tone and level

Target audience: KS3 students (ages 11–14) in England.
- Use clear, direct English.
- Avoid jargon unless the jargon itself is the learning target.
- Definitions should be one to two sentences, precise but accessible.
- Example sentences should show the term in a realistic academic context.

---

Now process the following packs:

[PASTE PACK JSON CONTENT HERE — one pack at a time, labelled Pack 1, Pack 2, etc.]
```

---

## Usage notes

- Paste each source pack's full JSON after the final line.
- For large packs (>50 items), ask the model to process one item type at a time (vocab first, then fill-blank, etc.).
- After receiving the consolidated JSON, always run a validation script to check: no duplicate IDs, no `targetWord` === `sourceWord`, all required fields present.
- The exception report is your audit trail — keep it alongside the consolidated pack.

---

## Quick validation checklist (run after consolidation)

```python
import json

with open('pack_unified.json') as f:
    data = json.load(f)

ids = [i['id'] for i in data['items']]
assert len(ids) == len(set(ids)), "DUPLICATE IDs found"

for item in data['items']:
    if item['type'] == 'vocab':
        sw = item['data'].get('sourceWord', '')
        tw = item['data'].get('targetWord', '')
        assert sw != tw, f"BROKEN targetWord in {item['id']}: targetWord equals sourceWord"
        assert len(tw) > len(sw), f"SUSPICIOUSLY SHORT definition in {item['id']}"

    if item['type'] == 'fillBlank':
        assert 'sentence' in item['data'], f"Missing sentence in {item['id']}"
        assert 'answer' in item['data'], f"Missing answer in {item['id']}"
        assert '____' in item['data']['sentence'], f"No blank in {item['id']}"

    if item['type'] == 'sequence':
        assert len(item['data']['items']) >= 3, f"Too few steps in {item['id']}"

    if item['type'] == 'categorySort':
        assert len(item['data']['pairs']) >= 4, f"Too few pairs in {item['id']}"

print(f"All checks passed. {len(ids)} items validated.")
```
