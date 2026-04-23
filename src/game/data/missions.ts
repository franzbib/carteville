import type { BuildingName } from '../types';

export interface MissionTask {
  id: string;
  label: string;
  targets: BuildingName[];
}

export interface MissionSeries {
  id: string;
  title: string;
  intro: string;
  tasks: MissionTask[];
}

const ticketsTask: MissionTask = {
  id: 'buy-evening-tickets',
  label: 'Acheter des billets pour ce soir',
  targets: ['theatre', 'cinema']
};

export const MISSION_SERIES: MissionSeries[] = [
  {
    id: 'series-1',
    title: 'Série 1',
    intro: 'Les premiers déplacements du jour commencent.',
    tasks: [
      {
        id: 'register-children',
        label: "Inscrire les enfants à l'école",
        targets: ['ecole']
      },
      {
        id: 'buy-stamps-1',
        label: 'Acheter des timbres',
        targets: ['poste']
      },
      {
        id: 'see-doctor-1',
        label: 'Voir un docteur',
        targets: ['hopital']
      }
    ]
  },
  {
    id: 'series-2',
    title: 'Série 2',
    intro: 'Le quartier se remplit, vos repères doivent maintenant être solides.',
    tasks: [
      {
        id: 'buy-train-ticket',
        label: 'Acheter un billet Paris-Marseille',
        targets: ['gare']
      },
      {
        id: 'visit-pharmacy-1',
        label: 'Passer à la pharmacie',
        targets: ['pharmacie']
      },
      ticketsTask
    ]
  },
  {
    id: 'series-3',
    title: 'Série 3',
    intro: 'Une nouvelle liste vous attend.',
    tasks: [
      {
        id: 'see-doctor-2',
        label: 'Voir un docteur',
        targets: ['hopital']
      },
      {
        id: 'buy-organic-food',
        label: 'Acheter des produits bio',
        targets: ['marche']
      },
      {
        id: 'buy-stamps-2',
        label: 'Acheter des timbres',
        targets: ['poste']
      }
    ]
  },
  {
    id: 'series-4',
    title: 'Série 4',
    intro: 'Dernière tournée dans le quartier.',
    tasks: [
      {
        id: 'buy-evening-tickets-2',
        label: 'Acheter des billets pour ce soir',
        targets: ['theatre', 'cinema']
      },
      {
        id: 'return-library-book',
        label: 'Rendre un livre à la bibliothèque',
        targets: ['bibliotheque']
      },
      {
        id: 'visit-pharmacy-2',
        label: 'Passer à la pharmacie',
        targets: ['pharmacie']
      }
    ]
  }
];
