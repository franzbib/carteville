import { BUILDING_OPTIONS, BUILDINGS_BY_KEY } from '../data/buildings';
import type { BuildingName, GameMode } from '../types';

interface LabelModalOptions {
  buildingNumber: number;
  currentProposal?: BuildingName;
  mode: GameMode;
}

export class LabelModal {
  private readonly overlay: HTMLDivElement;
  private readonly title: HTMLHeadingElement;
  private readonly subtitle: HTMLParagraphElement;
  private readonly choices: HTMLDivElement;
  private open = false;

  constructor(container: HTMLElement) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay hidden';
    this.overlay.innerHTML = `
      <div class="modal-card">
        <p class="panel-kicker">Étiquetage</p>
        <h2 class="panel-heading" data-title></h2>
        <p class="panel-text label-subtitle" data-subtitle></p>
        <div class="label-grid">
          <div class="label-choices" data-choices></div>
        </div>
        <p class="panel-close">Utilisez les lettres indiquées, ou <strong>Échap</strong> pour fermer.</p>
      </div>
    `;
    container.appendChild(this.overlay);

    this.title = this.overlay.querySelector('[data-title]') as HTMLHeadingElement;
    this.subtitle = this.overlay.querySelector('[data-subtitle]') as HTMLParagraphElement;
    this.choices = this.overlay.querySelector('[data-choices]') as HTMLDivElement;
  }

  show(options: LabelModalOptions): void {
    this.open = true;
    this.overlay.classList.remove('hidden');
    this.title.textContent = `Bâtiment ${options.buildingNumber}`;

    if (options.currentProposal) {
      this.subtitle.textContent = `Proposition actuelle : ${BUILDINGS_BY_KEY[options.currentProposal].shortName}. Mode ${options.mode === 'easy' ? 'facile' : options.mode === 'normal' ? 'normal' : 'révision'}.`;
    } else {
      this.subtitle.textContent =
        options.mode === 'easy'
          ? 'En mode facile, la réponse est vérifiée immédiatement.'
          : 'Choisissez le nom qui correspond à ce bâtiment.';
    }

    this.choices.innerHTML = '';
    BUILDING_OPTIONS.forEach((building) => {
      const row = document.createElement('div');
      row.className = 'label-choice';
      row.innerHTML = `
        <span><span class="choice-key">${building.labelKey}</span> <strong>${building.shortName}</strong></span>
        <span>${building.article}</span>
      `;
      this.choices.appendChild(row);
    });
  }

  hide(): void {
    this.open = false;
    this.overlay.classList.add('hidden');
  }

  isOpen(): boolean {
    return this.open;
  }

  destroy(): void {
    this.overlay.remove();
  }
}
