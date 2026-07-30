import CharacterCollection from "../components/CharacterCollection.jsx";
import PronunciationButton from "../components/PronunciationButton.jsx";
import VirtualCangjieKeyboard from "../components/VirtualCangjieKeyboard.jsx";
import FloatingFlower from "./FloatingFlower.jsx";
import KingdomOverlay from "./KingdomOverlay.jsx";
import { FLOWER_ACTIONS, FOOTBALL_CHALLENGES } from "./kingdom-model.js";
import "./kingdom.css";

function Readiness({ readiness }) {
  return (
    <div className="cik-readiness" title={readiness.explanation}>
      <span className="cik-readiness-stars" aria-hidden="true">
        {"★".repeat(readiness.stars)}{"☆".repeat(5 - readiness.stars)}
      </span>
      <strong>{readiness.label}</strong>
      <span className="sr-only">{readiness.explanation}</span>
    </div>
  );
}

function MethodSwitch({ method, onChange }) {
  return (
    <fieldset className="cik-method-switch">
      <legend className="sr-only">Input method</legend>
      <button type="button" className={method === "cangjie" ? "is-active" : ""} onClick={() => onChange("cangjie")}>Cangjie</button>
      <button type="button" className={method === "quick" ? "is-active" : ""} onClick={() => onChange("quick")}>Quick</button>
    </fieldset>
  );
}

function JourneyCard({ journey, onStart, onChoose }) {
  if (!journey) return null;
  return (
    <article className="cik-parchment cik-today" data-testid="chinese-input-today-journey">
      <p className="cik-eyebrow">Today’s Journey</p>
      <h2>{journey.title}</h2>
      {journey.subtitle && <p lang="zh-Hant" className="cik-zh-subtitle">{journey.subtitle}</p>}
      <Readiness readiness={journey.readiness} />
      <p className="cik-journey-reason">{journey.reason}</p>
      <ul>
        {journey.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
      </ul>
      <div className="cik-reward-line">
        <span>About {journey.estimatedMinutes} min</span>
        <span>+{journey.reward.xp} XP · +{journey.reward.coins} coins</span>
      </div>
      <button className="cik-primary" type="button" onClick={() => onStart(journey.lesson)} data-testid="chinese-input-start-lesson">
        {journey.saved?.status === "completed" ? "Practise this journey" : "Begin journey"}
      </button>
      <button className="cik-link-button" type="button" onClick={onChoose}>Choose something else</button>
    </article>
  );
}

function RootFocus({ root, relatedCharacters, method, onOpen, onSelectRoot, pronounce }) {
  return (
    <article className="cik-parchment cik-root-focus">
      <p className="cik-eyebrow">Current Root</p>
      <div className="cik-root-heading">
        <span className="cik-root-glyph" lang="zh-Hant">{root.primaryRoot}</span>
        <div><strong>{root.key}</strong><span>{root.labelEn}</span></div>
      </div>
      <p>{root.mnemonic?.en || `${root.key} represents ${root.labelEn}`}</p>
      <div className="cik-related-row" aria-label="Related characters">
        {relatedCharacters.map((character) => (
          <button type="button" key={character.id} onClick={() => onSelectRoot(root.key, character.id)} title={character.meaning.en}>
            <span lang="zh-Hant">{character.char}</span><small>{character[method].preferredCode}</small>
          </button>
        ))}
      </div>
      <PronunciationButton text={root.primaryRoot} pronounce={pronounce} label="Hear root" />
      <button className="cik-secondary" type="button" onClick={onOpen}>Open root workbench</button>
    </article>
  );
}

function JourneyPicker({ dataset, method, moduleProgress, onStart }) {
  return (
    <div className="cik-choice-grid">
      {dataset.lessons.filter((lesson) => lesson.method === method).map((lesson) => {
        const mix = lesson.activityMix || {};
        const title = lesson.introducedKeys?.length
          ? "Keyboard Exploration"
          : (mix.rootRecognition || 0) > (mix.guidedTyping || 0)
            ? "Root Recognition"
            : (mix.characterBuild || 0) >= 2
              ? "Character Construction"
              : (lesson.activeKeys?.length || 0) >= 20
                ? "Typing Challenge"
                : "Whole-character Practice";
        return (
          <button type="button" key={lesson.id} onClick={() => onStart(lesson)}>
            <span className="cik-choice-icon" aria-hidden="true">✦</span>
            <strong>{title}</strong>
            <span lang="zh-Hant">{lesson.title.zhHant}</span>
            <small>{lesson.estimatedMinutes} min · Always available</small>
            {moduleProgress.lessons?.[lesson.id]?.status === "completed" && <span className="cik-state-label">Practised</span>}
          </button>
        );
      })}
    </div>
  );
}

function ExplorePanel({ dataset, method, selectedKey, onSelectRoot, pronounce }) {
  return (
    <>
      <p className="cik-intro">Choose any root. There are no locked regions and no required order.</p>
      <div className="cik-root-map" aria-label="Knowledge roots">
        {dataset.roots.map((root) => (
          <button type="button" className={root.key === selectedKey ? "is-current" : ""} key={root.id} onClick={() => onSelectRoot(root.key)}>
            <span lang="zh-Hant">{root.primaryRoot}</span><strong>{root.key}</strong><small>{root.labelEn}</small>
          </button>
        ))}
      </div>
      <div className="cik-panel-keyboard">
        <VirtualCangjieKeyboard activeKeys={dataset.roots.map((root) => root.key)} learnedKeys={[selectedKey]} expectedKey={selectedKey} onKey={(key) => onSelectRoot(key)} />
      </div>
      <PronunciationButton text={dataset.roots.find((root) => root.key === selectedKey)?.primaryRoot || ""} pronounce={pronounce} />
    </>
  );
}

function ProgressPanel({ model, onSelectRoot }) {
  return (
    <>
      <p className="cik-intro">The garden shows separate evidence dimensions. It is not a single completion score.</p>
      <div className="cik-dimension-list">
        {model.dimensions.map((dimension) => (
          <div key={dimension.id}>
            <span>{dimension.label}</span><strong>{dimension.value}%</strong>
            <progress max="100" value={dimension.value}>{dimension.value}%</progress>
          </div>
        ))}
      </div>
      <h3>Current constellation</h3>
      <div className="cik-constellation">
        <button className="is-current" type="button" onClick={() => onSelectRoot(model.currentRoot.key)}>
          <span lang="zh-Hant">{model.currentRoot.primaryRoot}</span><strong>{model.currentRoot.key}</strong><small>Current root</small>
        </button>
        {model.relatedCharacters.map((character) => (
          <button type="button" key={character.id} onClick={() => onSelectRoot(model.currentRoot.key, character.id)}>
            <span lang="zh-Hant">{character.char}</span><small>{character.meaning.en}</small>
          </button>
        ))}
      </div>
    </>
  );
}

export default function ChineseInputKingdom({
  dataset,
  method,
  moduleProgress,
  miniGameProfile,
  model,
  panel,
  warning,
  prefs,
  reviewLesson,
  pronounce,
  onMethodChange,
  onOpenPanel,
  onStartLesson,
  onStartReview,
  onStartFootballChallenge,
  onSelectRoot,
  onUpdatePrefs,
}) {
  const rootKeys = dataset.roots.map((root) => root.key);
  const action = (id) => {
    if (id === "continue") onStartLesson(model.journey?.lesson);
    else onOpenPanel(id === "kingdom" ? "" : id);
  };
  const titleByPanel = {
    explore: "Explore the Knowledge World",
    review: "Review",
    football: "Choose a Football Challenge",
    collection: "Character Collection",
    keyboard: "Root Workbench",
    progress: "Knowledge Garden",
    search: "Search the Kingdom",
    journeys: "Choose a Journey",
    settings: "Kingdom Settings",
  };
  return (
    <div className="cik-shell" data-testid="chinese-input-dashboard">
      <header className="cik-header">
        <div className="cik-brand">
          <img src="/images/foxchild-fox.png" alt="" width="58" height="58" />
          <div><span>FoxChild@Learn</span><h1>Chinese Input Kingdom</h1></div>
        </div>
        <MethodSwitch method={method} onChange={onMethodChange} />
        <div className="cik-hud" aria-label="Adventure rewards">
          <span><strong>{model.rank.title}</strong><small>cosmetic rank</small></span>
          <span><strong>{miniGameProfile.xp}</strong><small>XP</small></span>
          <span><strong>{miniGameProfile.coins}</strong><small>coins</small></span>
          <button type="button" className="cik-icon-button" onClick={() => onOpenPanel("settings")} aria-label="Open Kingdom settings">⚙</button>
        </div>
      </header>

      {warning && <details className="cik-preview" data-testid="chinese-input-preview-warning"><summary>Preview curriculum notice</summary><p>{warning}</p></details>}

      <main className={`cik-world ${prefs.accessibleListView ? "is-list-view" : ""}`}>
        <img className="cik-world-art" src="/images/chinese-input/kingdom-world.webp" width="1920" height="1081" alt="A peaceful East Asian fantasy valley with learning paths, pavilions and a distant palace" />
        <button
          className="cik-view-toggle"
          type="button"
          onClick={() => onUpdatePrefs({ accessibleListView: !prefs.accessibleListView })}
        >
          {prefs.accessibleListView ? "Show illustrated world" : "Show accessible action list"}
        </button>
        <div className="cik-world-content">
          <JourneyCard journey={model.journey} onStart={onStartLesson} onChoose={() => onOpenPanel("journeys")} />
          <RootFocus root={model.currentRoot} relatedCharacters={model.relatedCharacters} method={method} onOpen={() => onOpenPanel("keyboard")} onSelectRoot={onSelectRoot} pronounce={pronounce} />
          <aside className={`cik-companion ${prefs.companionMinimized ? "is-minimized" : ""}`}>
            <img src="/images/foxchild-girl.png" alt="" width="72" height="72" />
            {!prefs.companionMinimized && <p>{model.companionMessage}</p>}
            <button type="button" onClick={() => onUpdatePrefs({ companionMinimized: !prefs.companionMinimized })} aria-label={prefs.companionMinimized ? "Show companion advice" : "Minimise companion advice"}>
              {prefs.companionMinimized ? "Advice" : "×"}
            </button>
          </aside>
          <button className="cik-football-teaser" type="button" onClick={() => onOpenPanel("football")}>
            <span aria-hidden="true">⚽</span><span><strong>Football Challenge</strong><small>Practise with any of nine real character pools</small></span>
          </button>
        </div>
        {prefs.accessibleListView && (
          <nav className="cik-action-list" aria-label="Chinese Input Kingdom actions">
            {FLOWER_ACTIONS.map((item) => <button type="button" key={item.id} onClick={() => action(item.id)}><span>{item.icon}</span><strong>{item.label}</strong></button>)}
          </nav>
        )}
      </main>

      <FloatingFlower activePanel={panel} onAction={action} />

      {panel && (
        <KingdomOverlay title={titleByPanel[panel]} eyebrow="Chinese Input Kingdom" onClose={() => onOpenPanel("")} wide={["collection", "review", "search", "journeys"].includes(panel)}>
          {panel === "journeys" && <JourneyPicker dataset={dataset} method={method} moduleProgress={moduleProgress} onStart={onStartLesson} />}
          {panel === "explore" && <ExplorePanel dataset={dataset} method={method} selectedKey={model.currentRoot.key} onSelectRoot={onSelectRoot} pronounce={pronounce} />}
          {panel === "keyboard" && (
            <>
              <div className="cik-root-workbench"><span lang="zh-Hant">{model.currentRoot.primaryRoot}</span><div><h3>{model.currentRoot.key} · {model.currentRoot.labelEn}</h3><p>{model.currentRoot.mnemonic?.en}</p><PronunciationButton text={model.currentRoot.primaryRoot} pronounce={pronounce} /></div></div>
              <VirtualCangjieKeyboard activeKeys={rootKeys} learnedKeys={[model.currentRoot.key]} expectedKey={model.currentRoot.key} onKey={(key) => onSelectRoot(key)} />
            </>
          )}
          {panel === "progress" && <ProgressPanel model={model} onSelectRoot={onSelectRoot} />}
          {panel === "collection" && <CharacterCollection dataset={dataset} method={method} moduleProgress={moduleProgress} pronounce={pronounce} />}
          {panel === "search" && <CharacterCollection dataset={dataset} method={method} moduleProgress={moduleProgress} pronounce={pronounce} />}
          {panel === "review" && <CharacterCollection dataset={dataset} method={method} moduleProgress={moduleProgress} pronounce={pronounce} reviewOnly reviewCount={reviewLesson?.characterIds.length || 0} onStartReview={onStartReview} />}
          {panel === "football" && (
            <div className="cik-choice-grid">
              {FOOTBALL_CHALLENGES.map((challenge) => (
                <button type="button" key={challenge.id} onClick={() => onStartFootballChallenge(challenge.id)}>
                  <span className="cik-choice-icon" aria-hidden="true">⚽</span><strong>{challenge.label}</strong><span>{challenge.description}</span><small>Pronunciation available · Always available</small>
                </button>
              ))}
            </div>
          )}
          {panel === "settings" && (
            <div className="cik-settings">
              <label><span>Pronunciation voice</span><select data-testid="chinese-input-pronunciation-locale" value={prefs.locale === "zh-TW" ? "zh-TW" : "zh-HK"} onChange={(event) => onUpdatePrefs({ locale: event.target.value })}><option value="zh-HK">Cantonese</option><option value="zh-TW">Mandarin (Taiwan)</option></select></label>
              <label><input type="checkbox" checked={prefs.speechEnabled !== false} onChange={(event) => onUpdatePrefs({ speechEnabled: event.target.checked })} /> Enable pronunciation controls</label>
              <label><input data-testid="chinese-input-auto-pronounce" type="checkbox" checked={prefs.autoPronounce !== false} disabled={prefs.speechEnabled === false} onChange={(event) => onUpdatePrefs({ autoPronounce: event.target.checked })} /> Auto-pronounce each new character</label>
            </div>
          )}
        </KingdomOverlay>
      )}
    </div>
  );
}
