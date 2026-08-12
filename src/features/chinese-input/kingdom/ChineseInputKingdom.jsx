import { useMemo, useState } from "react";
import { useLearningRuntime } from "../../../learning-runtime/runtime/LearningRuntimeProvider.tsx";
import AdventureBoard from "../../../learning-runtime/ui/AdventureBoard.tsx";
import ArenaFrame from "../../../learning-runtime/ui/ArenaFrame.tsx";
import CollectionMuseum from "../../../learning-runtime/ui/CollectionMuseum.tsx";
import CompanionGuide from "../../../learning-runtime/ui/CompanionGuide.tsx";
import FloatingFlower from "../../../learning-runtime/ui/FloatingFlower.tsx";
import JourneyPath from "../../../learning-runtime/ui/JourneyPath.tsx";
import KnowledgeWorld from "../../../learning-runtime/ui/KnowledgeWorld.tsx";
import ReviewLibrary from "../../../learning-runtime/ui/ReviewLibrary.tsx";
import WorldHUD from "../../../learning-runtime/ui/WorldHUD.tsx";
import WorldOverlay from "../../../learning-runtime/ui/WorldOverlay.tsx";
import { playSoundCue, SOUND_CUES } from "../../../react/utils/soundCues.js";
import CharacterCollection from "../components/CharacterCollection.jsx";
import WordCollection from "../components/WordCollection.jsx";
import PronunciationButton from "../components/PronunciationButton.jsx";
import VirtualCangjieKeyboard from "../components/VirtualCangjieKeyboard.jsx";
import { INPUT_TOOL_KEYS } from "../data/keyboard-layout.js";
import { FOOTBALL_CHALLENGES } from "./kingdom-model.js";
import "../../../learning-runtime/theme/runtime.css";
import "./kingdom.css";

const FLOWER_ACTIONS = [
  { id: "journey", label: "Journey", shortLabel: "Journey", icon: "✦", description: "Follow your adventure path." },
  { id: "training", label: "Training", shortLabel: "Training", icon: "⚔", description: "Practise roots and keyboard skills." },
  { id: "review", label: "Review", shortLabel: "Review", icon: "↻", description: "Strengthen knowledge ready to revisit." },
  { id: "arena", label: "Arena", shortLabel: "Arena", icon: "⚽", description: "Play learning games." },
  { id: "explore", label: "Explore", shortLabel: "Explore", icon: "⌖", description: "Travel through the Knowledge World." },
  { id: "collection", label: "Collection", shortLabel: "Museum", icon: "♜", description: "Visit characters, roots and rewards." },
];

function MethodSwitch({ method, onChange }) {
  return (
    <fieldset className="flr-method-switch">
      <legend>Input method</legend>
      <button type="button" className={method === "cangjie" ? "is-active" : ""} onClick={() => onChange("cangjie")}><span>倉頡</span><small>Cangjie 5</small></button>
      <button type="button" className={method === "quick" ? "is-active" : ""} onClick={() => onChange("quick")}><span>速成</span><small>Quick</small></button>
    </fieldset>
  );
}

function WorldShortcut({ icon, label, detail, onClick, testId }) {
  return <button className="flr-world-shortcut" type="button" onClick={onClick} data-testid={testId}><span aria-hidden="true">{icon}</span><span><strong>{label}</strong><small>{detail}</small></span></button>;
}

function TrainingGround({ dataset, model, onSelectRoot, pronounce }) {
  const rootKeys = dataset.roots.map((root) => root.key);
  return (
    <div className="flr-training-ground">
      <section className="flr-training-root">
        <p className="flr-eyebrow">Root in focus</p>
        <span className="flr-training-glyph" lang="zh-Hant">{model.currentRoot.primaryRoot}</span>
        <div><h3>{model.currentRoot.key} · {model.currentRoot.labelEn}</h3><p>{model.currentRoot.mnemonic?.en}</p><PronunciationButton text={model.currentRoot.primaryRoot} pronounce={pronounce} label="Hear this root" /></div>
      </section>
      <div className="flr-training-keyboard"><p>Choose any root to move the training lantern.</p><VirtualCangjieKeyboard activeKeys={rootKeys} learnedKeys={[model.currentRoot.key]} expectedKey={model.currentRoot.key} onKey={(key) => onSelectRoot(key)} /></div>
    </div>
  );
}

function ArenaChallengePicker({ method, onBack, onStart, dataset, moduleProgress, currentRootKey, journeyLesson, reviewLesson }) {
  const weakCount = dataset.characters.filter((character) => {
    const mastery = moduleProgress.characters?.[character.id]?.[method];
    return mastery?.attempts && (mastery.masteryScore || 0) < 80;
  }).length;
  const currentRootCount = dataset.characters.filter((character) => character[method]?.keySequence?.includes(currentRootKey)).length;
  const reviewCount = reviewLesson?.characterIds?.length || 0;
  const metadata = {
    "current-journey": { icon: "🌟", detail: `${journeyLesson?.characterIds?.length || 0} characters · 3 mins · +120 XP`, tone: "recommended", label: "Recommended for you" },
    "current-root": { icon: "🌿", detail: `${currentRootCount} characters`, tone: "learning" },
    "review-queue": { icon: "📋", detail: `${reviewCount} due`, tone: "review" },
    "weak-characters": { icon: "⚠️", detail: `${weakCount} weak`, tone: "review" },
    "random-daily": { icon: "🧬", detail: "Fresh verified mix", tone: "challenge" },
    speed: { icon: "⚡", detail: "Faster recall", tone: "challenge" },
    accuracy: { icon: "🎯", detail: "Order matters", tone: "challenge" },
    "mixed-review": { icon: "🌀", detail: "Practised + new", tone: "challenge" },
    boss: { icon: "👑", detail: "Unlocked · high target", tone: "boss" },
  };
  return (
    <div className="flr-challenge-picker" data-testid="chinese-input-arena-pools">
      <button className="flr-text-button" type="button" onClick={onBack}>← Arena Hall</button>
      <div className="flr-arena-banner"><span aria-hidden="true">⚽</span><div><p className="flr-eyebrow">Goalkeeper trials</p><h3>Choose a character pool</h3><p>Every target uses the verified {method === "quick" ? "Quick" : "Cangjie"} evaluator.</p></div><span aria-hidden="true">⚽</span></div>
      <div className="flr-challenge-grid">
        {FOOTBALL_CHALLENGES.map((challenge, index) => (
          <button type="button" key={challenge.id} onClick={() => onStart(challenge.id)} className={`flr-challenge-card ${metadata[challenge.id]?.tone || ""}${index === 0 ? " is-recommended" : ""}`}>
            <span aria-hidden="true">{metadata[challenge.id]?.icon || "⚽"}</span>
            <strong>{challenge.label}</strong><p>{challenge.description}</p><small>{metadata[challenge.id]?.label || metadata[challenge.id]?.detail || "Always available"} · Pronunciation on</small>
            <b>{metadata[challenge.id]?.detail || "Play now"}</b><em>Play</em>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChineseInputKingdom({
  dataset,
  method,
  moduleProgress,
  miniGameProfile,
  model,
  wordIndex,
  onStartWordChallenge,
  panel,
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
  const runtime = useLearningRuntime();
  const [arenaMode, setArenaMode] = useState("");
  const [museumWing, setMuseumWing] = useState("");
  const [selectedRegionNode, setSelectedRegionNode] = useState(null);
  const recommendedLesson = dataset.lessons.find((lesson) => lesson.id === runtime.recommendation.selected?.id)
    || model.journey?.lesson;
  const recommendation = recommendedLesson
    ? { ...runtime.recommendation, title: runtime.recommendation.selected?.id === recommendedLesson.id ? runtime.recommendation.title : model.journey.title }
    : runtime.recommendation;
  const flowerActions = FLOWER_ACTIONS.map((action) => ({
    ...action,
    recommended: action.id === runtime.recommendation.intent,
    status: action.id === "review" && runtime.evidence.dueCount ? `${runtime.evidence.dueCount} due` : "",
  }));

  const reviewShelves = [
    { id: "due", label: "Ready to Remember", icon: "⌛", count: runtime.evidence.dueCount, description: "Spaced memories ready now", tone: "amber" },
    { id: "weak", label: "Needs a Little Care", icon: "♡", count: runtime.evidence.weakCount, description: "Knowledge growing stronger", tone: "violet" },
    { id: "recent", label: "Recent Discoveries", icon: "✦", count: Math.min(30, moduleProgress.attemptEvents?.length || 0), description: "Your latest encounters", tone: "blue" },
    { id: "mastered", label: "Mastered Scrolls", icon: "★", count: model.masteredCharacterCount, description: "Reliable character knowledge", tone: "jade" },
  ];
  const discoveredCharacterCount = useMemo(() => dataset.characters.filter((character) => (
    moduleProgress.characters?.[character.id]?.[method]?.attempts
    || moduleProgress.discoveredNodes?.[character.id]
  )).length, [dataset.characters, method, moduleProgress.characters, moduleProgress.discoveredNodes]);
  const museumWings = [
    { id: "characters", label: "Characters & Roots", description: "Verified glyphs and keyboard roots", icon: "字", discovered: discoveredCharacterCount + model.practisedRootCount, total: dataset.characters.length + dataset.roots.filter((root) => !INPUT_TOOL_KEYS.has(root.key)).length, samples: model.relatedCharacters.slice(0, 4).map((item) => item.char) },
    { id: "words", label: "Words", description: "Newly discovered vocabulary", icon: "詞", discovered: Object.keys(moduleProgress.words || {}).length, total: wordIndex.wordCount, samples: Object.values(wordIndex.wordsById).filter((word) => moduleProgress.words?.[word.wordId]).slice(0, 4).map((word) => word.word) },
    { id: "achievements", label: "Achievements", description: "Milestones from your adventures", icon: "★", discovered: Object.keys(moduleProgress.achievements || {}).length, total: 24, samples: ["✦", "◆", "♛"] },
    { id: "companions", label: "Companions", description: "Friends met across the world", icon: "♧", discovered: 1, total: 8, samples: ["狐", "友"] },
    { id: "cosmetics", label: "Cosmetics", description: "Banners, trails and Flower styles", icon: "✿", discovered: Math.max(1, Math.floor(miniGameProfile.xp / 750)), total: 18, samples: ["❀", "✧", "◇"] },
  ];
  const arenaActivities = [
    { id: "football", label: "Goalkeeper Challenge", localLabel: "守門員挑戰", description: "Type the character code and send the ball to its gate zone.", icon: "⚽", status: "Play now · Pronunciation available", featured: true },
    { id: "memory", label: "Memory Garden", localLabel: "記憶花園", description: "Match roots and characters before the lanterns fade.", icon: "✦", status: "Coming soon" },
    { id: "reading", label: "Reading River", localLabel: "閱讀之河", description: "Recognise characters as they travel downstream.", icon: "⌁", status: "Coming soon" },
    { id: "boss", label: "Guardian Trial", localLabel: "守護者試煉", description: "A multi-stage challenge assembled by the Director.", icon: "♛", status: "Coming soon" },
  ];

  function startDirectedLesson(lesson = recommendedLesson) {
    if (!lesson) return;
    playSoundCue(SOUND_CUES.READY_TO_SPEAK, { enabled: prefs.soundEnabled !== false });
    runtime.startSession(lesson.id);
    onStartLesson(lesson);
  }

  function openDestination(action) {
    if (!action) return;
    playSoundCue(SOUND_CUES.READY_TO_SPEAK, { enabled: prefs.soundEnabled !== false });
    runtime.setIntent(action.id);
    setArenaMode("");
    setMuseumWing("");
    onOpenPanel(action.id);
  }

  function startDirectedReview() {
    playSoundCue(SOUND_CUES.READY_TO_SPEAK, { enabled: prefs.soundEnabled !== false });
    runtime.setIntent("review");
    const candidate = runtime.candidates.find((item) => item.kind === "review");
    if (candidate) runtime.startSession(candidate.id);
    onStartReview();
  }

  function startDirectedFootball(challengeId) {
    playSoundCue(SOUND_CUES.READY_TO_SPEAK, { enabled: prefs.soundEnabled !== false });
    runtime.setIntent("arena");
    const candidate = runtime.candidates.find((item) => item.kind === "arena");
    if (candidate) runtime.startSession(candidate.id);
    onStartFootballChallenge(challengeId);
  }

  function selectKnowledgeNode(node) {
    const key = String(node.metadata?.key || "");
    if (key) onSelectRoot(key);
    setSelectedRegionNode(node);
  }

  const regionActions = [
    { id: "journey", label: "Continue Journey", description: "Follow the Learning Director’s plan.", icon: "🦊", recommended: true, hint: "Recommended" },
    { id: "training", label: "Practice", description: "Personalised practice for this root.", icon: "🎯" },
    { id: "review", label: "Review", description: "Revisit what you have learned.", icon: "📖" },
    { id: "arena", label: "Arena", description: "Fun challenge with this root.", icon: "⚽" },
    { id: "reading", label: "Reading", description: "Reading River is coming soon.", icon: "📚", disabled: true, hint: "Future activity" },
    { id: "collection", label: "Collection", description: "View this root in your collection.", icon: "🧰" },
    { id: "statistics", label: "Statistics", description: "See your progress and patterns.", icon: "📊" },
  ];

  function closeWorldPanel() {
    setSelectedRegionNode(null);
    onOpenPanel("");
  }

  function startRelatedLesson(lessonPreview) {
    const lesson = dataset.lessons.find((candidate) => candidate.id === lessonPreview?.id);
    if (!lesson) return;
    runtime.setIntent("journey");
    runtime.startSession(lesson.id);
    onStartLesson(lesson);
  }

  function handleRegionAction(action, node) {
    const key = String(node.metadata?.key || "");
    const chapterCandidate = runtime.candidates.find((candidate) => candidate.kind === "chapter" && candidate.objectiveRefs?.includes(node.id))
      || runtime.recommendation.selected;
    if (action.id === "journey") {
      runtime.setIntent("journey");
      if (chapterCandidate?.id) {
        const lesson = dataset.lessons.find((item) => item.id === chapterCandidate.id);
        if (lesson) {
          runtime.startSession(lesson.id);
          onStartLesson(lesson);
          return;
        }
      }
      onOpenPanel("journey");
    } else if (action.id === "training") {
      runtime.setIntent("training");
      if (key) onSelectRoot(key);
      onOpenPanel("training");
    } else if (action.id === "review") {
      startDirectedReview();
    } else if (action.id === "arena") {
      runtime.setIntent("arena");
      onOpenPanel("arena");
    } else if (action.id === "collection") {
      onOpenPanel("collection");
    }
  }

  function startCustomAdventure(regionNodes) {
    if (!regionNodes?.length) return;
    const candidate = runtime.candidates.find((item) => item.kind === "chapter") || runtime.recommendation.selected;
    if (!candidate) return;
    runtime.setIntent("journey");
    runtime.startSession(candidate.id, { nodeIds: regionNodes.map((node) => node.id) });
    const baseLesson = dataset.lessons.find((item) => item.id === candidate.id) || model.journey?.lesson;
    if (!baseLesson) return;
    const characterIds = [...new Set(regionNodes.flatMap((node) => node.metadata?.characterIds || []))].slice(0, 24);
    const activeKeys = [...new Set(characterIds.flatMap((id) => dataset.characters.find((character) => character.id === id)?.[method]?.keySequence || []))].sort();
    const lesson = { ...baseLesson, id: `custom-adventure-${method}-${regionNodes.map((node) => node.id).join("-")}`, title: { en: "Custom Knowledge Adventure", zhHant: "自訂知識冒險" }, characterIds, activeKeys, introducedKeys: [], reviewedKeys: regionNodes.map((node) => String(node.metadata?.key || "")).filter(Boolean), prerequisites: [], estimatedMinutes: 6 };
    onStartLesson(lesson);
  }

  const titleByPanel = {
    journey: "Adventure Path",
    training: "Root Training Grounds",
    review: "Review Library",
    arena: "FoxChild Arena",
    explore: "Knowledge World",
    collection: "Collection Museum",
    settings: "World Settings",
  };

  return (
    <div className={`flr-world-shell ${runtime.world.theme.className}${prefs.reducedMotion ? " is-reduced-motion" : ""}`} data-testid="chinese-input-dashboard">
      <header className="flr-world-header">
        <a className="flr-world-brand" href="#top" aria-label="Chinese Input Kingdom home"><img src="/images/foxchild-fox.png" alt="" width="62" height="62" /><span><small>FoxChild@Learn</small><strong>Chinese Input Kingdom</strong></span></a>
        <MethodSwitch method={method} onChange={onMethodChange} />
        <WorldHUD rank={model.rank.title} xp={miniGameProfile.xp} coins={miniGameProfile.coins} progress={model.rank.progress} onSettings={() => onOpenPanel("settings")} />
      </header>

      <main className="flr-home-world">
        <img className="flr-world-art" src={runtime.world.theme.backgroundImage} width="1920" height="1081" alt="A peaceful bamboo valley containing learning paths, pavilions and a distant palace" />
        <div className="flr-world-vignette" aria-hidden="true" />
        <div className="flr-fireflies" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <div className="flr-home-layout">
          <AdventureBoard recommendation={recommendation} localTitle={recommendedLesson?.title?.zhHant} outcomes={model.journey?.outcomes || []} reward={model.journey?.reward || { xp: 80, coins: 12 }} onStart={() => startDirectedLesson()} onChoose={() => onOpenPanel("journey")} />
          <div className="flr-world-quick-actions">
        <WorldShortcut icon="⌖" label="Knowledge World" detail={`${model.practisedRootCount}/${dataset.roots.filter((root) => !INPUT_TOOL_KEYS.has(root.key)).length} roots explored`} onClick={() => openDestination(FLOWER_ACTIONS.find((item) => item.id === "explore"))} testId="chinese-input-open-world" />
            <WorldShortcut icon="⚽" label="Arena" detail="Goalkeeper challenge ready" onClick={() => openDestination(FLOWER_ACTIONS.find((item) => item.id === "arena"))} />
            <WorldShortcut icon="↻" label="Review Library" detail={runtime.evidence.dueCount ? `${runtime.evidence.dueCount} memories ready` : "Shelves are peaceful"} onClick={() => openDestination(FLOWER_ACTIONS.find((item) => item.id === "review"))} />
          </div>
          <div className="flr-world-progress-orb" aria-label={`${runtime.evidence.recentAccuracy}% recent accuracy`}><span><b>{runtime.evidence.recentAccuracy || 0}%</b><small>recent accuracy</small></span><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" /><circle cx="50" cy="50" r="44" pathLength="100" style={{ strokeDasharray: `${runtime.evidence.recentAccuracy || 0} 100` }} /></svg></div>
        </div>
        <CompanionGuide image={runtime.world.theme.companionImage} message={model.companionMessage} minimized={prefs.companionMinimized} onToggle={() => onUpdatePrefs({ companionMinimized: !prefs.companionMinimized })} />
      </main>

      <FloatingFlower actions={flowerActions} activeIntent={panel || undefined} position={prefs.flowerPosition || null} onPositionChange={(flowerPosition) => onUpdatePrefs({ flowerPosition })} onAction={openDestination} />

      {panel && (
        <WorldOverlay title={titleByPanel[panel] || "Chinese Input Kingdom"} eyebrow="FoxChild Learning World" onClose={closeWorldPanel} wide={panel !== "settings"} immersive={["journey", "explore", "arena", "collection"].includes(panel)}>
          {panel === "journey" && <JourneyPath chapters={runtime.world.chapters} currentId={recommendedLesson?.id} onSelect={(chapter) => startDirectedLesson(dataset.lessons.find((lesson) => lesson.id === chapter.id))} />}
          {panel === "training" && <TrainingGround dataset={dataset} model={model} onSelectRoot={onSelectRoot} pronounce={pronounce} />}
          {panel === "explore" && <KnowledgeWorld nodes={runtime.world.nodes} selectedNode={selectedRegionNode} actions={regionActions} onSelect={selectKnowledgeNode} onCloseRegion={() => setSelectedRegionNode(null)} onRegionAction={handleRegionAction} onLessonSelect={startRelatedLesson} onStartCustomAdventure={startCustomAdventure} />}
          {panel === "review" && <ReviewLibrary shelves={reviewShelves} onStart={startDirectedReview} />}
          {panel === "arena" && !arenaMode && <ArenaFrame activities={arenaActivities} stats={{ level: `Lv. ${Math.max(1, Math.floor((miniGameProfile.xp || 0) / 500) + 1)}`, accuracy: `${runtime.evidence.recentAccuracy || 0}%`, streak: `${Math.max(0, runtime.evidence.recentAccuracy ? Math.round(runtime.evidence.recentAccuracy / 8) : 0)}`, goal: `${Math.min(20, model.masteredCharacterCount || 0)} / 20` }} onSelect={(activity) => activity.id === "football" && setArenaMode("football")} />}
          {panel === "arena" && arenaMode === "football" && <ArenaChallengePicker method={method} dataset={dataset} moduleProgress={moduleProgress} currentRootKey={model.currentRoot.key} journeyLesson={recommendedLesson} reviewLesson={reviewLesson} onBack={() => setArenaMode("")} onStart={startDirectedFootball} />}
          {panel === "collection" && !museumWing && <CollectionMuseum wings={museumWings} onOpen={(wing) => setMuseumWing(wing.id)} />}
          {panel === "collection" && museumWing === "characters" && <div className="flr-museum-detail"><button className="flr-text-button" type="button" onClick={() => setMuseumWing("")}>← Museum hall</button><CharacterCollection dataset={dataset} method={method} moduleProgress={moduleProgress} pronounce={pronounce} /></div>}
          {panel === "collection" && museumWing === "words" && <div className="flr-museum-detail"><button className="flr-text-button" type="button" onClick={() => setMuseumWing("")}>← Museum hall</button><WordCollection wordIndex={wordIndex} moduleProgress={moduleProgress} pronounce={pronounce} onStartChallenge={onStartWordChallenge} /></div>}
          {panel === "collection" && museumWing && museumWing !== "characters" && <div className="flr-empty-wing"><button className="flr-text-button" type="button" onClick={() => setMuseumWing("")}>← Museum hall</button><span aria-hidden="true">{museumWings.find((wing) => wing.id === museumWing)?.icon}</span><h3>{museumWings.find((wing) => wing.id === museumWing)?.label}</h3><p>This wing grows as you complete adventures and Arena challenges.</p></div>}
          {panel === "settings" && <div className="flr-settings"><label><span>Pronunciation voice</span><select data-testid="chinese-input-pronunciation-locale" value={prefs.locale === "zh-TW" ? "zh-TW" : "zh-HK"} onChange={(event) => onUpdatePrefs({ locale: event.target.value })}><option value="zh-HK">Cantonese</option><option value="zh-TW">Mandarin (Taiwan)</option></select></label><label><input type="checkbox" checked={prefs.speechEnabled !== false} onChange={(event) => onUpdatePrefs({ speechEnabled: event.target.checked })} /> Pronunciation controls</label><label><input data-testid="chinese-input-auto-pronounce" type="checkbox" checked={prefs.autoPronounce !== false} disabled={prefs.speechEnabled === false} onChange={(event) => onUpdatePrefs({ autoPronounce: event.target.checked })} /> Auto-pronounce new characters</label><label><input type="checkbox" checked={prefs.soundEnabled !== false} onChange={(event) => onUpdatePrefs({ soundEnabled: event.target.checked })} /> World sound effects</label><label><input type="checkbox" checked={prefs.reducedMotion === true} onChange={(event) => onUpdatePrefs({ reducedMotion: event.target.checked })} /> Reduce animation</label></div>}
        </WorldOverlay>
      )}
    </div>
  );
}
