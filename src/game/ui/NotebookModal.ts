import { CLUES } from '../data/clues';

export class NotebookModal {
  private readonly overlay: HTMLDivElement;
  private readonly list: HTMLDivElement;
  private readonly counter: HTMLDivElement;
  private open = false;

  constructor(container: HTMLElement) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'panel-overlay hidden';
    this.overlay.innerHTML = `
      <div class="notebook-panel">
        <p class="panel-kicker">Carnet</p>
        <h2 class="panel-heading">Indices découverts</h2>
        <p class="panel-text">
          Recoupez les informations recueillies auprès des habitants pour retrouver le bon nom de chaque bâtiment.
        </p>
        <div class="status-pill" data-counter></div>
        <div class="clue-list" data-list></div>
        <p class="panel-close">Appuyez sur <strong>C</strong> ou <strong>Échap</strong> pour fermer.</p>
      </div>
    `;
    container.appendChild(this.overlay);

    this.list = this.overlay.querySelector('[data-list]') as HTMLDivElement;
    this.counter = this.overlay.querySelector('[data-counter]') as HTMLDivElement;
  }

  render(discoveredClues: string[]): void {
    const discovered = new Set(discoveredClues);
    this.counter.textContent = `${discovered.size} / ${CLUES.length} indices trouvés`;

    this.list.innerHTML = '';

    CLUES.forEach((clue, index) => {
      const item = document.createElement('div');
      const visible = discovered.has(clue.id);
      item.className = `clue-item ${visible ? '' : 'locked'}`.trim();
      item.textContent = visible ? `${index + 1}. ${clue.text}` : `${index + 1}. Indice non découvert.`;
      this.list.appendChild(item);
    });
  }

  show(): void {
    this.open = true;
    this.overlay.classList.remove('hidden');
  }

  hide(): void {
    this.open = false;
    this.overlay.classList.add('hidden');
  }

  toggle(): void {
    if (this.open) {
      this.hide();
    } else {
      this.show();
    }
  }

  isOpen(): boolean {
    return this.open;
  }

  destroy(): void {
    this.overlay.remove();
  }
}
