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
  onInteract: () => void;
  onOpenLabel: () => void;
  onToggleNotebook: () => void;
  onCloseActive: () => void;
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
  private readonly helpPanel: HTMLDetailsElement;
  private readonly mobileControls: HTMLDivElement;
  private readonly joystickPad: HTMLDivElement;
  private readonly joystickStick: HTMLDivElement;

  private touchEnabled = false;
  private activePointerId?: number;
  private touchVector = { x: 0, y: 0 };
  private readonly resizeHandler: () => void;

  constructor(container: HTMLElement, callbacks: HUDCallbacks) {
    this.root = document.createElement('div');
    this.root.className = 'hud-root';
    this.root.innerHTML = `
      <section class="hud-toolbar">
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
      </section>
      <div class="prompt-pill hidden"></div>
      <section class="hud-dialogue hidden">
        <div class="dialogue-header">
          <div class="dialogue-name"></div>
          <button type="button" class="panel-dismiss" data-action="close-dialogue">Fermer</button>
        </div>
        <p class="dialogue-text"></p>
        <div class="dialogue-hint">Clavier : <kbd>E</kbd> ou <kbd>Echap</kbd>. Tactile : bouton <strong>Fermer</strong>.</div>
      </section>
      <details class="hud-help">
        <summary>Commandes et raccourcis</summary>
        <div class="hud-help-content">
          <div class="hud-help-block">
            <h3>Clavier</h3>
            <ul>
              <li><kbd>Fleches</kbd> ou <kbd>ZQSD</kbd> : se deplacer</li>
              <li><kbd>E</kbd> : parler ou observer</li>
              <li><kbd>L</kbd> : etiqueter un batiment proche</li>
              <li><kbd>C</kbd> : carnet d indices</li>
              <li><kbd>Echap</kbd> : fermer la fenetre active</li>
            </ul>
          </div>
          <div class="hud-help-block">
            <h3>Etiquettes</h3>
            <ul>
              <li><kbd>H</kbd> hopital</li>
              <li><kbd>P</kbd> poste</li>
              <li><kbd>E</kbd> ecole</li>
              <li><kbd>F</kbd> pharmacie</li>
              <li><kbd>B</kbd> bibliotheque</li>
              <li><kbd>G</kbd> gare</li>
              <li><kbd>C</kbd> cinema</li>
              <li><kbd>I</kbd> L'ISPA</li>
              <li><kbd>M</kbd> marche</li>
            </ul>
          </div>
        </div>
      </details>
      <section class="mobile-controls hidden">
        <div class="mobile-controls-header">
          <div>
            <p class="panel-kicker">Telephone</p>
            <h3>Commandes tactiles</h3>
          </div>
        </div>
        <div class="mobile-controls-layout">
          <div class="joystick-card">
            <div class="joystick-pad" data-joystick-pad>
              <div class="joystick-ring"></div>
              <div class="joystick-stick" data-joystick-stick></div>
            </div>
            <p class="mobile-help-copy">Glissez le pouce dans le cercle pour vous deplacer.</p>
          </div>
          <div class="mobile-action-grid">
            <button type="button" class="mobile-action" data-mobile="interact">Action</button>
            <button type="button" class="mobile-action" data-mobile="label">Etiqueter</button>
            <button type="button" class="mobile-action" data-mobile="notebook">Carnet</button>
            <button type="button" class="mobile-action" data-mobile="close">Fermer</button>
          </div>
        </div>
      </section>
      <div class="toast-stack"></div>
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
    this.helpPanel = this.root.querySelector('.hud-help') as HTMLDetailsElement;
    this.mobileControls = this.root.querySelector('.mobile-controls') as HTMLDivElement;
    this.joystickPad = this.root.querySelector('[data-joystick-pad]') as HTMLDivElement;
    this.joystickStick = this.root.querySelector('[data-joystick-stick]') as HTMLDivElement;

    this.soundButton.addEventListener('click', callbacks.onToggleSound);
    (this.root.querySelector('[data-action="reset"]') as HTMLButtonElement).addEventListener(
      'click',
      callbacks.onReset
    );
    (this.root.querySelector('[data-action="close-dialogue"]') as HTMLButtonElement).addEventListener(
      'click',
      callbacks.onCloseActive
    );

    this.root.querySelectorAll<HTMLButtonElement>('[data-mobile]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.mobile;

        if (action === 'interact') {
          callbacks.onInteract();
          return;
        }

        if (action === 'label') {
          callbacks.onOpenLabel();
          return;
        }

        if (action === 'notebook') {
          callbacks.onToggleNotebook();
          return;
        }

        callbacks.onCloseActive();
      });
    });

    this.setupJoystick();

    this.resizeHandler = () => {
      this.syncTouchLayout();
    };

    window.addEventListener('resize', this.resizeHandler);
    this.syncTouchLayout();
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

  getTouchVector(): { x: number; y: number } {
    return { ...this.touchVector };
  }

  resetTouchVector(): void {
    this.touchVector = { x: 0, y: 0 };
    this.joystickStick.style.transform = 'translate3d(0px, 0px, 0px)';
  }

  isTouchModeEnabled(): boolean {
    return this.touchEnabled;
  }

  destroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    this.root.remove();
  }

  private syncTouchLayout(): void {
    this.touchEnabled =
      window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900;

    this.mobileControls.classList.toggle('hidden', !this.touchEnabled);
    this.helpPanel.open = !this.touchEnabled;

    if (!this.touchEnabled) {
      this.resetTouchVector();
    }
  }

  private setupJoystick(): void {
    const updateFromPointer = (event: PointerEvent) => {
      const rect = this.joystickPad.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxRadius = rect.width * 0.34;
      const rawX = event.clientX - centerX;
      const rawY = event.clientY - centerY;
      const distance = Math.hypot(rawX, rawY);
      const scale = distance > maxRadius ? maxRadius / distance : 1;
      const clampedX = rawX * scale;
      const clampedY = rawY * scale;

      this.touchVector = {
        x: clampedX / maxRadius,
        y: clampedY / maxRadius
      };

      this.joystickStick.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0px)`;
    };

    const releasePointer = (event?: PointerEvent) => {
      if (event && event.pointerId !== this.activePointerId) {
        return;
      }

      this.activePointerId = undefined;
      this.resetTouchVector();
    };

    this.joystickPad.addEventListener('pointerdown', (event) => {
      if (!this.touchEnabled) {
        return;
      }

      event.preventDefault();
      this.activePointerId = event.pointerId;
      this.joystickPad.setPointerCapture(event.pointerId);
      updateFromPointer(event);
    });

    this.joystickPad.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.activePointerId) {
        return;
      }

      event.preventDefault();
      updateFromPointer(event);
    });

    this.joystickPad.addEventListener('pointerup', (event) => {
      releasePointer(event);
    });

    this.joystickPad.addEventListener('pointercancel', (event) => {
      releasePointer(event);
    });

    this.joystickPad.addEventListener('lostpointercapture', () => {
      releasePointer();
    });
  }
}
