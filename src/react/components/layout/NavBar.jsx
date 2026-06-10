import { useState } from "react";

export const TABS = [
  { id: "home",       label: "Home"        },
  { id: "language",   label: "Language Ladder ✨", tone: "orange" },
  { id: "quiz",       label: "Quiz", tone: "blue" },
  { id: "smart-test", label: "Smart Test 🧪", tone: "blue" },
  { id: "arcade",     label: "Arcade 🎮", tone: "orange" },
  { id: "vocab",      label: "Vocabulary"  },
  { id: "reading",    label: "Reading"     },
  { id: "builder",    label: "Builder"     },
  { id: "crossword",  label: "Crossword"   },
  { id: "progress",   label: "Progress"    },
  { id: "mypacks",    label: "My Packs"    },
  { id: "about",      label: "About"       },
];

const MOBILE_PRIMARY_TABS = [
  { id: "home",     label: "Home",  icon: "🏠" },
  { id: "language", label: "Ladder", icon: "✨" },
  { id: "quiz",     label: "Quiz",  icon: "✨" },
  { id: "reading",  label: "Read",  icon: "📖" },
  { id: "vocab",    label: "Vocab", icon: "📚" },
];

const MOBILE_MORE_TABS = [
  { id: "smart-test", label: "Smart Test", icon: "🧪" },
  { id: "arcade",     label: "Arcade",     icon: "🎮" },
  { id: "builder",    label: "Builder",    icon: "🧩" },
  { id: "crossword",  label: "Crossword",  icon: "✏️" },
  { id: "progress",   label: "Progress",   icon: "📈" },
  { id: "mypacks",    label: "My Packs",   icon: "📦" },
  { id: "about",      label: "About",      icon: "ℹ️" },
];

function DesktopNav({ active, onChange }) {
  return (
    <div className="lw-nav-desktop">
      <div className="lw-nav-inner">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`lw-nav-pill${active === tab.id ? " active" : ""}${tab.tone ? ` tone-${tab.tone}` : ""}`}
            onClick={() => onChange(tab.id)}
            type="button"
            aria-current={active === tab.id ? "page" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileTabButton({ tab, active, onClick }) {
  return (
    <button
      className={`lw-mobile-nav-pill${active ? " is-active" : ""}${tab.id === "language" ? " tone-orange" : ""}${(tab.id === "quiz" || tab.id === "smart-test") ? " tone-blue" : ""}`}
      onClick={onClick}
      type="button"
      aria-current={active ? "page" : undefined}
    >
      <span aria-hidden="true">{tab.icon}</span>
      <span>{tab.label}</span>
    </button>
  );
}

function MobileNav({ active, onChange }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MOBILE_MORE_TABS.some((tab) => tab.id === active);

  function choose(tabId) {
    setMoreOpen(false);
    onChange(tabId);
  }

  return (
    <div className="lw-nav-mobile">
      {MOBILE_PRIMARY_TABS.map((tab) => (
        <MobileTabButton
          key={tab.id}
          tab={tab}
          active={active === tab.id}
          onClick={() => choose(tab.id)}
        />
      ))}

      <div className="lw-mobile-more">
        <button
          className={`lw-mobile-nav-pill${moreActive ? " is-active" : ""}`}
          type="button"
          aria-haspopup="menu"
          aria-expanded={moreOpen}
          aria-current={moreActive ? "page" : undefined}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <span aria-hidden="true">•••</span>
          <span>More</span>
        </button>

        {moreOpen && (
          <div className="lw-mobile-more-menu" role="menu">
            {MOBILE_MORE_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`lw-mobile-more-item${active === tab.id ? " is-active" : ""}`}
                type="button"
                role="menuitem"
                onClick={() => choose(tab.id)}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NavBar({ active, onChange }) {
  return (
    <nav className="lw-nav-bar" aria-label="Main navigation">
      <DesktopNav active={active} onChange={onChange} />
      <MobileNav active={active} onChange={onChange} />
    </nav>
  );
}
