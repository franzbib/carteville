import { MISSION_SERIES } from '../data/missions';
import type { Phase } from '../types';

interface MissionPanelState {
  phase: Phase;
  currentSeriesIndex: number;
  completedTaskIds: string[];
}

export class MissionPanel {
  private readonly overlay: HTMLDivElement;
  private readonly list: HTMLDivElement;
  private readonly summary: HTMLParagraphElement;
  private open = false;

  constructor(container: HTMLElement) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'panel-overlay hidden';
    this.overlay.innerHTML = `
      <div class="mission-panel">
        <p class="panel-kicker">Missions</p>
        <h2 class="panel-heading">Tournées quotidiennes</h2>
        <p class="panel-text" data-summary></p>
        <div class="mission-list" data-list></div>
        <p class="panel-close">Appuyez sur <strong>M</strong> ou <strong>Échap</strong> pour fermer.</p>
      </div>
    `;
    container.appendChild(this.overlay);

    this.list = this.overlay.querySelector('[data-list]') as HTMLDivElement;
    this.summary = this.overlay.querySelector('[data-summary]') as HTMLParagraphElement;
  }

  render(state: MissionPanelState): void {
    const completed = new Set(state.completedTaskIds);
    this.list.innerHTML = '';

    if (state.phase === 'identify' || state.phase === 'phase2-intro') {
      this.summary.textContent =
        'Les missions se débloquent une fois tous les bâtiments correctement identifiés.';
    } else if (state.phase === 'victory') {
      this.summary.textContent = 'Toutes les séries ont été accomplies.';
    } else {
      const current = MISSION_SERIES[Math.min(state.currentSeriesIndex, MISSION_SERIES.length - 1)];
      const doneCount = current.tasks.filter((task) => completed.has(task.id)).length;
      this.summary.textContent = `${current.title} · ${doneCount} / ${current.tasks.length} tâches complétées`;
    }

    MISSION_SERIES.forEach((series, index) => {
      const block = document.createElement('div');
      const isActive = index === state.currentSeriesIndex && state.phase === 'missions';
      const isDone = index < state.currentSeriesIndex || state.phase === 'victory';
      const isLocked =
        state.phase === 'identify' ||
        state.phase === 'phase2-intro' ||
        (index > state.currentSeriesIndex && state.phase !== 'victory');

      block.className = `mission-item ${isDone ? 'done' : ''} ${isLocked ? 'locked' : ''}`.trim();

      const title = document.createElement('strong');
      title.textContent = `${series.title} · ${series.intro}`;
      block.appendChild(title);

      const tasks = document.createElement('div');
      tasks.className = 'mission-meta';
      tasks.innerHTML = series.tasks
        .map((task) => {
          const done = completed.has(task.id) || isDone;
          const marker = done ? '✓' : isActive ? '•' : '○';
          return `<div><span class="task-check">${marker}</span> ${task.label}</div>`;
        })
        .join('');

      block.appendChild(tasks);
      this.list.appendChild(block);
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
