export interface NPCLine {
  clueId: string;
  text: string;
}

export interface NPCData {
  id: string;
  name: string;
  x: number;
  y: number;
  facing?: 'left' | 'right';
  lines: NPCLine[];
  repeatLine: string;
}

export const NPCS: NPCData[] = [
  {
    id: 'julie',
    name: 'Julie',
    x: 616,
    y: 600,
    lines: [
      {
        clueId: 'market-square',
        text: 'Le marché est bien sur la place des Grands-Hommes.'
      }
    ],
    repeatLine: 'Je passe souvent par la place des Grands-Hommes pour le marché.'
  },
  {
    id: 'malik',
    name: 'Malik',
    x: 246,
    y: 522,
    lines: [
      {
        clueId: 'school-opposite-pharmacy',
        text: "L'école est juste en face de la pharmacie."
      }
    ],
    repeatLine: "Depuis ici, on voit bien que l'école fait face à la pharmacie."
  },
  {
    id: 'sophie',
    name: 'Sophie',
    x: 706,
    y: 270,
    lines: [
      {
        clueId: 'hospital-rue-rousseau',
        text: "L'hôpital est dans la rue Rousseau, à côté de la place."
      },
      {
        clueId: 'post-right-hospital',
        text: "Et la poste est à droite de l'hôpital."
      }
    ],
    repeatLine: "Sur la rue Rousseau, l'hôpital vient avant la poste quand on regarde vers la droite."
  },
  {
    id: 'hugo',
    name: 'Hugo',
    x: 386,
    y: 848,
    lines: [
      {
        clueId: 'library-end-foch',
        text: "La bibliothèque se trouve au bout de l'avenue Foch."
      }
    ],
    repeatLine: "La bibliothèque ferme tard, tout au bout de l'avenue Foch."
  },
  {
    id: 'ines',
    name: 'Inès',
    x: 792,
    y: 842,
    lines: [
      {
        clueId: 'cinema-between',
        text: 'Le cinéma est entre la gare et le théâtre.'
      }
    ],
    repeatLine: 'Pour les sorties du soir, le cinéma est coincé entre la gare et le théâtre.'
  },
  {
    id: 'nadia',
    name: 'Nadia',
    x: 1128,
    y: 590,
    lines: [
      {
        clueId: 'station-on-foch',
        text: "La gare est dans l'avenue Foch."
      },
      {
        clueId: 'theatre-corner',
        text: "Le théâtre est au coin du boulevard des Maréchaux et de l'avenue Foch."
      }
    ],
    repeatLine: "Au croisement du boulevard et de l'avenue Foch, on ne peut pas rater le théâtre."
  },
  {
    id: 'paul',
    name: 'Paul',
    x: 930,
    y: 422,
    lines: [
      {
        clueId: 'pharmacy-on-square',
        text: 'La pharmacie donne sur la place du marché.'
      }
    ],
    repeatLine: 'La pharmacie est juste au bord de la place.'
  }
];
