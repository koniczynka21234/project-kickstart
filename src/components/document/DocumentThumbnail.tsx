import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { FileText, Receipt, FileSignature, Presentation, Package, Loader2 } from "lucide-react";
import { CloudDocumentItem } from "@/hooks/useCloudDocumentHistory";

interface DocumentThumbnailProps {
  doc: CloudDocumentItem;
  typeColors: Record<string, string>;
  onClick: () => void;
}

const TypeIcon = memo(({ type }: { type: string }) => {
  switch (type) {
    case "report":
      return <FileText className="w-6 h-6" />;
    case "invoice":
      return <Receipt className="w-6 h-6" />;
    case "contract":
      return <FileSignature className="w-6 h-6" />;
    case "presentation":
      return <Presentation className="w-6 h-6" />;
    case "welcomepack":
      return <Package className="w-6 h-6" />;
    default:
      return <FileText className="w-6 h-6" />;
  }
});

TypeIcon.displayName = "TypeIcon";

export const DocumentThumbnail = memo(({ doc, typeColors, onClick }: DocumentThumbnailProps) => {
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">(
    doc.thumbnail ? "loading" : "error"
  );

  // When thumbnails are generated asynchronously (save -> upload -> DB update),
  // the component may first render with thumbnail=null and later receive an URL.
  // We must reset state, otherwise it stays stuck in "error".
  const [retryKey, setRetryKey] = useState(0);

  const handleLoad = useCallback(() => {
    setImageState("loaded");
  }, []);

  const handleError = useCallback(() => {
    // Transient 404s happen right after upload/CDN propagation.
    // Try a couple of times with cache-busting query param.
    setImageState((prev) => {
      if (prev === "loaded") return "error";
      return prev;
    });

    setRetryKey((prev) => {
      if (prev >= 2) {
        setImageState("error");
        return prev;
      }
      // Retry shortly after
      setTimeout(() => {
        setImageState("loading");
      }, 700);
      return prev + 1;
    });
  }, []);

  const thumbnailUrl = doc.thumbnail;

  useEffect(() => {
    setRetryKey(0);
    setImageState(thumbnailUrl ? "loading" : "error");
  }, [thumbnailUrl]);

  const resolvedSrc = useMemo(() => {
    if (!thumbnailUrl) return null;
    const sep = thumbnailUrl.includes("?") ? "&" : "?";
    return `${thumbnailUrl}${sep}r=${retryKey}`;
  }, [thumbnailUrl, retryKey]);

  return (
    <div 
      className="aspect-[16/9] bg-background relative overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      )}

      {/* Image */}
      {resolvedSrc && imageState !== "error" && (
        <img 
          src={resolvedSrc} 
          alt={doc.title}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full group-hover:scale-105 transition-transform duration-500 ${
            imageState === "loaded" ? "opacity-100" : "opacity-0"
          } ${
            doc.type === "invoice" || doc.type === "contract" 
              ? "object-cover object-top" 
              : "object-cover"
          }`}
        />
      )}

      {/* Fallback icon when no thumbnail or error */}
      {imageState === "error" && (
        <div className="absolute inset-0 flex items-center justify-center group-hover:bg-muted/50 transition-colors">
          <div className={`w-12 h-12 rounded-xl ${typeColors[doc.type]} border flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <TypeIcon type={doc.type} />
          </div>
        </div>
      )}
    </div>
  );
});

DocumentThumbnail.displayName = "DocumentThumbnail";
