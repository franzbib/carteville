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
    id: 'francois',
    name: 'François',
    x: 616,
    y: 600,
    lines: [
      {
        clueId: 'market-square',
        text: 'Le marche est bien sur la place Doualle.'
      },
      {
        clueId: 'pharmacy-on-square',
        text: 'La pharmacie donne sur la place Doualle.'
      }
    ],
    repeatLine: 'Sur la place Doualle, le marche et la pharmacie servent de bons reperes.'
  },
  {
    id: 'rodolphe',
    name: 'Rodolphe',
    x: 246,
    y: 522,
    lines: [
      {
        clueId: 'school-opposite-pharmacy',
        text: "L'ecole est juste en face de la pharmacie."
      }
    ],
    repeatLine: "Depuis ici, on voit bien que l'ecole fait face a la pharmacie."
  },
  {
    id: 'heidi',
    name: 'Heïdi',
    x: 706,
    y: 270,
    lines: [
      {
        clueId: 'hospital-francs-muriers',
        text: "L'hopital est dans la rue des francs muriers, a cote de la place."
      },
      {
        clueId: 'post-right-hospital',
        text: "Et la poste est a droite de l'hopital."
      }
    ],
    repeatLine:
      "Dans la rue des francs muriers, l'hopital vient avant la poste quand on regarde vers la droite."
  },
  {
    id: 'delphine',
    name: 'Delphine',
    x: 386,
    y: 848,
    lines: [
      {
        clueId: 'library-end-foch',
        text: "La bibliotheque se trouve au bout de l'avenue Blanquart."
      }
    ],
    repeatLine: "La bibliotheque est tout au bout de l'avenue Blanquart."
  },
  {
    id: 'candice',
    name: 'Candice',
    x: 792,
    y: 842,
    lines: [
      {
        clueId: 'cinema-between',
        text: "Le cinema est entre la gare et L'ISPA."
      }
    ],
    repeatLine: "Pour les sorties du soir, le cinema est coince entre la gare et L'ISPA."
  },
  {
    id: 'clement',
    name: 'Clément',
    x: 1128,
    y: 590,
    lines: [
      {
        clueId: 'station-on-foch',
        text: "La gare est dans l'avenue Blanquart."
      },
      {
        clueId: 'ispa-corner',
        text: "L'ISPA est au coin du boulevard des Marechaux et de l'avenue Blanquart."
      }
    ],
    repeatLine: "Au croisement du boulevard et de l'avenue Blanquart, on ne peut pas rater L'ISPA."
  }
];
