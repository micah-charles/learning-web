# KS3 Computing — Curriculum Architecture

## Subject: Computing
## Target: UK National Curriculum KS3 (Year 7–9)
## Audience: British curriculum students

---

## 1. Folder Structure

```
ks3-computing-prompts/
│
├── 00_master_general_rules.md          ← Shared rules for ALL packs; copied from KS3 Science template and adapted
│
├── 01_computational_thinking/
│   ├── 01_decomposition_abstraction.md
│   ├── 02_pattern_recognition.md
│   ├── 03_algorithms_flowcharts_pseudocode.md
│   └── 04_sorting_searching_algorithms.md
│
├── 02_programming/
│   ├── 01_variables_datatypes_io.md
│   ├── 02_selection_conditions.md
│   ├── 03_iteration_loops.md
│   ├── 04_subroutines_functions.md
│   ├── 05_lists_arrays_strings.md
│   └── 06_debugging_testing.md
│
├── 03_data_representation/
│   ├── 01_binary_and_hexadecimal.md
│   ├── 02_text_and_image_representation.md
│   └── 03_compression.md
│
├── 04_computer_systems/
│   ├── 01_hardware_components.md
│   ├── 02_cpu_and_fetch_decode_execute.md
│   ├── 03_operating_systems_software.md
│   └── 04_logic_gates_boolean.md
│
├── 05_networks/
│   ├── 01_network_types_and_hardware.md
│   └── 02_internet_protocols_www.md
│
├── 06_cybersecurity/
│   ├── 01_threats_and_attacks.md
│   └── 02_protection_and_safe_practices.md
│
├── 07_databases/
│   └── 01_databases_and_sql.md
│
├── 08_impact_of_technology/
│   ├── 01_legal_and_ethical_issues.md
│   └── 02_environmental_and_social_impact.md
│
└── generated-packs/                     ← AI-generated JSON output goes here
```

**Total: 20 topic prompt files + 1 master rules file**

---

## 2. Topic Map (Full KS3 Coverage)

| # | Topic Group | Topics | Pack Count |
|---|---|---|---|
| 1 | Computational Thinking | Decomposition & Abstraction, Pattern Recognition, Algorithms & Flowcharts, Sorting & Searching | 4 |
| 2 | Programming | Variables/Types/IO, Selection, Iteration, Subroutines, Lists/Strings, Debugging | 6 |
| 3 | Data Representation | Binary & Hex, Text & Images, Compression | 3 |
| 4 | Computer Systems | Hardware, CPU & FDE, OS & Software, Logic Gates | 4 |
| 5 | Networks | Network Types & Hardware, Internet & Protocols | 2 |
| 6 | Cybersecurity | Threats & Attacks, Protection & Safe Practices | 2 |
| 7 | Databases | Databases & SQL | 1 |
| 8 | Impact of Technology | Legal & Ethical, Environmental & Social | 2 |

---

## 3. Learning Web Compatibility

### Supported Item Types per Topic

| Topic Group | vocab | fillBlank | sequence | categorySort | passage |
|---|---|---|---|---|---|
| Computational Thinking | ✓ | ✓ | ✓ (algorithm steps) | — | ✓ |
| Programming | ✓ | ✓ | ✓ (code order) | ✓ (error types) | ✓ |
| Data Representation | ✓ | ✓ | ✓ (conversion steps) | ✓ | ✓ |
| Computer Systems | ✓ | ✓ | — | ✓ (component sorting) | ✓ |
| Networks | ✓ | ✓ | ✓ (packet routing) | ✓ | ✓ |
| Cybersecurity | ✓ | ✓ | — | ✓ (threat classification) | ✓ |
| Databases | ✓ | ✓ | — | ✓ (SQL clause order) | ✓ |
| Impact | ✓ | ✓ | — | ✓ (law sorting) | ✓ |

### Stimulus Approach: Use `data.stimulus`
Do NOT create custom item types. Use the existing `data.stimulus` field on items to attach structured stimulus content:

```json
{
  "type": "fillBlank",
  "data": {
    "stimulus": {
      "type": "pseudocode",
      "content": "FOR i = 1 TO 5\n  OUTPUT i\nENDFOR"
    },
    "question": "How many times does the loop execute?",
    "answer": "5"
  }
}
```

Preferred stimulus types for Computing:

| Stimulus Type | Use Cases |
|---|---|
| `pseudocode` | Algorithm tracing, loop/selection questions |
| `flowchart` | Algorithm flowchart interpretation |
| `traceTable` | Variable tracking, loop tracing |
| `binaryTable` | Binary conversion worked examples |
| `logicGateDiagram` | Logic gate questions |
| `networkDiagram` | Topology and routing questions |
| `databaseTable` | SQL query questions |
| `sourceExtract` | Phishing emails, legal case studies |
| `asciiArtDiagram` | System diagrams, decomposition trees |
| `table` | Comparisons (HDD vs SSD, lossy vs lossless) |

---

## 4. Subject-Specific Educational Requirements

### Unique Requirements
- **Dual-mode content**: Computing requires BOTH conceptual understanding (what is RAM?) AND procedural skill (write a loop)
- **Pseudocode consistency**: all packs must use the same pseudocode style (OCR/AQA conventions) — define this in master rules
- **Code tracing**: traceTable stimulus is uniquely important in Computing; generate at least one per programming topic
- **Cross-topic links**: Binary (data rep) links to hardware (CPU stores data in binary); algorithms link to programming

### Assessment Styles
- 1-mark definitions (very common at KS3)
- Trace table completion (2–4 marks)
- "Write a program to…" extended tasks
- Describe/explain with scenario (3–5 marks)
- Evaluate/compare (4–6 marks) — especially for Impact topics

### Common Misconceptions (Cross-Cutting)
- The internet = the WWW
- RAM = storage
- More cores = always faster
- All malware = virus
- Encryption = deletion

### Progression Requirements
- Year 7: Computational thinking, simple algorithms, hardware basics, binary
- Year 8: Programming constructs, networks, data representation, cybersecurity awareness
- Year 9: Advanced programming, databases, legal/ethical issues, CPU architecture — GCSE bridge

---

## 5. GCSE Bridging & Long-Term Scalability

### Extending to GCSE
- Each topic folder maps cleanly to a GCSE module
- Add `/gcse/` subfolder per topic group when expanding
- GCSE additions for each area:
  - Computational thinking → add complexity analysis, Big O awareness
  - Programming → add file handling, 2D arrays, OOP awareness
  - Data rep → add sound representation, encryption algorithms
  - Computer systems → deeper CPU architecture, embedded systems
  - Networks → client-server, cloud, cybersecurity protocols in depth
  - Databases → JOIN queries, normalisation, entity-relationship diagrams
  - Impact → deeper law study, ethical frameworks, professional standards

### Avoiding Technical Debt
- Keep topic files **lightweight** — no content duplication; reference master rules
- Use consistent vocabulary tables in every file — drives JSON vocab pack generation
- New topics: create a new numbered file; never edit another topic's file to add new content
- Stimulus types: always use `data.stimulus` — no custom schema extensions

### Keeping AI Outputs Consistent
- Every batch generation prompt must include: `00_master_general_rules.md` + the relevant topic file
- Never generate packs from topic files alone — master rules must always be included
- For JSON pack generation, always specify: `schemaVersion: "1.1"`, `subject: "computing"`, `sourceLanguageCode: "en-GB"`, `targetLanguageCode: "en-GB"`, `partOfSpeech: "keyword"`

---

## 6. Batch Generation Workflow

Recommended Codex/LLM pipeline for each topic:

```
INPUT:
  - 00_master_general_rules.md
  - <topic_file>.md

TASK:
  Generate a pack_unified.json for the Learning Web platform.
  Schema version: 1.1
  Subject: computing
  Pack type: mix of vocab, fillBlank, sequence, categorySort items
  Include stimulus where appropriate (traceTable, pseudocode, flowchart)
  Target: 30–50 items per pack

OUTPUT:
  generated-packs/<topic_id>/pack_unified.json
```

After generation:
1. Validate against schema v1.1
2. Check: no `targetWord === sourceWord`
3. Check: all `partOfSpeech` = `"keyword"` for non-language packs
4. Register in `data/generated/manifest.json` under `revisionPacks`
5. Run `npm run build:data` or manually update manifest
