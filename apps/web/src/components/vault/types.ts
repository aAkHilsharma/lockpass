export type ItemType = 'login' | 'note';

export type VaultItem = {
  id: string;
  vaultId: string;
  type: ItemType;
  title: string;
  sub: string;
  username?: string;
  password?: string;
  urls?: string[];
  notes?: string;
  updatedAt: string;
  favorite?: boolean;
};

export type VaultMeta = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  metadataRevision: number;
};
