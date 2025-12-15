interface FileItem {
  label: string;
  route?: string;
}

const FILES: FileItem[] = [
  { label: 'Home.tsx', route: '#/' },
  { label: 'Stats.tsx', route: '#/stats' },
  { label: 'PlayAI.tsx', route: '#/play/ai' },
  { label: 'Play1v1.tsx', route: '#/play/1v1' },
  { label: 'Tournament.tsx', route: '#/play/tournament' },
];

export function renderFileExplorer(container: HTMLElement): void {
  container.innerHTML = '';

  FILES.forEach(item => {
    const row = document.createElement('div');

    const isActive = location.hash === item.route;

    row.className = `
      px-2 py-1 rounded cursor-pointer
      hover:bg-neutral-700
      ${isActive ? 'bg-neutral-700' : ''}
    `;

    row.textContent = item.label;

    row.onclick = () => {
      if (item.route) {
        location.hash = item.route;
      }
    };

    container.appendChild(row);
  });
}

// Re-render para resaltar activo al cambiar ruta
window.addEventListener('hashchange', () => {
  const container = document.getElementById('list-files');
  if (container) {
    renderFileExplorer(container);
  }
});
