import type { DirectorRecommendation } from "../types";

export default function AdventureBoard({
  recommendation,
  localTitle,
  outcomes,
  reward,
  onStart,
  onChoose,
}: {
  recommendation: DirectorRecommendation;
  localTitle?: string;
  outcomes: readonly string[];
  reward: { xp: number; coins: number };
  onStart: () => void;
  onChoose: () => void;
}) {
  return (
    <article className="flr-adventure-board" data-testid="chinese-input-today-journey">
      <span className="flr-board-pin" aria-hidden="true" />
      <p className="flr-eyebrow">Today’s Adventure</p>
      <h2>{recommendation.title}</h2>
      {localTitle && <p className="flr-local-title" lang="zh-Hant">{localTitle}</p>}
      <p className="flr-director-reason"><span aria-hidden="true">✦</span>{recommendation.summary}</p>
      <ul>{outcomes.slice(0, 3).map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
      <div className="flr-board-meta"><span>◷ {recommendation.estimatedMinutes || 5} min</span><span>✦ +{reward.xp} XP</span><span>◉ +{reward.coins}</span></div>
      <button className="flr-hero-button" type="button" onClick={onStart} data-testid="chinese-input-start-lesson"><span>Start Adventure</span><small>Begin when you are ready</small></button>
      <button className="flr-text-button" type="button" onClick={onChoose}>Choose another path</button>
    </article>
  );
}
