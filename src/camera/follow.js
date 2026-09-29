// Bounded, shortest-arc camera turn. Kept independent of rendering for tests.
export function followYaw(yaw, desired, gain, maxStep) {
  const delta = Math.atan2(Math.sin(desired - yaw), Math.cos(desired - yaw));
  const step = Math.max(-maxStep, Math.min(maxStep, delta * gain));
  return Math.atan2(Math.sin(yaw + step), Math.cos(yaw + step));
}
