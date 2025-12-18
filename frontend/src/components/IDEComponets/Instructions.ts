/* ************************************************************************** */
/*                                                                            */
/*                            instructions.txt                                */
/*                                                                            */
/*   IDE virtual file                                                         */
/*   Static welcome panel                                                     */
/*   Fits inside router-view (NO SCROLL)                                      */
/*                                                                            */
/* ************************************************************************** */

import { t, onLangChange, bindI18n } from '../../i18n/i18n';

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

          <p class="opacity-80" data-i18n="instructions.subtitle">
            Virtual IDE inspired by VSCode.<br>
            Multiple Pong game modes inside a single interface.
          </p>

          <div class="space-y-2 opacity-70">
            <p data-i18n="instructions.aiGame">• Game vs AI</p>
            <p data-i18n="instructions.oneVsOne">• Local 1v1</p>
            <p data-i18n="instructions.tournament">• Tournament mode</p>
            <p data-i18n="instructions.fourVsFour">• 4v4 multiplayer</p>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="space-y-4">
          <h2 class="text-sm font-bold opacity-80" data-i18n="instructions.howToStart">
            HOW TO START
          </h2>

          <ol class="list-decimal list-inside opacity-70 space-y-1">
            <li data-i18n="instructions.step1">Open a file from the Explorer</li>
            <li data-i18n="instructions.step2">Select a game mode</li>
            <li data-i18n="instructions.step3">Press Start</li>
            <li data-i18n="instructions.step4">Play & enjoy</li>
          </ol>

          <div class="pt-4 text-xs opacity-50" data-i18n="instructions.footer">
            Developed at 42 · FT_TRANSCENDENCE
          </div>
        </div>

      </div>
    </section>
  `;
  
  bindI18n(container);
  const off = onLangChange(() => {
    bindI18n(container);  // Solo re-bindear, no re-renderizar
  });
  
  (container as any)._cleanup = () => off();
}