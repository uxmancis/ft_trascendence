// src/components/fileExplorer.ts
import { t, onLangChange } from '../../i18n/i18n';

export interface FileItem {
  label: string;
  labelKey?: string;
  route?: string;
  children?: FileItem[];
}

/* ===== FILE TREE (IDE STYLE) ===== */
const FILE_TREE: FileItem[] = [
  { label: 'instructions.txt', labelKey: 'explorer.instructions', route: '#/instructions' },

  { label: 'Home.tsx', route: '#/' },
  { label: 'Stats.tsx', route: '#/stats' },

  {
    label: 'Play',
    labelKey: 'explorer.play',
    children: [
      { label: 'PlayAI.tsx', route: '#/play/ai' },
      { label: 'Play1v1.tsx', route: '#/play/1v1' },
      { label: 'Play4v4.tsx', route: '#/play/4v4' },
    ],
  },

  { label: 'Tournament.tsx', route: '#/play/tournament' },
];

/* ===== FOLDER STATE ===== */

const openFolders = new Set<string>();

/* ===== ICON HELPERS ===== */

function fileIcon(label: string): string {
  if (label.endsWith('.txt')) return '📄';
  if (label.endsWith('.tsx')) return '📘';
  return '📄';
}

function folderIcon(open: boolean): string {
  return open ? '▾' : '▸';
}

/* ===== RENDER ===== */

export function renderFileExplorer(container: HTMLElement): void {
  container.innerHTML = '';

  const renderItems = (items: FileItem[], depth = 0): void => {
    items.forEach(item => {
      const row = document.createElement('div');
      const isActive = item.route && location.hash === item.route;
      const isFolder = !!item.children;
      const isOpen = isFolder && openFolders.has(item.label);

      row.className = `
        flex items-center gap-2
        px-2 py-1 rounded cursor-pointer select-none
        hover:bg-neutral-700
        ${isActive ? 'bg-neutral-700' : ''}
      `;

      row.style.paddingLeft = `${depth * 12 + 8}px`;

      /* ICON */
      const icon = document.createElement('span');
      icon.className = 'w-4 text-xs opacity-60 text-center';

      icon.textContent = isFolder
        ? folderIcon(isOpen)
        : fileIcon(item.label);

      /* LABEL */
      const label = document.createElement('span');
      label.className = 'truncate';
      if (item.labelKey) {
        label.setAttribute('data-label-key', item.labelKey);
        label.setAttribute('file', item.labelKey);
      }
      label.textContent = item.labelKey ? t(item.labelKey) : item.label;

      row.append(icon, label);
      container.appendChild(row);

      /* CLICK HANDLING */
      if (isFolder) {
        row.onclick = (): void => {
          if (isOpen)
            openFolders.delete(item.label);
          else
            openFolders.add(item.label);

          renderFileExplorer(container);
        };
      } else if (item.route) {
        row.onclick = (): void => {
          location.hash = item.route!;
        };
      }

      /* CHILDREN */
      if (isFolder && isOpen) {
        renderItems(item.children!, depth + 1);
      }
    });
  };

  renderItems(FILE_TREE);
  
  const off = onLangChange(() => {
    // Update labels that have translation keys
    const labels = container.querySelectorAll('[data-label-key]');
    labels.forEach((el: Element) => {
      const key = el.getAttribute('data-label-key');
      if (key) (el as HTMLElement).textContent = t(key);
    });
  });
  
  (container as any)._cleanup = () => off();
}

/* ===== UPDATE ACTIVE FILE ===== */

window.addEventListener('hashchange', () => {
  const container = document.getElementById('list-files');
  if (container) renderFileExplorer(container);
});
