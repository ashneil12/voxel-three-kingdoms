export function bossReady(roundFrame, kos, config) {
  return roundFrame >= config.earliest && (roundFrame > config.arrive || kos >= config.arriveKOs);
}
