# Prompt Instruction: Keep Data Structure Docs Updated

Use this instruction for all future AI agents working in `learning-web`.

## Source of truth

All data structure documentation lives in one place:

- **Markdown:** `docs/data-structures.md`
- **HTML:** `docs/data-structures.html` — regenerate from the markdown whenever the markdown changes (see below)

The old `Doc/data-structure-summary.md` and `Doc/data-structure-summary.html` have been deleted. Do not recreate them.

## Rule

Whenever you add, remove, rename, or repurpose:

- a feature
- a JSON file or manifest section
- a pack metadata field (`capabilities`, `yearOptions`, `stageOptions`, `passagePath`, etc.)
- a field used by Vocabulary, Quiz, Reading, Builder, or Review tabs
- an item `type` or `questionType` value
- a folder structure convention under `data/`

you must also update `docs/data-structures.md` **in the same task**, then regenerate the HTML.

## Minimum update checklist

- Confirm which feature/tab uses the changed structure
- Document the file path and file type
- Document the fields the UI or runtime now relies on
- Update examples if the shape changed
- Update field tables and allowed-value lists
- If a validator constant changes (`VALID_SUBJECTS`, `VALID_Q_TYPES`, etc.), update the **Validator Constraints** section too

## Regenerating the HTML

After editing `docs/data-structures.md`, regenerate `docs/data-structures.html` with:

```bash
python3 - <<'EOF'
import markdown
from pathlib import Path

md_text = Path('docs/data-structures.md').read_text(encoding='utf-8')
body = markdown.markdown(md_text, extensions=['tables', 'fenced_code', 'toc'])

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Learning Web — Data Structures</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 24px 80px;
    }}
    h1 {{ font-size: 1.8rem; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }}
    h2 {{ font-size: 1.3rem; margin-top: 2.2rem; border-bottom: 1px solid #e8e8e8; padding-bottom: 6px; }}
    h3 {{ font-size: 1.1rem; margin-top: 1.6rem; color: #333; }}
    h4 {{ font-size: 1rem; margin-top: 1.2rem; color: #555; }}
    code {{
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 0.88em;
      background: #f4f4f4;
      border: 1px solid #e0e0e0;
      border-radius: 3px;
      padding: 1px 5px;
    }}
    pre {{
      background: #f6f8fa;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 16px;
      overflow-x: auto;
      line-height: 1.5;
    }}
    pre code {{
      background: none;
      border: none;
      padding: 0;
      font-size: 0.85em;
    }}
    table {{
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0;
      font-size: 0.9em;
    }}
    th {{
      background: #f0f4f8;
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #d0d7de;
    }}
    td {{
      padding: 7px 12px;
      border: 1px solid #d0d7de;
      vertical-align: top;
    }}
    tr:nth-child(even) td {{ background: #fafafa; }}
    blockquote {{
      margin: 12px 0;
      padding: 10px 16px;
      border-left: 4px solid #0969da;
      background: #f0f6ff;
      color: #333;
      border-radius: 0 4px 4px 0;
    }}
    blockquote p {{ margin: 0; }}
    a {{ color: #0969da; }}
    hr {{ border: none; border-top: 1px solid #e0e0e0; margin: 28px 0; }}
    p {{ margin: 8px 0; }}
    ul, ol {{ padding-left: 24px; }}
    li {{ margin: 3px 0; }}
  </style>
</head>
<body>
{{body}}
</body>
</html>"""

Path('docs/data-structures.html').write_text(html, encoding='utf-8')
print('Generated docs/data-structures.html')
EOF
```

## Manifest reminder

If the change affects pack files or manifest fields, also check whether `data/generated/manifest.json` needs to be updated by hand or regenerated via `npm run build:data`.

## Do not skip this

Documentation is part of the feature change. A task is not complete until `docs/data-structures.md` (and the regenerated HTML) match the current structure.
