import type { RectLike } from '../types';

export interface RoadDefinition extends RectLike {
  id: string;
  label?: string;
  labelX?: number;
  labelY?: number;
  rotation?: number;
}

export interface BuildingLayout extends RectLike {
  id: number;
  namePlateOffsetY?: number;
}

export const MAP_WIDTH = 1400;
export const MAP_HEIGHT = 960;

export const SPAWN_POINT = { x: 645, y: 615 };

export const ROAD_RECTS: RoadDefinition[] = [
  {
    id: 'rue-francs-muriers',
    x: 90,
    y: 150,
    width: 930,
    height: 104,
    label: 'rue des francs muriers',
    labelX: 292,
    labelY: 202
  },
  {
    id: 'rue-st-michel',
    x: 942,
    y: 92,
    width: 116,
    height: 338,
    label: 'rue Saint-Michel',
    labelX: 908,
    labelY: 222,
    rotation: -90
  },
  {
    id: 'avenue-foch',
    x: 90,
    y: 700,
    width: 1120,
    height: 126,
    label: 'avenue Foch',
    labelX: 1042,
    labelY: 854
  },
  {
    id: 'boulevard-marechaux',
    x: 1092,
    y: 88,
    width: 132,
    height: 770,
    label: 'boulevard des Marechaux',
    labelX: 1278,
    labelY: 456,
    rotation: -90
  },
  {
    id: 'link-market-west',
    x: 278,
    y: 360,
    width: 152,
    height: 126
  },
  {
    id: 'link-market-south',
    x: 598,
    y: 556,
    width: 130,
    height: 154
  },
  {
    id: 'link-market-east',
    x: 790,
    y: 360,
    width: 184,
    height: 126
  }
];

export const PLACE_RECT: RectLike = {
  x: 430,
  y: 290,
  width: 360,
  height: 280
};

export const PARKING_RECT: RectLike = {
  x: 880,
  y: 308,
  width: 186,
  height: 238
};

export const BUILDING_LAYOUTS: Record<number, BuildingLayout> = {
  1: { id: 1, x: 528, y: 78, width: 212, height: 122 },
  2: { id: 2, x: 1054, y: 112, width: 134, height: 116 },
  3: { id: 3, x: 130, y: 352, width: 170, height: 132 },
  4: { id: 4, x: 326, y: 368, width: 84, height: 106 },
  5: { id: 5, x: 116, y: 642, width: 296, height: 162 },
  6: { id: 6, x: 520, y: 642, width: 160, height: 162 },
  7: { id: 7, x: 718, y: 642, width: 160, height: 162 },
  8: { id: 8, x: 1000, y: 642, width: 178, height: 162 },
  9: { id: 9, x: 542, y: 374, width: 134, height: 112 }
};

export const TREE_POINTS = [
  { x: 86, y: 112, scale: 1.1 },
  { x: 164, y: 108, scale: 0.85 },
  { x: 1260, y: 110, scale: 1 },
  { x: 1240, y: 228, scale: 0.9 },
  { x: 126, y: 544, scale: 0.95 },
  { x: 242, y: 560, scale: 1.05 },
  { x: 866, y: 614, scale: 0.9 },
  { x: 950, y: 608, scale: 1.1 },
  { x: 1272, y: 654, scale: 0.92 },
  { x: 1260, y: 794, scale: 1.05 }
];

export const BENCH_POINTS = [
  { x: 470, y: 580, rotation: 0 },
  { x: 716, y: 580, rotation: 0 },
  { x: 828, y: 478, rotation: 90 },
  { x: 396, y: 478, rotation: 90 }
];

export const LAMP_POINTS = [
  { x: 444, y: 268 },
  { x: 774, y: 268 },
  { x: 814, y: 584 },
  { x: 404, y: 584 },
  { x: 948, y: 288 },
  { x: 948, y: 548 }
];
