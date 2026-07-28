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

## Canonical character and word pipeline

The production-scale pipeline is in `scripts/chinese-input/canonical/`. It keeps live acquisition separate from deterministic offline generation:

```bash
npm run fetch:chinese-canonical
npm run build:chinese-canonical
```

It produces 3,000 canonical characters and 10,000 canonical words under `learning-data/chinese-input/canonical/`. See `docs/chinese-input-lab/CANONICAL_DATASET.md` for the source policy, schemas, validation gates and known enrichment boundary.
