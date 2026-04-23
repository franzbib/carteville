import { BUILDING_OPTIONS, BUILDINGS_BY_KEY } from '../data/buildings';
import type { BuildingName, GameMode } from '../types';

interface LabelModalOptions {
  buildingNumber: number;
  currentProposal?: BuildingName;
  mode: GameMode;
}

interface LabelModalCallbacks {
  onClose: () => void;
  onSelect: (key: string) => void;
}

export class LabelModal {
  private readonly root: HTMLDivElement;
  private readonly title: HTMLHeadingElement;
  private readonly subtitle: HTMLParagraphElement;
  private readonly choices: HTMLDivElement;
  private open = false;

  constructor(container: HTMLElement, callbacks: LabelModalCallbacks) {
    this.root = document.createElement('div');
    this.root.className = 'dock-panel label-panel hidden';
    this.root.innerHTML = `
      <div class="dock-panel-header">
        <div>
          <p class="panel-kicker">Etiquetage</p>
          <h2 class="panel-heading" data-title></h2>
        </div>
        <button type="button" class="panel-dismiss" data-close>Fermer</button>
      </div>
      <p class="panel-text label-subtitle" data-subtitle></p>
      <div class="label-grid">
        <div class="label-choices" data-choices></div>
      </div>
      <p class="panel-close">Clavier : utilisez les lettres. Tactile : touchez directement le bon nom.</p>
    `;
    container.appendChild(this.root);

    this.title = this.root.querySelector('[data-title]') as HTMLHeadingElement;
    this.subtitle = this.root.querySelector('[data-subtitle]') as HTMLParagraphElement;
    this.choices = this.root.querySelector('[data-choices]') as HTMLDivElement;

    (this.root.querySelector('[data-close]') as HTMLButtonElement).addEventListener(
      'click',
      callbacks.onClose
    );

    this.choices.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-key]');
      if (!target) {
        return;
      }

      callbacks.onSelect(target.dataset.key ?? '');
    });
  }

  show(options: LabelModalOptions): void {
    this.open = true;
    this.root.classList.remove('hidden');
    this.title.textContent = `Batiment ${options.buildingNumber}`;

    if (options.currentProposal) {
      this.subtitle.textContent = `Proposition actuelle : ${BUILDINGS_BY_KEY[options.currentProposal].shortName}. Mode ${options.mode === 'easy' ? 'facile' : options.mode === 'normal' ? 'normal' : 'revision'}.`;
    } else {
      this.subtitle.textContent =
        options.mode === 'easy'
          ? 'En mode facile, la reponse est verifiee immediatement.'
          : 'Choisissez le nom qui correspond a ce batiment.';
    }

    this.choices.innerHTML = '';
    BUILDING_OPTIONS.forEach((building) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'label-choice';
      row.dataset.key = building.labelKey;
      row.innerHTML = `
        <span><span class="choice-key">${building.labelKey}</span> <strong>${building.shortName}</strong></span>
        <span>${building.article}</span>
      `;
      this.choices.appendChild(row);
    });
  }

  hide(): void {
    this.open = false;
    this.root.classList.add('hidden');
  }

  isOpen(): boolean {
    return this.open;
  }

  destroy(): void {
    this.root.remove();
  }
}
