export const AVAILABLE_ICONS = [
  'book',
  'bookmark',
  'briefcase',
  'code',
  'file-text',
  'folder',
  'heart',
  'home',
  'inbox',
  'lightbulb',
  'list',
  'music',
  'newspaper',
  'notebook',
  'pencil',
  'rocket',
  'school',
  'settings',
  'shapes',
  'star',
  'sticker',
  'target',
  'terminal',
  'trophy'
] as const;

export type AvailableIcon = typeof AVAILABLE_ICONS[number]; 