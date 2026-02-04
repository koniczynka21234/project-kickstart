import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface GeneratorCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  url: string;
  gradient: string;
  count?: number;
}

export function GeneratorCard({ 
  title, 
  description, 
  icon: Icon, 
  url, 
  gradient,
  count 
}: GeneratorCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(url)}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300",
        "bg-gradient-to-br border border-white/10",
        "hover:scale-[1.02] hover:shadow-2xl group",
        gradient
      )}
    >
      {/* Glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-white/20 via-white/5 to-white/20 blur-sm" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {count !== undefined && count > 0 && (
            <span className="text-xs font-medium text-white/70 bg-white/10 px-2 py-1 rounded-full">
              {count} wygenerowanych
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/70 mb-4">{description}</p>

        <div className="flex items-center gap-2 text-white/80 text-sm font-medium group-hover:text-white transition-colors">
          <span>Otwórz generator</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </button>
  );
}
