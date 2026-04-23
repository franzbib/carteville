import './styles/global.css';

import { FrenchCityGame } from './game/Game';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error("Le conteneur principal n'a pas été trouvé.");
}

app.innerHTML = `
  <div class="app-layout">
    <div class="game-stage">
      <div class="game-shell">
        <div id="phaser-game"></div>
      </div>
    </div>
    <div id="hud-dock" class="hud-dock"></div>
  </div>
`;

new FrenchCityGame('phaser-game');
