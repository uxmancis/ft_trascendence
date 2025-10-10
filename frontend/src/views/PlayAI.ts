export async function renderPlayAI(root: HTMLElement){
  root.innerHTML = `
    <section class="mx-auto max-w-6xl p-6 grow">
      <h1 class="text-2xl font-bold mb-4">🤖 Partido vs AI</h1>

      <form id="form-ai" class="grid gap-3 md:grid-cols-4 items-end mb-6">
        <label class="grid gap-1">
          <span class="text-sm opacity-80">Dificultad</span>
          <select id="difficulty" class="px-3 py-2 rounded text-black">
            <option value="easy">Fácil</option>
            <option value="normal" selected>Normal</option>
            <option value="hard">Difícil</option>
          </select>
        </label>
        <button class="px-4 py-2 rounded bg-black/40 hover:bg-black/60 text-white md:col-span-1">
          Comenzar
        </button>
      </form>

      <div class="rounded-2xl bg-white/10 aspect-video grid place-items-center">
        <p class="opacity-80">[Canvas del juego aquí]</p>
      </div>
    </section>
  `;

  (root.querySelector('#form-ai') as HTMLFormElement).onsubmit = (e) => {
    e.preventDefault();
    const difficulty = (root.querySelector('#difficulty') as HTMLSelectElement).value;
    console.log('Start AI game with difficulty:', difficulty);
    // aquí inicializarías tu engine de Pong con la IA
  };
}
