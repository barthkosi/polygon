import { Suspense, useState, useImperativeHandle, forwardRef, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, AsciiRenderer, useGLTF } from "@react-three/drei";
import { ErrorBoundary } from "../components/ErrorBoundary";
import * as THREE from "three";

interface ModelProps {
    scale: number;
    modelUrl: string;
    position: [number, number, number];
    onLoaded: () => void;
}

function Model({ scale, modelUrl, position, onLoaded }: ModelProps) {
    const { scene } = useGLTF(modelUrl);
    // Called synchronously when this component renders (model is ready)
    onLoaded();
    return <primitive object={scene} scale={scale} position={position} />;
}

function LoadingSpinner() {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                pointerEvents: "none",
                zIndex: 10,
            }}
        >
            <div
                style={{
                    width: "36px",
                    height: "36px",
                    border: "3px solid rgba(255,255,255,0.15)",
                    borderTop: "3px solid rgba(255,255,255,0.8)",
                    borderRadius: "50%",
                    animation: "ascii-spin 0.8s linear infinite",
                }}
            />
            <span
                style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "monospace",
                    letterSpacing: "0.05em",
                }}
            >
                loading model...
            </span>
            <style>{`
                @keyframes ascii-spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

interface AsciiSettings {
    enabled: boolean;
    resolution: number;
    characters: string;
    fgColor: string;
    bgColor: string;
    invert: boolean;
}

interface ModelViewerProps {
    selectedModel: string;
    modelPosition: [number, number, number];
    scale: number;
    asciiSettings: AsciiSettings;
}

export const ModelViewer = forwardRef<
    { exportImage: () => void },
    ModelViewerProps
>(({
    selectedModel,
    modelPosition,
    scale,
    asciiSettings,
}, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [glContext, setGlContext] = useState<THREE.WebGLRenderer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        exportImage: () => {
            // Only try ASCII export if enabled
            if (asciiSettings.enabled) {
                const table = containerRef.current?.querySelector("table");
                if (table) {
                    const td = table.querySelector("td");
                    const container = table.parentElement;
                    if (td && container) {
                        const html = td.innerHTML;
                        const lines = html.split(/<br\s*\/?>/i)
                            .map(line => {
                                let textLine = line.replace(/<[^>]*>/g, ''); // Remove tags
                                textLine = textLine.replace(/&nbsp;/g, ' '); // Decode spaces
                                textLine = textLine.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                                return textLine;
                            })
                            .filter(line => line.length > 0);

                        if (lines.length > 0) {
                            const canvas = document.createElement("canvas");
                            const ctx = canvas.getContext("2d");
                            if (ctx) {
                                const containerStyle = window.getComputedStyle(container);
                                const tableStyle = window.getComputedStyle(table);
                                const fontSize = parseFloat(tableStyle.fontSize) || 12;
                                
                                // Use the exact font family from the table
                                const font = `${fontSize}px ${tableStyle.fontFamily || '"Courier New", Courier, monospace'}`;
                                ctx.font = font;

                                // Measure one character to determine grid size
                                const metrics = ctx.measureText("M");
                                const letterSpacing = parseFloat(tableStyle.letterSpacing) || 0;
                                const charWidth = metrics.width + letterSpacing;
                                const charHeight = parseFloat(tableStyle.lineHeight) || (fontSize * 1.2);

                                canvas.width = charWidth * lines[0].length;
                                canvas.height = charHeight * lines.length;

                                // Fill background from container's computed style
                                let bgColor = containerStyle.backgroundColor;
                                if (bgColor === "rgba(0, 0, 0, 0)" || bgColor === "transparent") {
                                    bgColor = "#000000";
                                }
                                ctx.fillStyle = bgColor;
                                ctx.fillRect(0, 0, canvas.width, canvas.height);

                                // Configure text rendering
                                ctx.font = font;
                                ctx.fillStyle = containerStyle.color || "#ffffff";
                                ctx.textBaseline = "top";
                                if (tableStyle.letterSpacing && tableStyle.letterSpacing !== "normal") {
                                    (ctx as any).letterSpacing = tableStyle.letterSpacing;
                                }

                                lines.forEach((line, i) => {
                                    ctx.fillText(line, 0, i * charHeight);
                                });

                                canvas.toBlob((blob) => {
                                    if (blob) {
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement("a");
                                        link.download = "polygon-ascii.png";
                                        link.href = url;
                                        link.click();
                                        URL.revokeObjectURL(url);
                                    }
                                }, "image/png");
                                return;
                            }
                        }
                    }
                }
            }

            // Fallback to standard GL canvas capture (real view)
            if (glContext) {
                glContext.domElement.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.download = "polygon.png";
                        link.href = url;
                        link.click();
                        URL.revokeObjectURL(url);
                    }
                }, "image/png");
            }
        },
    }));

    const handleModelLoaded = () => {
        setIsLoading(false);
    };

    // Reset loading state whenever the selected model changes
    const [prevModel, setPrevModel] = useState(selectedModel);
    if (selectedModel !== prevModel) {
        setPrevModel(selectedModel);
        setIsLoading(true);
    }

    return (
        <div ref={containerRef} className="w-full h-full relative bg-[var(--background-model)] overflow-hidden">
            {isLoading && <LoadingSpinner />}
            <ErrorBoundary>
                <Canvas
                    camera={{ position: [0, 0, 3], fov: 50 }}
                    gl={{ preserveDrawingBuffer: true, alpha: true }}
                    onCreated={({ gl }) => {
                        setGlContext(gl);
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
                                key={`${asciiSettings.resolution}-${asciiSettings.characters}-${asciiSettings.fgColor}-${asciiSettings.bgColor}-${asciiSettings.invert}`}
                                resolution={asciiSettings.resolution}
                                characters={asciiSettings.characters}
                                fgColor={asciiSettings.fgColor}
                                bgColor={asciiSettings.bgColor}
                                invert={asciiSettings.invert}
                            />
                        </Suspense>
                    )}

                    <OrbitControls
                        autoRotate
                        autoRotateSpeed={2}
                        enablePan
                        enableZoom
                        enableRotate
                    />
                </Canvas>
            </ErrorBoundary>
        </div>
    );
});
