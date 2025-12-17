// src/components/fileExplorer.ts

export interface FileItem {
  label: string;
  route?: string;
  children?: FileItem[];
}

/* ===== FILE TREE (IDE STYLE) ===== */
const FILE_TREE: FileItem[] = [
  { label: 'Home.tsx', route: '#/' },
  { label: 'Stats.tsx', route: '#/stats' },
  {
    label: 'Play',
    children: [
      { label: 'PlayAI.tsx', route: '#/play/ai' },
      { label: 'Play1v1.tsx', route: '#/play/1v1' },
      { label: 'Play4v4.tsx', route: '#/play/4v4' },
    ],
  },
  { label: 'Tournament.tsx', route: '#/play/tournament' },
];

/* ===== RENDER ===== */
export function renderFileExplorer(container: HTMLElement): void {
  container.innerHTML = '';

  const renderItems = (items: FileItem[], depth = 0) => {
    items.forEach(item => {
      const row = document.createElement('div');
      const isActive = item.route && location.hash === item.route;

      row.className = `
        flex items-center gap-1
        px-2 py-1 rounded cursor-pointer
        hover:bg-neutral-700
        ${isActive ? 'bg-neutral-700' : ''}
      `;

      row.style.paddingLeft = `${depth * 12 + 8}px`;

      /* icon */
      const icon = document.createElement('span');
      icon.className = 'w-4 text-xs opacity-60 text-center';
      icon.textContent = item.children ? '▸' : '•';

      /* label */
      const label = document.createElement('span');
      label.className = 'truncate';
      label.textContent = item.label;

      row.append(icon, label);

      if (item.route) {
        row.onclick = () => {
          location.hash = item.route!;
        };
      }

      container.appendChild(row);

      if (item.children) {
        renderItems(item.children, depth + 1);
      }
    });
  };

  renderItems(FILE_TREE);
}

/* ===== AUTO UPDATE ACTIVE FILE ===== */
window.addEventListener('hashchange', () => {
  const container = document.getElementById('list-files');
  if (container) {
    renderFileExplorer(container);
  }
});
