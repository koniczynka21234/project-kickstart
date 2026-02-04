import { cn } from "@/lib/utils";

interface MentionProps {
  name: string;
  className?: string;
  variant?: 'chat-own' | 'chat-other' | 'default';
}

export function Mention({ name, className, variant = 'default' }: MentionProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-bold text-sm cursor-pointer transition-all duration-200",
        variant === 'chat-own' && "bg-white/30 text-white hover:bg-white/45 backdrop-blur-sm border border-white/30 shadow-sm underline decoration-white/50 decoration-2 underline-offset-2",
        variant === 'chat-other' && "bg-pink-500/30 text-pink-200 hover:bg-pink-500/40 ring-2 ring-pink-400/60 shadow-lg shadow-pink-500/20 underline decoration-pink-300 decoration-2 underline-offset-2",
        variant === 'default' && "bg-pink-500/25 text-pink-300 hover:bg-pink-500/35 ring-2 ring-pink-400/50 shadow-md shadow-pink-500/15 underline decoration-pink-400 decoration-2 underline-offset-2",
        className
      )}
    >
      <span className="text-pink-300 font-bold">@</span>
      <span className="font-extrabold">{name}</span>
    </span>
  );
}

// Helper to parse and render mentions in text
export function renderMentions(content: string, variant: 'chat-own' | 'chat-other' | 'default' = 'default') {
  const mentionRegex = /@(\w+)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    parts.push(
      <Mention 
        key={match.index} 
        name={match[1]}
        variant={variant}
      />
    );
    
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}
