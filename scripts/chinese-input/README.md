# Chinese Input dataset pipeline

This offline pipeline refreshes the committed Chinese Input Lab seed. It never runs a live scrape during normal app builds.

Inputs:

- pinned Rime Cangjie `cangjie5.base.dict.yaml`;
- pinned Rime Quick schema for the documented first/last-key Quick rule;
- Unicode Unihan 17.0.0 `Unihan_Readings.txt`.

Example:

```bash
node scripts/chinese-input/build-dataset.mjs \
  --cangjie=/permitted/local/rime-cangjie/cangjie5.base.dict.yaml \
  --unihan=/permitted/local/Unihan_Readings.txt
npm run validate:chinese-input-data
```

The generator normalises ASCII codes to uppercase, removes unsupported special `Z` records, keeps all accepted Cangjie alternatives, generates verified Quick codes from the pinned Quick 5 rule, attaches definitions/Jyutping, writes source commits into every record, and produces stable JSON plus a checksum. Review source licences and update pinned metadata before changing any source version.
