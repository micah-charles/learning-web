import { createContext, useContext, useState, useEffect } from "react";
import { loadManifest } from "@/data.js";

const Ctx = createContext(null);

export function ManifestProvider({ children }) {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadManifest()
      .then(setManifest)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return <Ctx.Provider value={{ manifest, loading, error }}>{children}</Ctx.Provider>;
}

export function useManifest() {
  return useContext(Ctx);
}
