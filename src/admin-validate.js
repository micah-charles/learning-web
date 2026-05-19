/**
 * admin-validate.js
 *
 * JSON Schema validation for uploaded pack files, using Ajv and the
 * schemas in /schemas/. Top-level required fields are relaxed to just
 * "items" so uploaded packs don't need packId / schemaVersion.
 * Item-level constraints (allOf if/then) still apply and are the
 * most valuable part of the check.
 */

import Ajv from "ajv";
import packSchemaRaw from "../schemas/pack_unified.schema.json";
import passageSchemaRaw from "../schemas/passages.schema.json";

const ajv = new Ajv({ allErrors: true, strict: false });

// Relaxed top-level requirements for uploaded packs
const uploadPackSchema    = { ...packSchemaRaw,    $id: "upload:pack",    required: ["items"] };
const uploadPassageSchema = { ...passageSchemaRaw, $id: "upload:passage", required: ["items"] };

const _validatePack    = ajv.compile(uploadPackSchema);
const _validatePassage = ajv.compile(uploadPassageSchema);

/**
 * Validate parsed pack JSON against the appropriate schema.
 * Pure passage packs use the passages schema; everything else uses pack_unified.
 *
 * Returns { ok: boolean, errors: string[] }.
 * Non-blocking by design — callers decide whether to reject or just warn.
 */
export function validatePackSchema(data) {
  const isPassagePack =
    Array.isArray(data?.items) &&
    data.items.length > 0 &&
    data.items.every((i) => i?.type === "passage");

  const fn = isPassagePack ? _validatePassage : _validatePack;
  if (fn(data)) return { ok: true, errors: [] };

  const errors = (fn.errors || [])
    .slice(0, 8)
    .map((e) => {
      const loc = e.instancePath || "";
      return loc ? `${loc}: ${e.message}` : (e.message || "schema validation error");
    });

  return { ok: false, errors };
}
