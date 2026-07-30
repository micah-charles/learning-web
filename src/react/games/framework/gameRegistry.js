export const GAME_REGISTRY = [
  { id: "chinese-football", label: "Chinese Football", icon: "⚽", description: "Type the highlighted lesson character's code to make the save", status: "playable", content: "chinese-input" },
  { id: "quiz-hunt", label: "Quiz Hunt", icon: "🦊", description: "Hunt the correct answer", status: "playable", content: "challenge" },
  { id: "snake-builder", label: "Sentence Snake", icon: "🐍", description: "Build sentences in order", status: "playable", content: "builder" },
  { id: "railway-adventure", label: "Railway Adventure", icon: "🚂", status: "sdk-ready" },
  { id: "castle-defence", label: "Castle Defence", icon: "🏹", status: "sdk-ready" },
  { id: "forest-run", label: "Forest Run", icon: "🌲", status: "sdk-ready" },
  { id: "space-shield", label: "Space Shield", icon: "🚀", status: "sdk-ready" },
  { id: "piano-rush", label: "Piano Rush", icon: "🎹", status: "sdk-ready" },
  { id: "fishing-master", label: "Fishing Master", icon: "🎣", status: "sdk-ready" },
  { id: "pirate-cannon", label: "Pirate Cannon", icon: "🏴", status: "sdk-ready" },
  { id: "dragon-escape", label: "Dragon Escape", icon: "🐉", status: "sdk-ready" },
];

export const PLAYABLE_GAMES = GAME_REGISTRY.filter((game) => game.status === "playable");
export const getGameDefinition = (gameId) => GAME_REGISTRY.find((game) => game.id === gameId) || null;
