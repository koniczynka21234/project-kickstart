import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Canvas as FabricCanvas, Rect, Textbox, FabricImage, Gradient, Circle, FabricObject } from 'fabric';

export interface TemplateData {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: TemplateElement[];
}

export interface TemplateElement {
  type: 'rect' | 'text' | 'image' | 'circle' | 'gradient-rect';
  props: Record<string, any>;
}

export interface FabricCanvasRef {
  canvas: FabricCanvas | null;
  exportImage: () => Promise<string | null>;
}

interface FabricCanvasProps {
  template: TemplateData;
  formData: Record<string, string>;
}

interface ImagePlaceholder {
  type: 'image-placeholder';
  name: string;
  props: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

type OrderedItem = FabricObject | ImagePlaceholder;

// Helper to load image as promise
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

const isImagePlaceholder = (item: OrderedItem): item is ImagePlaceholder => {
  return 'type' in item && item.type === 'image-placeholder';
};

const FabricCanvasComponent = forwardRef<FabricCanvasRef, FabricCanvasProps>(
  ({ template, formData }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<FabricCanvas | null>(null);

    useImperativeHandle(ref, () => ({
      canvas: fabricRef.current,
      exportImage: async () => {
        if (!fabricRef.current) return null;
        return fabricRef.current.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 2,
        });
      },
    }));

    // Build canvas when template or formData changes
    useEffect(() => {
      if (!canvasRef.current) return;

      // Dispose previous canvas
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }

      const canvas = new FabricCanvas(canvasRef.current, {
        width: template.width,
        height: template.height,
        backgroundColor: '#0a0a0a',
        selection: false,
      });

      fabricRef.current = canvas;

      // Process all elements in order, handling images asynchronously
      const buildCanvas = async () => {
        for (const el of template.elements) {
          switch (el.type) {
            case 'gradient-rect': {
              const { gradientColors, gradientDirection, ...rectProps } = el.props;
              const rect = new Rect({
                ...rectProps,
                selectable: false,
                evented: false,
              });
              
              const gradient = new Gradient({
                type: 'linear',
                coords: gradientDirection === 'horizontal' 
                  ? { x1: 0, y1: 0, x2: rectProps.width, y2: 0 }
                  : gradientDirection === 'diagonal'
                  ? { x1: 0, y1: 0, x2: rectProps.width, y2: rectProps.height }
                  : { x1: 0, y1: 0, x2: 0, y2: rectProps.height },
                colorStops: gradientColors.map((color: string, i: number) => ({
                  offset: i / (gradientColors.length - 1),
                  color,
                })),
              });
              rect.set('fill', gradient);
              canvas.add(rect);
              break;
            }
            case 'rect': {
              const rect = new Rect({
                ...el.props,
                selectable: false,
                evented: false,
              });
              canvas.add(rect);
              break;
            }
            case 'circle': {
              const circle = new Circle({
                ...el.props,
                selectable: false,
                evented: false,
              });
              canvas.add(circle);
              break;
            }
            case 'text': {
              const textValue = el.props.name && formData[el.props.name] 
                ? formData[el.props.name] 
                : el.props.text || '';
              const textbox = new Textbox(textValue, {
                ...el.props,
                text: textValue,
                selectable: false,
                editable: false,
                evented: false,
              });
              canvas.add(textbox);
              break;
            }
            case 'image': {
              const imageUrl = formData[el.props.name];
              
              if (imageUrl) {
                try {
                  const imgElement = await loadImage(imageUrl);
                  const imgWidth = imgElement.width || 1;
                  const imgHeight = imgElement.height || 1;
                  const placeholderWidth = el.props.width;
                  const placeholderHeight = el.props.height;

                  // Use "cover" scaling
                  const scaleX = placeholderWidth / imgWidth;
                  const scaleY = placeholderHeight / imgHeight;
                  const scale = Math.max(scaleX, scaleY);

                  const scaledWidth = imgWidth * scale;
                  const scaledHeight = imgHeight * scale;
                  const offsetX = (placeholderWidth - scaledWidth) / 2;
                  const offsetY = (placeholderHeight - scaledHeight) / 2;

                  const clipRect = new Rect({
                    left: el.props.left,
                    top: el.props.top,
                    width: placeholderWidth,
                    height: placeholderHeight,
                    absolutePositioned: true,
                  });

                  const fabricImg = new FabricImage(imgElement, {
                    left: el.props.left + offsetX,
                    top: el.props.top + offsetY,
                    scaleX: scale,
                    scaleY: scale,
                    selectable: false,
                    evented: false,
                    clipPath: clipRect,
                  });

                  canvas.add(fabricImg);
                } catch (error) {
                  console.error('Failed to load image:', error);
                  const placeholder = new Rect({
                    left: el.props.left,
                    top: el.props.top,
                    width: el.props.width,
                    height: el.props.height,
                    fill: '#1a1a1a',
                    selectable: false,
                    evented: false,
                  });
                  canvas.add(placeholder);
                }
              } else {
                const placeholder = new Rect({
                  left: el.props.left,
                  top: el.props.top,
                  width: el.props.width,
                  height: el.props.height,
                  fill: '#1a1a1a',
                  selectable: false,
                  evented: false,
                });
                canvas.add(placeholder);
              }
              break;
            }
          }
        }
        
        canvas.renderAll();
      };

      buildCanvas();

      return () => {
        canvas.dispose();
      };
    }, [template, formData]);

    return (
      <div style={{ width: template.width, height: template.height }}>
        <canvas ref={canvasRef} />
      </div>
    );
  }
);

FabricCanvasComponent.displayName = 'FabricCanvas';

export default FabricCanvasComponent;
