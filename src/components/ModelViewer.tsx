import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, AsciiRenderer, useGLTF } from "@react-three/drei";
import { ErrorBoundary } from "../components/ErrorBoundary";

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

export function ModelViewer({
    selectedModel,
    modelPosition,
    scale,
    asciiSettings,
}: ModelViewerProps) {
    const [isLoading, setIsLoading] = useState(true);

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
        <div className="w-full h-full relative bg-[var(--background-tertiary)] overflow-hidden">
            {isLoading && <LoadingSpinner />}
            <ErrorBoundary>
                <Canvas
                    camera={{ position: [0, 0, 3], fov: 50 }}
                    gl={{ preserveDrawingBuffer: true, alpha: true }}
                    onCreated={({ gl }) => {
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
}
