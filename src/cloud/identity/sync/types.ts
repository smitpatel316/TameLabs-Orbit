// TameLabs Cloud Sync types

export type CloudProfile = {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string;
  hubble_brier?: number | null;
  hubble_predictions_count?: number;
  hubble_resolved_count?: number;
  hubble_tier?: 'unranked' | 'novice' | 'calibrated' | 'sharp' | 'oracle';
  orbit_contacts_count?: number;
  quiet_speaks_count?: number;
  public_key?: string | null;
  created_at: string;
  updated_at: string;
};

export type CloudCircle = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  invite_code: string;
  is_public: boolean;
  color?: string | null;
  created_at: string;
  updated_at: string;
  members_count?: number;
  is_owner?: boolean;
};

export type CloudCircleMember = {
  id: string;
  circle_id: string;
  user_id: string | null;
  display_name: string | null;
  role: 'owner' | 'member';
  added_at: string;
  added_by?: string | null;
};

export type CloudInvite = {
  id: string;
  circle_id: string;
  created_by: string;
  code: string; // quiet-xxxx
  encrypted_blob?: string | null;
  recipient_public_key?: string | null;
  max_uses: number;
  uses: number;
  expires_at: string;
  created_at: string;
};

export type CloudPost = {
  id: string;
  owner_id: string;
  circle_id: string | null;
  content: string;
  author_display: string;
  tags: string[];
  created_at: string;
  updated_at?: string;
};

export type CreateCircleParams = { name: string; description?: string; is_public?: boolean; color?: string };
export type CreateInviteParams = { circle_id: string; max_uses?: number; expires_in_hours?: number; encrypted_blob?: string; recipient_public_key?: string };

export type SyncResult<T> = { data: T | null; error?: string };
