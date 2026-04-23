export type GameMode = 'easy' | 'normal' | 'review';

export type Phase = 'identify' | 'complete';

export type BuildingName =
  | 'hopital'
  | 'poste'
  | 'ecole'
  | 'pharmacie'
  | 'bibliotheque'
  | 'gare'
  | 'cinema'
  | 'ispa'
  | 'marche';

export interface BuildingProgress {
  proposed?: BuildingName;
  validated: boolean;
  flaggedWrong: boolean;
}

export interface SaveData {
  version: 1;
  started: boolean;
  tutorialSeen: boolean;
  mode: GameMode;
  soundEnabled: boolean;
  cluesDiscovered: string[];
  buildingProgress: Record<number, BuildingProgress>;
  phase: Phase;
}

export interface RectLike {
  x: number;
  y: number;
  width: number;
  height: number;
}
