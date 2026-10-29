export type SoundCue =
  | "join"
  | "open"
  | "chip"
  | "tick"
  | "lock"
  | "reveal"
  | "win"
  | "loss"
  | "podium";
export type Tone = {
  hz: number;
  at: number;
  duration: number;
  volume?: number;
  wave?: OscillatorType;
};
const melody = (notes: number[], step = 0.12, duration = 0.2): Tone[] =>
  notes.map((hz, i) => ({ hz, at: i * step, duration }));
// Original synthesized sounds. No downloaded music or third-party recordings.
export function cueTones(cue: SoundCue, urgency = 0): Tone[] {
  switch (cue) {
    case "join":
      return melody([523.25, 783.99], 0.09, 0.13);
    case "open":
      return melody([261.63, 329.63, 392, 523.25], 0.1, 0.23);
    case "chip":
      return [
        { hz: 1400, at: 0, duration: 0.035, volume: 0.035 },
        { hz: 2100, at: 0.055, duration: 0.05, volume: 0.025 },
      ];
    case "tick":
      return [
        {
          hz: 620 + Math.min(10, Math.max(0, urgency)) * 55,
          at: 0,
          duration: 0.07,
          volume: 0.045,
          wave: "triangle",
        },
      ];
    case "lock":
      return melody([392, 293.66, 196], 0.1, 0.2);
    case "reveal":
      return melody([392, 493.88, 587.33, 783.99], 0.12, 0.3);
    case "win":
      return melody([523.25, 659.25, 783.99, 1046.5], 0.1, 0.26);
    case "loss":
      return melody([329.63, 293.66, 261.63], 0.13, 0.2);
    case "podium":
      return [
        ...melody([261.63, 329.63, 392, 523.25, 659.25, 783.99], 0.13, 0.3),
        ...[523.25, 659.25, 783.99].map((hz) => ({
          hz,
          at: 1.05,
          duration: 0.7,
          volume: 0.045,
        })),
      ];
  }
}
export const lobbyPattern = [
  220, 0, 329.63, 440, 0, 392, 329.63, 0, 261.63, 0, 392, 523.25, 0, 440, 392,
  329.63,
];
export const bettingPattern = [
  220, 329.63, 440, 329.63, 246.94, 369.99, 493.88, 369.99, 261.63, 392, 523.25,
  392, 293.66, 440, 587.33, 440,
];
