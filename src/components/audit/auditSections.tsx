import {
  FileSearch, Facebook, Instagram, MessageSquare, Film, Palette,
  TrendingUp, Megaphone, Globe, Monitor
} from "lucide-react";

// Category icon map (used in both Generator sidebar and Preview slides)
export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  content: <MessageSquare className="w-4 h-4" />,
  stories_reels: <Film className="w-4 h-4" />,
  branding: <Palette className="w-4 h-4" />,
  competition: <TrendingUp className="w-4 h-4" />,
  paid_ads: <Megaphone className="w-4 h-4" />,
  google_gmb: <Globe className="w-4 h-4" />,
  website: <Monitor className="w-4 h-4" />,
};

export const CATEGORY_LARGE_ICONS: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-7 h-7" />,
  instagram: <Instagram className="w-7 h-7" />,
  content: <MessageSquare className="w-7 h-7" />,
  stories_reels: <Film className="w-7 h-7" />,
  branding: <Palette className="w-7 h-7" />,
  competition: <TrendingUp className="w-7 h-7" />,
  paid_ads: <Megaphone className="w-7 h-7" />,
  google_gmb: <Globe className="w-7 h-7" />,
  website: <Monitor className="w-7 h-7" />,
  intro: <FileSearch className="w-7 h-7" />,
};

export const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  facebook: { text: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" },
  instagram: { text: "text-purple-400", bg: "bg-gradient-to-br from-purple-500/15 to-pink-500/15", border: "border-purple-500/30" },
  content: { text: "text-teal-400", bg: "bg-teal-500/15", border: "border-teal-500/30" },
  stories_reels: { text: "text-pink-400", bg: "bg-pink-500/15", border: "border-pink-500/30" },
  branding: { text: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  competition: { text: "text-teal-400", bg: "bg-teal-500/15", border: "border-teal-500/30" },
  paid_ads: { text: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" },
  google_gmb: { text: "text-green-400", bg: "bg-green-500/15", border: "border-green-500/30" },
  website: { text: "text-indigo-400", bg: "bg-indigo-500/15", border: "border-indigo-500/30" },
};
