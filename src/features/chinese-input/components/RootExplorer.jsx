import { useCallback, useState } from "react";
import { CANGJIE_ROOTS } from "../data/keyboard-layout.js";
import usePhysicalKeyboard from "../hooks/usePhysicalKeyboard.js";
import VirtualCangjieKeyboard from "./VirtualCangjieKeyboard.jsx";
import PronunciationButton from "./PronunciationButton.jsx";

export default function RootExplorer({ pronounce }) {
  const [selectedKey, setSelectedKey] = useState("A");
  const selectRootKey = useCallback((key) => {
    if (/^[A-Z]$/.test(key)) setSelectedKey(key);
  }, []);
  usePhysicalKeyboard({ onKey: selectRootKey });
  const root = CANGJIE_ROOTS.find((entry) => entry.key === selectedKey);
  const allKeys = CANGJIE_ROOTS.map((entry) => entry.key);
  return (
    <div data-testid="chinese-input-root-explorer">
      <section className="lw-card cil-section-heading">
        <div>
          <p className="lw-eyebrow">Stage 1</p>
          <h2>Root Explorer</h2>
          <p className="lw-subtitle">Press a physical key or choose a keycap to inspect its verified Cangjie label.</p>
        </div>
      </section>
      <section className="lw-card cil-root-detail" aria-live="polite">
        <div className="cil-root-glyph" lang="zh-Hant">{root.primaryRoot}</div>
        <div>
          <h3>{root.key} · {root.labelEn}</h3>
          <p lang="zh-Hant">{root.mnemonic.zhHant}</p>
          <p>{root.mnemonic.en}</p>
          <PronunciationButton text={root.primaryRoot} pronounce={pronounce} label="Hear root" />
        </div>
      </section>
      <VirtualCangjieKeyboard
        activeKeys={allKeys}
        learnedKeys={[]}
        pressedKey={selectedKey}
        guidanceLevel="off"
        onKey={selectRootKey}
      />
    </div>
  );
}
