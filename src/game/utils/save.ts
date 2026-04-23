import { BUILDING_OPTIONS } from '../data/buildings';
import { CLUES } from '../data/clues';
import type {
  BuildingName,
  BuildingProgress,
  GameMode,
  SaveData
} from '../types';

const STORAGE_KEY = 'fle-city-game-save-v1';

const VALID_BUILDING_NAMES = new Set<BuildingName>(
  BUILDING_OPTIONS.map((building) => building.key)
);

function createBuildingProgress(validated = false): Record<number, BuildingProgress> {
  return Object.fromEntries(
    BUILDING_OPTIONS.map((building) => [
      building.id,
      {
        proposed: validated ? building.key : undefined,
        validated,
        flaggedWrong: false
      }
    ])
  ) as Record<number, BuildingProgress>;
}

export function createDefaultSave(mode: GameMode = 'normal'): SaveData {
  const reviewMode = mode === 'review';

  return {
    version: 1,
    started: false,
    tutorialSeen: reviewMode,
    mode,
    soundEnabled: true,
    cluesDiscovered: reviewMode ? CLUES.map((clue) => clue.id) : [],
    buildingProgress: createBuildingProgress(reviewMode),
    phase: reviewMode ? 'missions' : 'identify',
    currentMissionSeries: 0,
    completedMissionTaskIds: []
  };
}

function sanitizeBuildingProgress(
  input: unknown,
  mode: GameMode
): Record<number, BuildingProgress> {
  const fallback = createBuildingProgress(mode === 'review');

  if (!input || typeof input !== 'object') {
    return fallback;
  }

  const value = input as Record<string, Partial<BuildingProgress>>;

  for (const building of BUILDING_OPTIONS) {
    const raw = value[String(building.id)];
    if (!raw || typeof raw !== 'object') {
      continue;
    }

    const proposed =
      typeof raw.proposed === 'string' && VALID_BUILDING_NAMES.has(raw.proposed as BuildingName)
        ? (raw.proposed as BuildingName)
        : fallback[building.id].proposed;

    fallback[building.id] = {
      proposed,
      validated:
        typeof raw.validated === 'boolean' ? raw.validated : fallback[building.id].validated,
      flaggedWrong:
        typeof raw.flaggedWrong === 'boolean'
          ? raw.flaggedWrong
          : fallback[building.id].flaggedWrong
    };
  }

  if (mode === 'review') {
    for (const building of BUILDING_OPTIONS) {
      fallback[building.id] = {
        proposed: building.key,
        validated: true,
        flaggedWrong: false
      };
    }
  }

  return fallback;
}

export function sanitizeSaveData(input: unknown): SaveData {
  const fallback = createDefaultSave('normal');

  if (!input || typeof input !== 'object') {
    return fallback;
  }

  const raw = input as Partial<SaveData>;
  const mode =
    raw.mode === 'easy' || raw.mode === 'normal' || raw.mode === 'review'
      ? raw.mode
      : fallback.mode;
  const phase =
    raw.phase === 'identify' ||
    raw.phase === 'phase2-intro' ||
    raw.phase === 'missions' ||
    raw.phase === 'victory'
      ? raw.phase
      : mode === 'review'
        ? 'missions'
        : fallback.phase;

  return {
    version: 1,
    started: typeof raw.started === 'boolean' ? raw.started : fallback.started,
    tutorialSeen:
      typeof raw.tutorialSeen === 'boolean' ? raw.tutorialSeen : mode === 'review',
    mode,
    soundEnabled:
      typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : fallback.soundEnabled,
    cluesDiscovered: Array.isArray(raw.cluesDiscovered)
      ? raw.cluesDiscovered.filter((entry): entry is string => typeof entry === 'string')
      : fallback.cluesDiscovered,
    buildingProgress: sanitizeBuildingProgress(raw.buildingProgress, mode),
    phase,
    currentMissionSeries:
      typeof raw.currentMissionSeries === 'number' &&
      Number.isInteger(raw.currentMissionSeries) &&
      raw.currentMissionSeries >= 0
        ? raw.currentMissionSeries
        : fallback.currentMissionSeries,
    completedMissionTaskIds: Array.isArray(raw.completedMissionTaskIds)
      ? raw.completedMissionTaskIds.filter((entry): entry is string => typeof entry === 'string')
      : fallback.completedMissionTaskIds
  };
}

export function loadSaveData(): SaveData {
  const storage = globalThis.localStorage;

  if (!storage) {
    return createDefaultSave('normal');
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultSave('normal');
    }

    return sanitizeSaveData(JSON.parse(raw));
  } catch {
    return createDefaultSave('normal');
  }
}

export function saveGame(data: SaveData): void {
  const storage = globalThis.localStorage;

  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetSave(): void {
  const storage = globalThis.localStorage;

  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEY);
}

export function hasMeaningfulProgress(data: SaveData): boolean {
  if (data.phase !== 'identify') {
    return true;
  }

  if (data.cluesDiscovered.length > 0) {
    return true;
  }

  return BUILDING_OPTIONS.some((building) => {
    const progress = data.buildingProgress[building.id];
    return Boolean(progress?.validated || progress?.proposed);
  });
}
