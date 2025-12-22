// src/components/IDEComponets/Terminal.ts
import { t, onLangChange } from '../../i18n/i18n';

let terminalEl: HTMLElement | null = null;

function now(): string {
  const d = new Date();
  return d.toLocaleTimeString();
}

export function initTerminal(container: HTMLElement) {
  container.innerHTML = `
    <style>
      /* VS Code–like scrollbar (inline, scoped) */
      #ide-terminal {
        scrollbar-width: thin;               /* Firefox */
        scrollbar-color: #555 transparent;
      }

      #ide-terminal::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      #ide-terminal::-webkit-scrollbar-button {
        display: none;
      }

      #ide-terminal::-webkit-scrollbar-track {
        background: transparent;
      }

      #ide-terminal::-webkit-scrollbar-track-piece {
        background: transparent;
      }

      #ide-terminal::-webkit-scrollbar-thumb {
        background-color: transparent;
        border-radius: 6px;
        transition: background-color 0.15s ease;
      }

      #ide-terminal:hover::-webkit-scrollbar-thumb {
        background-color: rgba(85, 85, 85, 0.6);
      }

      #ide-terminal::-webkit-scrollbar-thumb:hover {
        background-color: rgba(120, 120, 120, 0.8);
      }

      #ide-terminal::-webkit-scrollbar-corner {
        background: transparent;
      }

      #ide-terminal::-webkit-resizer {
        background: transparent;
      }
    </style>

    <div id="ide-terminal"
         class="h-full font-mono text-sm
                bg-black/40 text-green-400
                p-3 overflow-auto space-y-1">
    </div>
  `;

  terminalEl = container.querySelector('#ide-terminal');
  logTerminal(t('terminal.initialized'));
  
  const off = onLangChange(() => {
    // Terminal logs are translated at source
  });
  
  (container as any)._cleanup = () => off();
}

export function logTerminal(message: string) {
  if (!terminalEl) return;

  const line = document.createElement('div');
  line.className = 'whitespace-pre-wrap';
  line.textContent = `[${now()}] ${message}`;

  terminalEl.appendChild(line);

  // auto scroll
  terminalEl.scrollTop = terminalEl.scrollHeight;
}

export function clearTerminal() {
  if (terminalEl) terminalEl.innerHTML = '';
}
