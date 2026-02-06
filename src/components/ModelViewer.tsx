import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, AsciiRenderer, useGLTF } from "@react-three/drei";
import { ErrorBoundary } from "../components/ErrorBoundary";

interface ModelProps {
    scale: number;
    modelUrl: string;
    position: [number, number, number];
}

function Model({ scale, modelUrl, position }: ModelProps) {
    const { scene } = useGLTF(modelUrl);
    return <primitive object={scene} scale={scale} position={position} />;
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
    return (
        <div className="w-full h-full relative bg-[var(--background-tertiary)] overflow-hidden">
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
