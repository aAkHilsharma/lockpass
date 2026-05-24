import {
  Home, Briefcase, Gift, Store, Heart, Users, Settings, PieChart,
  ShoppingCart, Leaf, Shield, CreditCard, Fish, Smile, Lock, Star,
  Flame, Wallet, Bookmark, Compass, Laptop, BookOpen, Package, Atom,
  FileText, Key, Globe, Folder, Mail, Music,
  type LucideIcon,
} from 'lucide-react';

// Fixed, allow-listed set of vault icons. Stored by key in encrypted vault
// metadata; only keys present here can ever be selected or rendered.
export const VAULT_ICONS: Record<string, LucideIcon> = {
  home: Home,
  briefcase: Briefcase,
  gift: Gift,
  store: Store,
  heart: Heart,
  users: Users,
  settings: Settings,
  'pie-chart': PieChart,
  cart: ShoppingCart,
  leaf: Leaf,
  shield: Shield,
  card: CreditCard,
  fish: Fish,
  smile: Smile,
  lock: Lock,
  star: Star,
  flame: Flame,
  wallet: Wallet,
  bookmark: Bookmark,
  compass: Compass,
  laptop: Laptop,
  book: BookOpen,
  package: Package,
  atom: Atom,
  file: FileText,
  key: Key,
  globe: Globe,
  folder: Folder,
  mail: Mail,
  music: Music,
};

export const VAULT_ICON_KEYS = Object.keys(VAULT_ICONS);

export const DEFAULT_VAULT_ICON = 'home';

export const VAULT_COLORS = [
  '#C85A3A', '#EF4444', '#F59E0B', '#10B981',
  '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
  '#0E7490', '#DC2626',
];

export const DEFAULT_VAULT_COLOR = VAULT_COLORS[0]!;

// Always resolve to a valid component, falling back to the default if a
// stored key is unknown (e.g. written by a newer client).
export function resolveVaultIcon(key: string | undefined): LucideIcon {
  return (key && VAULT_ICONS[key]) || VAULT_ICONS[DEFAULT_VAULT_ICON]!;
}
