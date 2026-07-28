export const CHINESE_INPUT_LAB_ROLLOUT = "public";

export const CHINESE_INPUT_LAB_ROLLOUT_STATES = ["disabled", "preview", "public"];

export function getChineseInputLabAvailability() {
  const rollout = CHINESE_INPUT_LAB_ROLLOUT_STATES.includes(CHINESE_INPUT_LAB_ROLLOUT)
    ? CHINESE_INPUT_LAB_ROLLOUT
    : "disabled";
  return {
    rollout,
    routeEnabled: rollout !== "disabled",
    discoverable: rollout === "public",
  };
}
