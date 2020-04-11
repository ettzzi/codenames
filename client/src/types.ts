export interface Player {
  id: string;
  name: string;
  team: string;
  isSpymaster: boolean;
  joinedGames: string[];
}

export type PlayerPayload = Pick<Player, "id" | "name"> & {
  accessCode: string;
};
