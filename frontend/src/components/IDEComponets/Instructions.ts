/* ************************************************************************** */
/*                                                                            */
/*                            instructions.txt                                */
/*                                                                            */
/*   IDE virtual file                                                         */
/*   Static welcome panel                                                     */
/*   Fits inside router-view (NO SCROLL)                                      */
/*                                                                            */
/* ************************************************************************** */

export function renderInstructions(container: HTMLElement): void {
  container.innerHTML = `
    <section
      class="w-full h-full
             flex items-center justify-center
             font-mono text-sm
             bg-ide-bg text-ide-fg">

      <div
        class="max-w-4xl w-full
               grid grid-cols-2 gap-10
               px-10 py-8">

        <!-- LEFT -->
        <div class="space-y-4">
          <h1 class="text-lg font-bold text-ide-title">
            FT_TRANSCENDENCE
          </h1>

          <p class="opacity-80">
            Virtual IDE inspired by VSCode.<br>
            Multiple Pong game modes inside a single interface.
          </p>

          <div class="space-y-2 opacity-70">
            <p>• Game vs AI</p>
            <p>• Local 1v1</p>
            <p>• Tournament mode</p>
            <p>• 4v4 multiplayer</p>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="space-y-4">
          <h2 class="text-sm font-bold opacity-80">
            HOW TO START
          </h2>

          <ol class="list-decimal list-inside opacity-70 space-y-1">
            <li>Open a file from the Explorer</li>
            <li>Select a game mode</li>
            <li>Press Start</li>
            <li>Play & enjoy</li>
          </ol>

          <div class="pt-4 text-xs opacity-50">
            Developed at 42 · FT_TRANSCENDENCE
          </div>
        </div>

      </div>
    </section>
  `;
}