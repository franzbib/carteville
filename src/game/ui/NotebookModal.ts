import { CLUES } from '../data/clues';

interface NotebookModalCallbacks {
  onClose: () => void;
}

export class NotebookModal {
  private readonly root: HTMLDivElement;
  private readonly list: HTMLDivElement;
  private readonly counter: HTMLDivElement;
  private open = false;

  constructor(container: HTMLElement, callbacks: NotebookModalCallbacks) {
    this.root = document.createElement('div');
    this.root.className = 'dock-panel notebook-panel hidden';
    this.root.innerHTML = `
      <div class="dock-panel-header">
        <div>
          <p class="panel-kicker">Carnet</p>
          <h2 class="panel-heading">Indices decouverts</h2>
        </div>
        <button type="button" class="panel-dismiss" data-close>Fermer</button>
      </div>
      <p class="panel-text">
        Recoupez les informations donnees par les habitants pour retrouver le bon nom de chaque batiment.
      </p>
      <div class="status-pill" data-counter></div>
      <div class="clue-list" data-list></div>
      <p class="panel-close">Clavier : <strong>C</strong> ou <strong>Echap</strong>. Tactile : bouton <strong>Fermer</strong>.</p>
    `;
    container.appendChild(this.root);

    this.list = this.root.querySelector('[data-list]') as HTMLDivElement;
    this.counter = this.root.querySelector('[data-counter]') as HTMLDivElement;

    (this.root.querySelector('[data-close]') as HTMLButtonElement).addEventListener(
      'click',
      callbacks.onClose
    );
  }

  render(discoveredClues: string[]): void {
    const discovered = new Set(discoveredClues);
    this.counter.textContent = `${discovered.size} / ${CLUES.length} indices trouves`;

    this.list.innerHTML = '';

    CLUES.forEach((clue, index) => {
      const item = document.createElement('div');
      const visible = discovered.has(clue.id);
      item.className = `clue-item ${visible ? '' : 'locked'}`.trim();
      item.textContent = visible ? `${index + 1}. ${clue.text}` : `${index + 1}. Indice non decouvert.`;
      this.list.appendChild(item);
    });
  }

  show(): void {
    this.open = true;
    this.root.classList.remove('hidden');
  }

  hide(): void {
    this.open = false;
    this.root.classList.add('hidden');
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
    this.root.remove();
  }
}
