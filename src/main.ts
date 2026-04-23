import './styles/global.css';

import { FrenchCityGame } from './game/Game';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error("Le conteneur principal n'a pas été trouvé.");
}

app.innerHTML = `
  <div class="game-shell">
    <div id="phaser-game"></div>
    <div id="ui-layer" class="ui-layer"></div>
  </div>
`;

new FrenchCityGame('phaser-game');
