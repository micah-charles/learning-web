import { createCheckpoint, type RuntimeCheckpoint } from "./checkpoint-store";
import { isValidSessionPlan } from "../director/session-plan";
import type { ActivityBlock, SessionPlan } from "../types";

export interface SessionPosition {
  blockIndex: number;
  challengeIndex: number;
}

export interface SessionControllerSnapshot {
  plan: SessionPlan | null;
  position: SessionPosition;
  status: "idle" | "active" | "completed";
}

export class SessionController {
  #plan: SessionPlan | null = null;
  #position: SessionPosition = { blockIndex: 0, challengeIndex: 0 };
  #status: SessionControllerSnapshot["status"] = "idle";

  start(plan: SessionPlan, position: Partial<SessionPosition> = {}): SessionControllerSnapshot {
    if (!isValidSessionPlan(plan)) throw new Error("Cannot start an invalid session plan.");
    this.#plan = plan;
    this.#position = {
      blockIndex: Math.max(0, Math.min(plan.blocks.length - 1, position.blockIndex || 0)),
      challengeIndex: Math.max(0, position.challengeIndex || 0),
    };
    this.#status = "active";
    return this.snapshot();
  }

  resume(checkpoint: RuntimeCheckpoint): SessionControllerSnapshot {
    return this.start(checkpoint.plan, checkpoint);
  }

  currentBlock(): ActivityBlock | null {
    return this.#plan?.blocks[this.#position.blockIndex] || null;
  }

  advance(): SessionControllerSnapshot {
    if (!this.#plan || this.#status !== "active") return this.snapshot();
    const block = this.currentBlock();
    const challengeCount = block?.challenges.length || 0;
    if (this.#position.challengeIndex + 1 < challengeCount) {
      this.#position = { ...this.#position, challengeIndex: this.#position.challengeIndex + 1 };
    } else if (this.#position.blockIndex + 1 < this.#plan.blocks.length) {
      this.#position = { blockIndex: this.#position.blockIndex + 1, challengeIndex: 0 };
    } else {
      this.#status = "completed";
    }
    return this.snapshot();
  }

  checkpoint(savedAt: string): RuntimeCheckpoint | null {
    return this.#plan ? createCheckpoint(this.#plan, this.#position, savedAt) : null;
  }

  clear(): SessionControllerSnapshot {
    this.#plan = null;
    this.#position = { blockIndex: 0, challengeIndex: 0 };
    this.#status = "idle";
    return this.snapshot();
  }

  snapshot(): SessionControllerSnapshot {
    return Object.freeze({ plan: this.#plan, position: { ...this.#position }, status: this.#status });
  }
}
