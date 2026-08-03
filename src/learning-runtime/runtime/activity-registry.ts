import type { RegisteredActivity } from "../types";

export class ActivityRegistry {
  readonly #activities = new Map<string, RegisteredActivity>();

  register(activity: RegisteredActivity): () => void {
    if (!activity.capabilityId || typeof activity.render !== "function") {
      throw new Error("An activity requires a capabilityId and renderer.");
    }
    if (this.#activities.has(activity.capabilityId)) {
      throw new Error(`Activity capability already registered: ${activity.capabilityId}`);
    }
    this.#activities.set(activity.capabilityId, activity);
    return () => this.#activities.delete(activity.capabilityId);
  }

  resolve(capabilityId: string): RegisteredActivity {
    const activity = this.#activities.get(capabilityId);
    if (!activity) throw new Error(`No activity registered for capability: ${capabilityId}`);
    return activity;
  }

  has(capabilityId: string): boolean {
    return this.#activities.has(capabilityId);
  }

  list(): readonly string[] {
    return [...this.#activities.keys()].sort();
  }
}
