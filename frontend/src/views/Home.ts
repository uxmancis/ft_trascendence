import { navigate } from '../router';

export async function renderHome(root: HTMLElement){
  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow">
      <h1 class="text-3xl font-bold mb-2">¡A jugar!</h1>
      <p class="opacity-80 mb-6">Elige un modo para empezar.</p>

      <div class="grid gap-4 md:grid-cols-3">
        <!-- AI -->
        <button id="btn-ai"
          class="rounded-2xl bg-white/10 hover:bg-white/20 transition p-6 text-left shadow-lg">
          <div class="text-2xl mb-2">🤖 PARTIDO vs AI</div>
          <p class="opacity-80 text-sm">Juega contra un bot con dificultad ajustable.</p>
        </button>

        <!-- 1v1 -->
        <button id="btn-1v1"
          class="rounded-2xl bg-white/10 hover:bg-white/20 transition p-6 text-left shadow-lg">
          <div class="text-2xl mb-2">🆚 PARTIDO 1 vs 1</div>
          <p class="opacity-80 text-sm">Dos jugadores, reglas clásicas de Pong.</p>
        </button>

        <!-- Torneo -->
        <button id="btn-tournament"
          class="rounded-2xl bg-white/10 hover:bg-white/20 transition p-6 text-left shadow-lg">
          <div class="text-2xl mb-2">🏆 TORNEO 1 vs 1 vs 1 vs 1</div>
          <p class="opacity-80 text-sm">Eliminatoria rápida entre cuatro jugadores.</p>
        </button>
      </div>
    </section>
  `;

  root.querySelector<HTMLButtonElement>('#btn-ai')!.onclick = () => navigate('#/play/ai');
  root.querySelector<HTMLButtonElement>('#btn-1v1')!.onclick = () => navigate('#/play/1v1');
  root.querySelector<HTMLButtonElement>('#btn-tournament')!.onclick = () => navigate('#/play/tournament');
}
