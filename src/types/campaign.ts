export interface Campaign {
  id: string;
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  image: string;
  tags: string[];
  cta?: string;
  background?: string;
  color?: string;
}
export interface Announcement {
  id: string;
  text: string;
  type?: string;
  duration?: number;
  background?: string;
  color?: string;
  expiresAt?: string;
}
