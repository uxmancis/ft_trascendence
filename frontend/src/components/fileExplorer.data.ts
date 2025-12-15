export interface FileItem {
  label: string;
  route?: string;
  children?: FileItem[];
}

export const FILE_TREE: FileItem[] = [
  { label: 'Home', route: '#/' },
  { label: 'Stats', route: '#/stats' },
  {
    label: 'Play',
    children: [
      { label: 'AI', route: '#/play/ai' },
      { label: '1v1', route: '#/play/1v1' },
      { label: '4v4', route: '#/play/4v4' },
    ],
  },
  { label: 'Tournament', route: '#/play/tournament' },
];
