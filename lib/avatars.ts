export const avatars = [
  { id: "fox", emoji: "🦊", name: "Lucky Fox", color: "#ff9b67" },
  { id: "alien", emoji: "👾", name: "Pixel Boss", color: "#ba9cff" },
  { id: "unicorn", emoji: "🦄", name: "Unicorn Energy", color: "#ff9fce" },
  { id: "shark", emoji: "🦈", name: "Card Shark", color: "#82baff" },
  { id: "frog", emoji: "🐸", name: "Lucky Frog", color: "#c8ed73" },
  { id: "robot", emoji: "🤖", name: "Coin Bot", color: "#9dcacb" },
  { id: "fire", emoji: "🔥", name: "Hot Streak", color: "#ffb15c" },
  { id: "cat", emoji: "🐱", name: "Cool Cat", color: "#f5d78c" },
  { id: "ghost", emoji: "👻", name: "Ghost Mode", color: "#c0b0e8" },
  { id: "octopus", emoji: "🐙", name: "Big Brain", color: "#f59ab5" },
  { id: "panda", emoji: "🐼", name: "Chill Roller", color: "#bdc9c1" },
  { id: "rocket", emoji: "🚀", name: "To The Moon", color: "#94d8f3" },
] as const;
export const avatarIds = avatars.map((a) => a.id);
export function getAvatar(id?: string) {
  return avatars.find((a) => a.id === id) || avatars[0];
}
