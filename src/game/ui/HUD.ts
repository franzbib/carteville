export interface HUDStats {
  cluesFound: number;
  cluesTotal: number;
  buildingsValidated: number;
  buildingsLabeled: number;
  buildingsTotal: number;
  planStatus: string;
  modeLabel: string;
  soundEnabled: boolean;
}

type ToastTone = 'info' | 'success' | 'error';

interface HUDCallbacks {
  onToggleSound: () => void;
  onReset: () => void;
}

export class HUD {
  private readonly root: HTMLDivElement;
  private readonly cluesChip: HTMLSpanElement;
  private readonly buildingsChip: HTMLSpanElement;
  private readonly labelsChip: HTMLSpanElement;
  private readonly statusChip: HTMLSpanElement;
  private readonly modeChip: HTMLSpanElement;
  private readonly prompt: HTMLDivElement;
  private readonly dialogue: HTMLDivElement;
  private readonly dialogueName: HTMLDivElement;
  private readonly dialogueText: HTMLParagraphElement;
  private readonly soundButton: HTMLButtonElement;
  private readonly toastStack: HTMLDivElement;

  constructor(container: HTMLElement, callbacks: HUDCallbacks) {
    this.root = document.createElement('div');
    this.root.className = 'hud-root';
    this.root.innerHTML = `
      <div class="hud-topbar">
        <div class="hud-chip-group">
          <span class="hud-chip"><strong>Indices</strong> <span data-chip="clues"></span></span>
          <span class="hud-chip"><strong>Valides</strong> <span data-chip="buildings"></span></span>
          <span class="hud-chip"><strong>Etiquettes</strong> <span data-chip="labels"></span></span>
          <span class="hud-chip"><strong>Plan</strong> <span data-chip="status"></span></span>
          <span class="hud-chip"><strong>Mode</strong> <span data-chip="mode"></span></span>
        </div>
        <div class="hud-actions">
          <button type="button" class="hud-button" data-action="sound"></button>
          <button type="button" class="hud-button" data-action="reset">Reinitialiser</button>
        </div>
      </div>
      <div class="toast-stack"></div>
      <div class="prompt-pill hidden"></div>
      <div class="hud-dialogue hidden">
        <div class="dialogue-name"></div>
        <p class="dialogue-text"></p>
        <div class="dialogue-hint">Appuyez sur <kbd>E</kbd> ou <kbd>Echap</kbd> pour fermer.</div>
      </div>
      <aside class="hud-side">
        <h3>Touches utiles</h3>
        <ul>
          <li><kbd>Fleches</kbd> ou <kbd>ZQSD</kbd> : se deplacer</li>
          <li><kbd>E</kbd> : parler ou observer</li>
          <li><kbd>L</kbd> : etiqueter un batiment proche</li>
          <li><kbd>C</kbd> : carnet d'indices</li>
          <li><kbd>Echap</kbd> : fermer la fenetre active</li>
        </ul>
      </aside>
    `;

    container.appendChild(this.root);

    this.cluesChip = this.root.querySelector('[data-chip="clues"]') as HTMLSpanElement;
    this.buildingsChip = this.root.querySelector('[data-chip="buildings"]') as HTMLSpanElement;
    this.labelsChip = this.root.querySelector('[data-chip="labels"]') as HTMLSpanElement;
    this.statusChip = this.root.querySelector('[data-chip="status"]') as HTMLSpanElement;
    this.modeChip = this.root.querySelector('[data-chip="mode"]') as HTMLSpanElement;
    this.prompt = this.root.querySelector('.prompt-pill') as HTMLDivElement;
    this.dialogue = this.root.querySelector('.hud-dialogue') as HTMLDivElement;
    this.dialogueName = this.root.querySelector('.dialogue-name') as HTMLDivElement;
    this.dialogueText = this.root.querySelector('.dialogue-text') as HTMLParagraphElement;
    this.soundButton = this.root.querySelector('[data-action="sound"]') as HTMLButtonElement;
    this.toastStack = this.root.querySelector('.toast-stack') as HTMLDivElement;

    this.soundButton.addEventListener('click', callbacks.onToggleSound);
    (this.root.querySelector('[data-action="reset"]') as HTMLButtonElement).addEventListener(
      'click',
      callbacks.onReset
    );
  }

  update(stats: HUDStats): void {
    this.cluesChip.textContent = `${stats.cluesFound} / ${stats.cluesTotal}`;
    this.buildingsChip.textContent = `${stats.buildingsValidated} / ${stats.buildingsTotal}`;
    this.labelsChip.textContent = `${stats.buildingsLabeled} / ${stats.buildingsTotal}`;
    this.statusChip.textContent = stats.planStatus;
    this.modeChip.textContent = stats.modeLabel;
    this.soundButton.textContent = stats.soundEnabled ? 'Son actif' : 'Son coupe';
  }

  setPrompt(text: string | null): void {
    if (!text) {
      this.prompt.classList.add('hidden');
      this.prompt.innerHTML = '';
      return;
    }

    this.prompt.classList.remove('hidden');
    this.prompt.innerHTML = text;
  }

  showDialogue(name: string, text: string): void {
    this.dialogue.classList.remove('hidden');
    this.dialogueName.textContent = name;
    this.dialogueText.textContent = text;
  }

  hideDialogue(): void {
    this.dialogue.classList.add('hidden');
  }

  showToast(message: string, tone: ToastTone = 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast ${tone}`;
    toast.textContent = message;
    this.toastStack.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 2800);
  }

  destroy(): void {
    this.root.remove();
  }
}
