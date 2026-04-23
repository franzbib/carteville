export interface ClueDefinition {
  id: string;
  text: string;
}

export const CLUES: ClueDefinition[] = [
  {
    id: 'cinema-between',
    text: "Le cinema est entre la gare et L'ISPA."
  },
  {
    id: 'pharmacy-on-square',
    text: 'La pharmacie est sur la place Doualle.'
  },
  {
    id: 'library-end-foch',
    text: "La bibliotheque est au bout de l'avenue Blanquart."
  },
  {
    id: 'school-opposite-pharmacy',
    text: "L'ecole est en face de la pharmacie."
  },
  {
    id: 'post-right-hospital',
    text: "La poste est a droite de l'hopital."
  },
  {
    id: 'station-on-foch',
    text: "La gare est dans l'avenue Blanquart."
  },
  {
    id: 'ispa-corner',
    text: "L'ISPA est au coin du boulevard des Marechaux et de l'avenue Blanquart."
  },
  {
    id: 'hospital-francs-muriers',
    text: "L'hopital est dans la rue des francs muriers, a cote de la place."
  },
  {
    id: 'market-square',
    text: 'Le marche est sur la place Doualle.'
  }
];

export const TOTAL_CLUES = CLUES.length;
