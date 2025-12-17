// src/components/IDEComponets/Terminal.ts

let terminalEl: HTMLElement | null = null;

function now(): string {
  const d = new Date();
  return d.toLocaleTimeString();
}

export function initTerminal(container: HTMLElement) {
  container.innerHTML = `
    <div id="ide-terminal"
         class="h-full font-mono text-sm
                bg-black/40 text-green-400
                p-3 overflow-auto space-y-1">
    </div>
  `;

  terminalEl = container.querySelector('#ide-terminal');
  logTerminal('FT_TERMINAL initialized');
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
