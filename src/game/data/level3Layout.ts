export interface Level3CircleZone {
  x: number;
  y: number;
  radius: number;
}

export interface Level3PointOfInterest {
  key: string;
  label: string;
  x: number;
  y: number;
}

export const LEVEL3_MAP_KEY = 'level3-map';
export const LEVEL3_SOURCE_WIDTH = 1055;
export const LEVEL3_SOURCE_HEIGHT = 1491;
export const LEVEL3_SCALE = 1.6;
export const LEVEL3_WORLD_WIDTH = Math.round(LEVEL3_SOURCE_WIDTH * LEVEL3_SCALE);
export const LEVEL3_WORLD_HEIGHT = Math.round(LEVEL3_SOURCE_HEIGHT * LEVEL3_SCALE);
export const LEVEL3_PLAYER_SPEED = 250;

const SOURCE_SPAWN = { x: 430, y: 520 };

const SOURCE_WALKABLE_ZONES: Level3CircleZone[] = [
  { x: 96, y: 155, radius: 92 },
  { x: 77, y: 292, radius: 70 },
  { x: 70, y: 412, radius: 74 },
  { x: 82, y: 552, radius: 82 },
  { x: 94, y: 710, radius: 80 },
  { x: 99, y: 874, radius: 90 },
  { x: 96, y: 1030, radius: 92 },
  { x: 88, y: 1192, radius: 98 },
  { x: 90, y: 1342, radius: 96 },
  { x: 150, y: 246, radius: 78 },
  { x: 198, y: 356, radius: 76 },
  { x: 262, y: 304, radius: 68 },
  { x: 376, y: 286, radius: 84 },
  { x: 482, y: 300, radius: 84 },
  { x: 423, y: 442, radius: 130 },
  { x: 266, y: 468, radius: 92 },
  { x: 215, y: 575, radius: 80 },
  { x: 189, y: 688, radius: 82 },
  { x: 154, y: 808, radius: 84 },
  { x: 274, y: 864, radius: 84 },
  { x: 333, y: 929, radius: 90 },
  { x: 292, y: 1046, radius: 84 },
  { x: 246, y: 1170, radius: 86 },
  { x: 282, y: 1314, radius: 88 },
  { x: 427, y: 542, radius: 90 },
  { x: 456, y: 674, radius: 82 },
  { x: 458, y: 814, radius: 84 },
  { x: 454, y: 952, radius: 86 },
  { x: 448, y: 1094, radius: 88 },
  { x: 426, y: 1238, radius: 98 },
  { x: 420, y: 1356, radius: 112 },
  { x: 642, y: 474, radius: 98 },
  { x: 658, y: 594, radius: 84 },
  { x: 586, y: 698, radius: 90 },
  { x: 590, y: 850, radius: 88 },
  { x: 534, y: 1010, radius: 84 },
  { x: 604, y: 1136, radius: 86 },
  { x: 680, y: 1238, radius: 88 },
  { x: 812, y: 1290, radius: 96 },
  { x: 918, y: 1218, radius: 90 },
  { x: 994, y: 1300, radius: 90 },
  { x: 1010, y: 1186, radius: 78 },
  { x: 681, y: 994, radius: 86 },
  { x: 790, y: 1040, radius: 90 },
  { x: 856, y: 888, radius: 96 },
  { x: 852, y: 720, radius: 80 },
  { x: 972, y: 782, radius: 82 },
  { x: 988, y: 938, radius: 78 },
  { x: 946, y: 1080, radius: 88 },
  { x: 712, y: 404, radius: 76 },
  { x: 770, y: 508, radius: 74 },
  { x: 768, y: 247, radius: 80 },
  { x: 846, y: 178, radius: 74 },
  { x: 940, y: 162, radius: 74 },
  { x: 987, y: 266, radius: 70 },
  { x: 930, y: 366, radius: 74 },
  { x: 972, y: 474, radius: 70 },
  { x: 900, y: 566, radius: 70 },
  { x: 834, y: 418, radius: 66 },
  { x: 776, y: 330, radius: 68 },
  { x: 532, y: 1362, radius: 112 },
  { x: 660, y: 1364, radius: 108 },
  { x: 202, y: 1380, radius: 96 }
];

const SOURCE_POINTS_OF_INTEREST: Level3PointOfInterest[] = [
  { key: 'gambetta', label: 'place Gambetta', x: 429, y: 525 },
  { key: 'cathedrale', label: 'cathedrale', x: 425, y: 268 },
  { key: 'marchand', label: 'marche couvert', x: 645, y: 414 },
  { key: 'poste', label: 'poste', x: 220, y: 574 },
  { key: 'bibliotheque', label: 'bibliotheque', x: 654, y: 586 },
  { key: 'theatre', label: 'theatre', x: 583, y: 721 },
  { key: 'cinema', label: 'cinema', x: 585, y: 864 },
  { key: 'tour', label: 'tour des Horizons', x: 905, y: 788 },
  { key: 'ispa', label: 'ISPA', x: 458, y: 1030 },
  { key: 'ecole', label: 'ecole', x: 694, y: 1021 },
  { key: 'universite', label: 'universite', x: 864, y: 1081 },
  { key: 'gare', label: 'gare', x: 429, y: 1346 },
  { key: 'office', label: 'office de tourisme', x: 704, y: 1284 },
  { key: 'parc', label: 'parc Saint-Leu', x: 651, y: 253 },
  { key: 'mediatheque', label: 'mediatheque', x: 982, y: 1219 },
  { key: 'atterrissage', label: 'zone d atterrissage', x: 78, y: 1210 }
];

export const LEVEL3_ZONE_SUMMARY = [
  'le coeur historique autour de la cathedrale et de la place Gambetta',
  'les grands axes jusqu a la gare, l ISPA et le cafe des etudiants',
  'le secteur est vers la bibliotheque, la tour et les promenades sur l eau',
  'la facade ouest avec le poste, le commissariat et la zone d atterrissage'
];

export const LEVEL3_SPAWN = scalePoint(SOURCE_SPAWN);
export const LEVEL3_WALKABLE_ZONES = SOURCE_WALKABLE_ZONES.map(scaleCircle);
export const LEVEL3_POINTS_OF_INTEREST = SOURCE_POINTS_OF_INTEREST.map(scalePoint);

function scalePoint<T extends { x: number; y: number }>(point: T): T {
  return {
    ...point,
    x: point.x * LEVEL3_SCALE,
    y: point.y * LEVEL3_SCALE
  };
}

function scaleCircle(zone: Level3CircleZone): Level3CircleZone {
  return {
    x: zone.x * LEVEL3_SCALE,
    y: zone.y * LEVEL3_SCALE,
    radius: zone.radius * LEVEL3_SCALE
  };
}
