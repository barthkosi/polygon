import { Suspense, useState, useImperativeHandle, forwardRef, useRef, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, AsciiRenderer, useGLTF } from "@react-three/drei";
import { ErrorBoundary } from "./ErrorBoundary";
import type { AsciiSettings } from "../lib/types";

interface ModelProps {
  scale: number;
  modelUrl: string;
  position: [number, number, number];
  onLoaded: () => void;
}

function Model({ scale, modelUrl, position, onLoaded }: ModelProps) {
  const { scene } = useGLTF(modelUrl);

  // Fire after commit so the loading spinner is visible until the model
  // is actually painted. Calling onLoaded during render let React 18
  // batch it with setIsLoading(true) from the parent, causing the
  // spinner to never appear for cached models.
  useEffect(() => {
    onLoaded();
  }, [onLoaded]);

  return <primitive object={scene} scale={scale} position={position} />;
}

function LoadingSpinner() {
  return (
    <div className="model-loading-spinner">
      <div className="model-loading-spinner-ring" />
      <span className="model-loading-spinner-text">loading model...</span>
    </div>
  );
}

interface ModelViewerProps {
  selectedModel: string;
  modelPosition: [number, number, number];
  scale: number;
  asciiSettings: AsciiSettings;
}

export const ModelViewer = forwardRef<{ exportImage: () => void }, ModelViewerProps>(
  ({ selectedModel, modelPosition, scale, asciiSettings }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      exportImage: () => {
        if (asciiSettings.enabled) {
          const exported = exportAsciiAsImage(containerRef.current);
          if (exported) return;
        }

        // Fallback: capture raw WebGL canvas
        if (canvasRef.current) {
          downloadCanvasAsBlob(canvasRef.current, "polygon.png");
        }
      },
    }));

    const handleModelLoaded = useCallback(() => {
      setIsLoading(false);
    }, []);

    // Reset loading state when model changes
    const [prevModel, setPrevModel] = useState(selectedModel);
    if (selectedModel !== prevModel) {
      setPrevModel(selectedModel);
      setIsLoading(true);
    }

    const asciiKey = `${asciiSettings.resolution}-${asciiSettings.characters}-${asciiSettings.fgColor}-${asciiSettings.bgColor}-${asciiSettings.invert}`;

    return (
      <div ref={containerRef} className="w-full h-full relative bg-[var(--background-model)] overflow-hidden">
        {isLoading && <LoadingSpinner />}
        <ErrorBoundary>
          <Canvas
            camera={{ position: [0, 0, 3], fov: 50 }}
            gl={{ preserveDrawingBuffer: true, alpha: true }}
            onCreated={({ gl }) => {
              canvasRef.current = gl.domElement;
              gl.setSize(gl.domElement.clientWidth, gl.domElement.clientHeight);
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} />

            <Suspense fallback={null}>
              <Model
                key={selectedModel}
                scale={scale}
                modelUrl={selectedModel}
                position={modelPosition}
                onLoaded={handleModelLoaded}
              />
            </Suspense>

            {asciiSettings.enabled && (
              <Suspense fallback={null}>
                <AsciiRenderer
                  key={asciiKey}
                  resolution={asciiSettings.resolution}
                  characters={asciiSettings.characters}
                  fgColor={asciiSettings.fgColor}
                  bgColor={asciiSettings.bgColor}
                  invert={asciiSettings.invert}
                />
              </Suspense>
            )}

            <OrbitControls
              autoRotate={asciiSettings.autoRotate}
              autoRotateSpeed={2}
              enablePan
              enableZoom
              enableRotate
            />
          </Canvas>
        </ErrorBoundary>
      </div>
    );
  }
);

// --- Helpers ---

/** Parse ASCII table DOM into text lines */
function parseAsciiTable(container: HTMLElement | null): { lines: string[]; table: HTMLTableElement; tableContainer: HTMLElement } | null {
  if (!container) return null;
  const table = container.querySelector("table") as HTMLTableElement | null;
  if (!table) return null;

  const td = table.querySelector("td");
  const tableContainer = table.parentElement;
  if (!td || !tableContainer) return null;

  const html = td.innerHTML;
  const lines = html
    .split(/<br\s*\/?>/i)
    .map((line) => {
      let text = line.replace(/<[^>]*>/g, "");
      text = text.replace(/&nbsp;/g, " ");
      text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      return text;
    })
    .filter((line) => line.length > 0);

  if (lines.length === 0) return null;
  return { lines, table, tableContainer };
}

/** Render ASCII lines to a canvas and trigger download */
function exportAsciiAsImage(container: HTMLElement | null): boolean {
  const parsed = parseAsciiTable(container);
  if (!parsed) return false;

  const { lines, table, tableContainer } = parsed;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const containerStyle = window.getComputedStyle(tableContainer);
  const tableStyle = window.getComputedStyle(table);
  const fontSize = parseFloat(tableStyle.fontSize) || 12;
  const font = `${fontSize}px ${tableStyle.fontFamily || '"Courier New", Courier, monospace'}`;

  ctx.font = font;
  const metrics = ctx.measureText("M");
  const letterSpacing = parseFloat(tableStyle.letterSpacing) || 0;
  const charWidth = metrics.width + letterSpacing;
  const charHeight = parseFloat(tableStyle.lineHeight) || fontSize * 1.2;

  canvas.width = charWidth * lines[0].length;
  canvas.height = charHeight * lines.length;

  // Background
  let bgColor = containerStyle.backgroundColor;
  if (bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
    bgColor = "#000000";
  }
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Text
  ctx.font = font;
  ctx.fillStyle = containerStyle.color || "#ffffff";
  ctx.textBaseline = "top";
  if (tableStyle.letterSpacing && tableStyle.letterSpacing !== "normal") {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = tableStyle.letterSpacing;
  }

  lines.forEach((line, i) => {
    ctx.fillText(line, 0, i * charHeight);
  });

  downloadCanvasAsBlob(canvas, "polygon-ascii.png");
  return true;
}

/** Download a canvas element as a PNG blob */
function downloadCanvasAsBlob(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
