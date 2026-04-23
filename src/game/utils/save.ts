import { BUILDING_OPTIONS } from '../data/buildings';
import { CLUES } from '../data/clues';
import type { BuildingName, BuildingProgress, GameMode, LevelId, Phase, SaveData } from '../types';

const STORAGE_KEY = 'fle-city-game-save-v1';

const VALID_BUILDING_NAMES = new Set<BuildingName>(BUILDING_OPTIONS.map((building) => building.key));
const LEGACY_BUILDING_NAME_MAP: Record<string, BuildingName> = {
  theatre: 'ispa'
};
const LEGACY_CLUE_ID_MAP: Record<string, string> = {
  'theatre-corner': 'ispa-corner',
  'hospital-rue-rousseau': 'hospital-francs-muriers'
};

function createLevel2Seed(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}

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

function normalizeBuildingName(input: unknown): BuildingName | undefined {
  if (typeof input !== 'string') {
    return undefined;
  }

  const migrated = LEGACY_BUILDING_NAME_MAP[input] ?? input;
  return VALID_BUILDING_NAMES.has(migrated as BuildingName) ? (migrated as BuildingName) : undefined;
}

function normalizeClueIds(input: unknown, mode: GameMode): string[] {
  if (mode === 'review') {
    return CLUES.map((clue) => clue.id);
  }

  if (!Array.isArray(input)) {
    return [];
  }

  const validIds = new Set(CLUES.map((clue) => clue.id));
  return Array.from(
    new Set(
      input
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => LEGACY_CLUE_ID_MAP[entry] ?? entry)
        .filter((entry) => validIds.has(entry))
    )
  );
}

function derivePhase(
  rawPhase: unknown,
  mode: GameMode,
  buildingProgress: Record<number, BuildingProgress>
): Phase {
  if (mode === 'review') {
    return 'complete';
  }

  if (rawPhase === 'complete') {
    return 'complete';
  }

  if (rawPhase === 'phase2-intro' || rawPhase === 'missions' || rawPhase === 'victory') {
    return 'complete';
  }

  const allValidated = BUILDING_OPTIONS.every((building) => buildingProgress[building.id].validated);
  return allValidated ? 'complete' : 'identify';
}

function deriveCurrentLevel(rawLevel: unknown): LevelId {
  if (rawLevel === 3) {
    return 3;
  }

  return rawLevel === 2 ? 2 : 1;
}

function normalizeLevel2Seed(input: unknown): string {
  return typeof input === 'string' && input.trim().length > 0 ? input : createLevel2Seed();
}

export function createDefaultSave(mode: GameMode = 'normal'): SaveData {
  const reviewMode = mode === 'review';

  return {
    version: 2,
    started: false,
    tutorialSeen: reviewMode,
    mode,
    soundEnabled: true,
    cluesDiscovered: reviewMode ? CLUES.map((clue) => clue.id) : [],
    buildingProgress: createBuildingProgress(reviewMode),
    phase: reviewMode ? 'complete' : 'identify',
    currentLevel: 1,
    level2Seed: createLevel2Seed()
  };
}

function sanitizeBuildingProgress(input: unknown, mode: GameMode): Record<number, BuildingProgress> {
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

    const proposed = normalizeBuildingName(raw.proposed) ?? fallback[building.id].proposed;

    fallback[building.id] = {
      proposed,
      validated: typeof raw.validated === 'boolean' ? raw.validated : fallback[building.id].validated,
      flaggedWrong:
        typeof raw.flaggedWrong === 'boolean' ? raw.flaggedWrong : fallback[building.id].flaggedWrong
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
    raw.mode === 'easy' || raw.mode === 'normal' || raw.mode === 'review' ? raw.mode : fallback.mode;
  const buildingProgress = sanitizeBuildingProgress(raw.buildingProgress, mode);

  return {
    version: 2,
    started: typeof raw.started === 'boolean' ? raw.started : fallback.started,
    tutorialSeen: typeof raw.tutorialSeen === 'boolean' ? raw.tutorialSeen : mode === 'review',
    mode,
    soundEnabled: typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : fallback.soundEnabled,
    cluesDiscovered: normalizeClueIds(raw.cluesDiscovered, mode),
    buildingProgress,
    phase: derivePhase(raw.phase, mode, buildingProgress),
    currentLevel: deriveCurrentLevel((raw as Partial<SaveData>).currentLevel),
    level2Seed: normalizeLevel2Seed((raw as Partial<SaveData>).level2Seed)
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
  if (data.currentLevel !== 1) {
    return true;
  }

  if (data.phase === 'complete') {
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

export function regenerateLevel2Seed(data: SaveData): SaveData {
  return {
    ...data,
    level2Seed: createLevel2Seed()
  };
}
