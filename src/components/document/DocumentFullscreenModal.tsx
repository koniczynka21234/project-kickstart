import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Move } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";

interface DocumentFullscreenModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function DocumentFullscreenModal({ 
  open, 
  onClose, 
  children, 
  title 
}: DocumentFullscreenModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 2));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.25, 0.5);
      // Reset position when zooming out to 1 or less
      if (newZoom <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return; // Only allow dragging when zoomed in
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [open]);

  // Global mouse up to handle dragging outside the container
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[95vw] w-fit max-h-[95vh] p-0 bg-zinc-900/95 border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-zinc-900">
          <span className="text-sm font-medium text-foreground">
            {title || "Podgląd dokumentu"}
          </span>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <button 
              onClick={handleReset}
              className="text-xs text-muted-foreground w-12 text-center hover:text-foreground transition-colors"
              title="Kliknij aby zresetować"
            >
              {Math.round(zoom * 100)}%
            </button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleZoomIn}
              disabled={zoom >= 2}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-border/50 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Drag hint */}
        {zoom > 1 && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 bg-zinc-800/90 text-xs text-muted-foreground px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
            <Move className="w-3 h-3" />
            Przeciągnij aby przesunąć
          </div>
        )}
        
        {/* Content */}
        <div 
          ref={containerRef}
          className="overflow-auto bg-zinc-800/50 select-none"
          style={{ 
            maxHeight: "calc(95vh - 60px)",
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div 
            className="p-6 transition-transform duration-100 min-w-max"
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              width: "fit-content",
              margin: "0 auto"
            }}
          >
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
