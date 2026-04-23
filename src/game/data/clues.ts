export interface ClueDefinition {
  id: string;
  text: string;
}

export const CLUES: ClueDefinition[] = [
  {
    id: 'cinema-between',
    text: 'Le cinéma est entre la gare et le théâtre.'
  },
  {
    id: 'pharmacy-on-square',
    text: 'La pharmacie est sur la place du marché.'
  },
  {
    id: 'library-end-foch',
    text: "La bibliothèque est au bout de l'avenue Foch."
  },
  {
    id: 'school-opposite-pharmacy',
    text: "L'école est en face de la pharmacie."
  },
  {
    id: 'post-right-hospital',
    text: "La poste est à droite de l'hôpital."
  },
  {
    id: 'station-on-foch',
    text: "La gare est dans l'avenue Foch."
  },
  {
    id: 'theatre-corner',
    text: "Le théâtre est au coin du boulevard des Maréchaux et de l'avenue Foch."
  },
  {
    id: 'hospital-rue-rousseau',
    text: "L'hôpital est dans la rue Rousseau, à côté de la place."
  },
  {
    id: 'market-square',
    text: 'Le marché est sur la place des Grands-Hommes.'
  }
];

export const TOTAL_CLUES = CLUES.length;
