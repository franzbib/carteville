import type { BuildingName } from '../types';

export interface BuildingDefinition {
  id: number;
  key: BuildingName;
  name: string;
  article: string;
  shortName: string;
  labelKey: string;
  color: number;
}

export const BUILDING_OPTIONS: BuildingDefinition[] = [
  {
    id: 1,
    key: 'hopital',
    name: 'hôpital',
    article: "l'hôpital",
    shortName: 'Hôpital',
    labelKey: 'H',
    color: 0xc06c65
  },
  {
    id: 2,
    key: 'poste',
    name: 'poste',
    article: 'la poste',
    shortName: 'Poste',
    labelKey: 'P',
    color: 0xe0ad57
  },
  {
    id: 3,
    key: 'ecole',
    name: 'école',
    article: "l'école",
    shortName: 'École',
    labelKey: 'E',
    color: 0x6d9f71
  },
  {
    id: 4,
    key: 'pharmacie',
    name: 'pharmacie',
    article: 'la pharmacie',
    shortName: 'Pharmacie',
    labelKey: 'F',
    color: 0x71a7ad
  },
  {
    id: 5,
    key: 'bibliotheque',
    name: 'bibliothèque',
    article: 'la bibliothèque',
    shortName: 'Bibliothèque',
    labelKey: 'B',
    color: 0x8771b4
  },
  {
    id: 6,
    key: 'gare',
    name: 'gare',
    article: 'la gare',
    shortName: 'Gare',
    labelKey: 'G',
    color: 0x5c7ca3
  },
  {
    id: 7,
    key: 'cinema',
    name: 'cinéma',
    article: 'le cinéma',
    shortName: 'Cinéma',
    labelKey: 'C',
    color: 0xd76c78
  },
  {
    id: 8,
    key: 'theatre',
    name: 'théâtre',
    article: 'le théâtre',
    shortName: 'Théâtre',
    labelKey: 'T',
    color: 0xb26f45
  },
  {
    id: 9,
    key: 'marche',
    name: 'marché',
    article: 'le marché',
    shortName: 'Marché',
    labelKey: 'M',
    color: 0x7aa056
  }
];

export const BUILDINGS_BY_KEY = Object.fromEntries(
  BUILDING_OPTIONS.map((building) => [building.key, building])
) as Record<BuildingName, BuildingDefinition>;

export const BUILDINGS_BY_ID = Object.fromEntries(
  BUILDING_OPTIONS.map((building) => [building.id, building])
) as Record<number, BuildingDefinition>;

export const LABEL_KEY_TO_BUILDING = Object.fromEntries(
  BUILDING_OPTIONS.map((building) => [building.labelKey, building.key])
) as Record<string, BuildingName>;

export const TOTAL_BUILDINGS = BUILDING_OPTIONS.length;
