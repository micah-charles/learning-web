import { useState } from "react";
import { pathForTab } from "../../utils/appRoutes.js";

export const TABS = [
  { id: "home",       label: "Home"        },
  { id: "language",   label: "Language Ladder ✨", tone: "orange" },
  { id: "speak-shadow", label: "Speak Lab", tone: "blue" },
  { id: "quiz",       label: "Quiz", tone: "blue" },
  { id: "arcade",     label: "Arcade 🎮", tone: "orange" },
  { id: "smart-test", label: "Smart Test 🧪", tone: "blue" },
  { id: "vocab",      label: "Vocabulary"  },
  { id: "reading",    label: "Reading"     },
  { id: "builder",    label: "Builder"     },
  { id: "crossword",  label: "Crossword"   },
  { id: "progress",   label: "Progress"    },
  { id: "mypacks",    label: "My Packs"    },
  { id: "about",      label: "About"       },
];

const DESKTOP_UTILITY_TABS = [
  { id: "learning-settings", label: "Manage Learning" },
];

export const MOBILE_PRIMARY_TABS = [
  { id: "home",       label: "Home",       icon: "🏠" },
  { id: "language",   label: "Ladder",     icon: "✨" },
  { id: "speak-shadow", label: "Speak",     icon: "S" },
  { id: "arcade",     label: "Arcade",     icon: "🎮" },
  { id: "quiz",       label: "Quiz",       icon: "✨" },
];

export const MOBILE_MORE_TABS = [
  { id: "smart-test", label: "Smart Test", icon: "🧪" },
  { id: "vocab",      label: "Vocab",      icon: "📚" },
  { id: "reading",    label: "Read",       icon: "📖" },
  { id: "builder",    label: "Builder",    icon: "🧩" },
  { id: "crossword",  label: "Crossword",  icon: "✏️" },
  { id: "progress",   label: "Progress",   icon: "📈" },
  { id: "mypacks",    label: "My Packs",   icon: "📦" },
  { id: "learning-settings", label: "Manage Learning", icon: "⚙️" },
  { id: "about",      label: "About",      icon: "ℹ️" },
];

function filterTabs(tabs, allowedTabs, active) {
  if (!Array.isArray(allowedTabs) || allowedTabs.length === 0) return tabs;
  const allowed = new Set(allowedTabs);
  return tabs.filter((tab) => allowed.has(tab.id) || tab.id === active);
}

function DesktopNav({ active, onChange, allowedTabs }) {
  const utilityTabs = filterTabs(DESKTOP_UTILITY_TABS, allowedTabs, active);
  const tabs = filterTabs(TABS, allowedTabs, active);
  const activeUtilityTab = utilityTabs.find((tab) => tab.id === active);
  const visibleTabs = activeUtilityTab && !tabs.some((tab) => tab.id === activeUtilityTab.id)
    ? [...tabs, activeUtilityTab]
    : tabs;
  return (
    <div className="lw-nav-desktop">
      <div className="lw-nav-inner">
        {visibleTabs.map((tab) => (
          <a
            key={tab.id}
            href={pathForTab(tab.id)}
            className={`lw-nav-pill${active === tab.id ? " active" : ""}${tab.tone ? ` tone-${tab.tone}` : ""}`}
            data-testid={`nav-${tab.id}`}
            onClick={(event) => {
              event.preventDefault();
              onChange(tab.id);
            }}
            aria-current={active === tab.id ? "page" : undefined}
          >
            {tab.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function MobileTabButton({ tab, active, onClick }) {
  return (
    <a
      href={pathForTab(tab.id)}
      className={`lw-mobile-nav-pill${active ? " is-active" : ""}${(tab.id === "language" || tab.id === "arcade") ? " tone-orange" : ""}${(tab.id === "quiz" || tab.id === "smart-test" || tab.id === "speak-shadow") ? " tone-blue" : ""}`}
      data-testid={`nav-${tab.id}`}
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
      aria-current={active ? "page" : undefined}
    >
      <span aria-hidden="true">{tab.icon}</span>
      <span>{tab.label}</span>
    </a>
  );
}

function MobileNav({ active, onChange, allowedTabs }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryTabs = filterTabs(MOBILE_PRIMARY_TABS, allowedTabs, active);
  const moreTabs = filterTabs(MOBILE_MORE_TABS, allowedTabs, active);
  const moreActive = moreTabs.some((tab) => tab.id === active);

  function choose(tabId) {
    setMoreOpen(false);
    onChange(tabId);
  }

  return (
    <div className="lw-nav-mobile">
      {primaryTabs.map((tab) => (
        <MobileTabButton
          key={tab.id}
          tab={tab}
          active={active === tab.id}
          onClick={() => choose(tab.id)}
        />
      ))}

      {moreTabs.length > 0 && (
      <div className="lw-mobile-more">
        <button
          className={`lw-mobile-nav-pill${moreActive ? " is-active" : ""}`}
          data-testid="nav-more"
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
            {moreTabs.map((tab) => (
              <a
                key={tab.id}
                href={pathForTab(tab.id)}
                className={`lw-mobile-more-item${active === tab.id ? " is-active" : ""}`}
                data-testid={`nav-${tab.id}`}
                role="menuitem"
                onClick={(event) => {
                  event.preventDefault();
                  choose(tab.id);
                }}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}

export default function NavBar({ active, onChange, allowedTabs }) {
  return (
    <nav className="lw-nav-bar" aria-label="Main navigation">
      <DesktopNav active={active} onChange={onChange} allowedTabs={allowedTabs} />
      <MobileNav active={active} onChange={onChange} allowedTabs={allowedTabs} />
    </nav>
  );
}
