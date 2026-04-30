import { useState, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { Settings2, Menu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ModelViewer } from "./components/ModelViewer";
import { Sidebar } from "./components/Sidebar";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { Button } from "./components/ui/button";
import { Agentation } from "agentation";
import { DEFAULT_ASCII_SETTINGS } from "./lib/types";
import type { AsciiSettings, ModelEntry } from "./lib/types";

const DEFAULT_MODELS: ModelEntry[] = [
  {
    name: "Computer",
    url: "https://danielcodepen.s3.us-east-1.amazonaws.com/apple_macintosh.glb",
    baseScale: 0.05,
    position: [0, -0.3, 0],
  },
  {
    name: "Plant",
    url: "https://danielcodepen.s3.us-east-1.amazonaws.com/pothos_house_plant.glb",
    baseScale: 5,
    position: [0, -0.75, 0],
  },
  {
    name: "Shiba",
    url: "https://danielcodepen.s3.us-east-1.amazonaws.com/shiba.glb",
    baseScale: 1,
    position: [0, 0, 0],
  },
  {
    name: "Crystal",
    url: "https://danielcodepen.s3.us-east-1.amazonaws.com/crystal_stone_rock.glb",
    baseScale: 2,
    position: [0, 0, 0],
  },
];

const MOBILE_BREAKPOINT = 768;
const SIDEBAR_WIDTH = 280;

const OVERLAY_TRANSITION = { duration: 0.3 };
const SLIDE_TRANSITION = { type: "tween" as const, ease: "easeInOut" as const, duration: 0.3 };

export default function App() {
  const [models, setModels] = useState<ModelEntry[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS[0].url);
  const [userScale, setUserScale] = useState(1);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [asciiSettings, setAsciiSettings] = useState<AsciiSettings>(DEFAULT_ASCII_SETTINGS);
  const modelViewerRef = useRef<{ exportImage: () => void }>(null);

  // Collapse sidebars on mobile
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < MOBILE_BREAKPOINT) {
        setShowLeftSidebar(false);
        setShowRightSidebar(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => {
      models.forEach((model) => {
        if (model.url.startsWith("blob:")) {
          URL.revokeObjectURL(model.url);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = () => modelViewerRef.current?.exportImage();

  const handleResetSettings = () => {
    setAsciiSettings(DEFAULT_ASCII_SETTINGS);
    setUserScale(1);
  };

  const handleModelChange = (newModelUrl: string) => {
    if (selectedModel && selectedModel !== newModelUrl) {
      useGLTF.clear(selectedModel);
    }
    setSelectedModel(newModelUrl);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".glb") && !file.name.toLowerCase().endsWith(".gltf")) {
      alert("Please upload a .glb or .gltf file");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const newModel: ModelEntry = {
      name: file.name.length > 20 ? file.name.substring(0, 17) + "..." : file.name,
      url: objectUrl,
      baseScale: 1,
      position: [0, 0, 0],
    };

    setModels((prev) => [...prev, newModel]);
    handleModelChange(objectUrl);
  };

  const currentModel = models.find((m) => m.url === selectedModel);
  const finalScale = (currentModel?.baseScale || 1) * userScale;

  return (
    <div className="relative w-full h-screen bg-[var(--background-primary)] overflow-hidden">
      {/* 3D Viewer — full-screen background */}
      <div className="absolute inset-0 z-0">
        <ModelViewer
          ref={modelViewerRef}
          selectedModel={selectedModel}
          modelPosition={currentModel?.position || [0, 0, 0]}
          scale={finalScale}
          asciiSettings={asciiSettings}
        />
      </div>

      {/* Desktop left sidebar */}
      <div
        className={`absolute left-0 top-0 bottom-0 z-20 w-[${SIDEBAR_WIDTH}px] transform transition-transform duration-300 ease-in-out ${
          showLeftSidebar ? "translate-x-0" : "-translate-x-full"
        } hidden md:block`}
      >
        <Sidebar
          models={models}
          selectedModel={selectedModel}
          onSelectModel={handleModelChange}
          onUpload={handleFileUpload}
          onClose={() => setShowLeftSidebar(false)}
        />
      </div>

      {/* Mobile left sidebar overlay */}
      <AnimatePresence>
        {showLeftSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={OVERLAY_TRANSITION}
            className="md:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setShowLeftSidebar(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={SLIDE_TRANSITION}
              className={`absolute left-0 top-0 bottom-0 w-[${SIDEBAR_WIDTH}px] shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                models={models}
                selectedModel={selectedModel}
                onSelectModel={(url) => {
                  handleModelChange(url);
                  setShowLeftSidebar(false);
                }}
                onUpload={handleFileUpload}
                onClose={() => setShowLeftSidebar(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar toggle buttons */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div
          className={`absolute top-4 left-4 pointer-events-auto transition-all duration-300 ${
            showLeftSidebar
              ? "opacity-0 -translate-x-full pointer-events-none"
              : "opacity-100 translate-x-0"
          }`}
        >
          <div className="flex flex-row gap-2 border border-[var(--border-primary)] bg-[var(--background-primary)] rounded-[12px] p-1 pl-3 shadow-lg">
            <h2 className="h6 text-[var(--content-primary)] flex items-center gap-2 select-none">
              Assets
            </h2>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setShowLeftSidebar(true)}
              className="border border-[var(--border-primary)] bg-[var(--background-primary)]"
            >
              <Menu size={18} />
            </Button>
          </div>
        </div>

        <div
          className={`absolute top-4 right-4 pointer-events-auto transition-all duration-300 ${
            showRightSidebar
              ? "opacity-0 translate-x-full pointer-events-none"
              : "opacity-100 translate-x-0"
          }`}
        >
          <div className="flex flex-row gap-2 border border-[var(--border-primary)] bg-[var(--background-primary)] rounded-[12px] p-1 pl-3 shadow-lg">
            <h2 className="h6 text-[var(--content-primary)] flex items-center gap-2 select-none">
              Properties
            </h2>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setShowRightSidebar(true)}
              className="border border-[var(--border-primary)] bg-[var(--background-primary)]"
            >
              <Settings2 size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop right sidebar */}
      <div
        className={`absolute right-0 top-0 bottom-0 z-20 w-[${SIDEBAR_WIDTH}px] transform transition-transform duration-300 ease-in-out ${
          showRightSidebar ? "translate-x-0" : "translate-x-full"
        } hidden md:block`}
      >
        <PropertiesPanel
          settings={asciiSettings}
          scale={userScale}
          onSettingsChange={setAsciiSettings}
          onScaleChange={setUserScale}
          onReset={handleResetSettings}
          onExport={handleExport}
          onClose={() => setShowRightSidebar(false)}
        />
      </div>

      {/* Mobile right sidebar overlay */}
      <AnimatePresence>
        {showRightSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={OVERLAY_TRANSITION}
            className="md:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setShowRightSidebar(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={SLIDE_TRANSITION}
              className={`absolute right-0 top-0 bottom-0 w-[${SIDEBAR_WIDTH}px] shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <PropertiesPanel
                settings={asciiSettings}
                scale={userScale}
                onSettingsChange={setAsciiSettings}
                onScaleChange={setUserScale}
                onReset={handleResetSettings}
                onExport={handleExport}
                onClose={() => setShowRightSidebar(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}