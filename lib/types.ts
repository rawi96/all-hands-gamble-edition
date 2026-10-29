export type Option = { label: string; odds: number };
export type Round = {
  id: string;
  position: number;
  question: string;
  options: Option[];
  status: "draft" | "open" | "locked" | "revealed";
  duration: number;
  closes_at: string | null;
  correct?: number;
  explanation?: string;
};
export type Player = {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  bailout_used: boolean;
};
export type Bet = {
  option_index: number;
  stake: number;
  payout: number | null;
  round_id: string;
};
export type Snapshot = {
  serverTime: number;
  game: {
    code: string;
    title: string;
    status: "lobby" | "playing" | "finished";
  };
  round: Round | null;
  roundCount: number;
  leaderboard: Player[];
  playerCount: number;
  betCount: number;
  allInCount: number;
  hostStats?: {
    totalStake: number;
    // Host-only activity, deliberately without answer choices.
    recentBets: {
      id: string;
      name: string;
      avatar: string;
      stake: number;
      allIn: boolean;
    }[];
  };
  me: Player | null;
  bet: Bet | null;
  host: boolean;
  rounds?: Round[];
};
