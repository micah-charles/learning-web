import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loadManifest, registerPackInCache } from "@/data.js";
import { hydrateManifest } from "@/admin-storage.js";

const Ctx = createContext(null);

export function ManifestProvider({ children }) {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadManifest()
      .then(m => {
        // Inject any packs the user previously uploaded (stored in localStorage)
        // into the live manifest before React components ever see it.
        hydrateManifest(m, registerPackInCache);
        setManifest(m);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Call after a new pack is uploaded so Quiz/Vocab/Review see it immediately
  // without a page reload. hydrateManifest is idempotent (deduplicates by id).
  const rehydrate = useCallback(() => {
    setManifest(prev => {
      if (!prev) return prev;
      const next = { ...prev };          // new reference → triggers re-render
      hydrateManifest(next, registerPackInCache);
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ manifest, loading, error, rehydrate }}>{children}</Ctx.Provider>;
}

export function useManifest() {
  return useContext(Ctx);
}
