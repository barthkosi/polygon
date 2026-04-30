import { useState, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { ModelViewer } from "./components/ModelViewer";
import { Sidebar } from "./components/Sidebar";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { Menu } from "lucide-react";
import { Button } from "./components/ui/button";
import { Agentation } from "agentation";
import { motion, AnimatePresence } from "motion/react";

const defaultModels = [
  {
    name: "Computer",
    url: "https://danielcodepen.s3.us-east-1.amazonaws.com/apple_macintosh.glb",
    baseScale: 0.05,
    position: [0, -0.3, 0] as [number, number, number],
  },
  {
    name: "Plant",
    url: "https://danielcodepen.s3.us-east-1.amazonaws.com/pothos_house_plant.glb",
    baseScale: 5,
    position: [0, -0.75, 0] as [number, number, number],
  },
  {
    name: "Shiba",
    url: "https://danielcodepen.s3.us-east-1.amazonaws.com/shiba.glb",
    baseScale: 1,
    position: [0, 0, 0] as [number, number, number],
  },
  {
    name: "Crystal",
    url: "https://danielcodepen.s3.us-east-1.amazonaws.com/crystal_stone_rock.glb",
    baseScale: 2,
    position: [0, 0, 0] as [number, number, number],
  },
];

export default function App() {
  const [models, setModels] = useState(defaultModels);
  const [selectedModel, setSelectedModel] = useState(models[0].url);
  const [userScale, setUserScale] = useState(1);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const modelViewerRef = useRef<{ exportImage: () => void }>(null);

  const handleExport = () => {
    modelViewerRef.current?.exportImage();
  };

  // Mobile state check
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setShowLeftSidebar(false);
        setShowRightSidebar(false);
      }
    };

    checkMobile(); // Check on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [asciiSettings, setAsciiSettings] = useState({
    enabled: true,
    resolution: 0.22,
    characters: " .:-=+*#%@",
    fgColor: "#ffffff",
    bgColor: "transparent",
    invert: false,
    autoRotate: true,
  });

  const resetSettings = () => {
    setAsciiSettings({
      enabled: true,
      resolution: 0.22,
      characters: " .:-=+*#%@",
      fgColor: "#ffffff",
      bgColor: "transparent",
      invert: false,
      autoRotate: true,
    });
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

    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      alert("Please upload a .glb of .gltf file");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const newModel = {
      name: file.name.length > 20 ? file.name.substring(0, 17) + "..." : file.name,
      url: objectUrl,
      baseScale: 1,
      position: [0, 0, 0] as [number, number, number],
    };

    setModels(prev => [...prev, newModel]);
    handleModelChange(objectUrl);
  };

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      models.forEach(model => {
        if (model.url.startsWith('blob:')) {
          URL.revokeObjectURL(model.url);
        }
      });
    };
  }, [models]);

  const currentModel = models.find(m => m.url === selectedModel);
  const finalScale = (currentModel?.baseScale || 1) * userScale;

  return (
    <div className="relative w-full h-screen bg-[var(--background-primary)] overflow-hidden">

      {/* 3D Viewer - Background / Full Screen */}
      <div className="absolute inset-0 z-0">
        <ModelViewer
          ref={modelViewerRef}
          selectedModel={selectedModel}
          modelPosition={currentModel?.position || [0, 0, 0]}
          scale={finalScale}
          asciiSettings={asciiSettings}
        />
      </div>

      {/* Left Sidebar - Desktop */}
      <div
        className={`absolute left-0 top-0 bottom-0 z-20 w-[280px] transform transition-transform duration-300 ease-in-out ${showLeftSidebar ? 'translate-x-0' : '-translate-x-full'
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

      {/* Mobile Sidebar (Overlay) */}
      <AnimatePresence>
        {showLeftSidebar && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 z-50 bg-black/50" 
            onClick={() => setShowLeftSidebar(false)}
          >
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              className="absolute left-0 top-0 bottom-0 w-[280px] shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
              <Sidebar
                models={models}
                selectedModel={selectedModel}
                onSelectModel={(url) => { handleModelChange(url); setShowLeftSidebar(false); }}
                onUpload={handleFileUpload}
                onClose={() => setShowLeftSidebar(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area - Overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none">

        {/* Toggle Buttons - Visible when sidebars are closed or on mobile */}
        <div 
          className={`absolute top-4 left-4 pointer-events-auto transition-all duration-300 ${
            showLeftSidebar ? 'opacity-0 -translate-x-full pointer-events-none' : 'opacity-100 translate-x-0'
          }`}
        >
          <div className="flex flex-row gap-2 border border-[var(--border-primary)] bg-[var(--background-primary)] rounded-[12px] p-1 pl-3 shadow-lg">
            <h2 className="h6 text-[var(--content-primary)] flex items-center gap-2 select-none">
              Assets
            </h2>
            <Button variant="secondary" size="icon" onClick={() => setShowLeftSidebar(true)} className="border border-[var(--border-primary)] bg-[var(--background-primary)]">
              <Menu size={18} />
            </Button>
          </div>
        </div>

        <div 
          className={`absolute top-4 right-4 pointer-events-auto transition-all duration-300 ${
            showRightSidebar ? 'opacity-0 translate-x-full pointer-events-none' : 'opacity-100 translate-x-0'
          }`}
        >
          <div className="flex flex-row gap-2 border border-[var(--border-primary)] bg-[var(--background-primary)] rounded-[12px] p-1 pl-3 shadow-lg">
            <h2 className="h6 text-[var(--content-primary)] flex items-center gap-2 select-none">
              Properties
            </h2>
            <Button variant="secondary" size="icon" onClick={() => setShowRightSidebar(true)} className="border border-[var(--border-primary)] bg-[var(--background-primary)]">
              <Settings2Icon size={18} />
            </Button>
          </div>
        </div>

      </div>

      {/* Right Sidebar - Desktop */}
      <div
        className={`absolute right-0 top-0 bottom-0 z-20 w-[280px] transform transition-transform duration-300 ease-in-out ${showRightSidebar ? 'translate-x-0' : 'translate-x-full'
          } hidden md:block`}
      >
        <PropertiesPanel
          settings={asciiSettings}
          scale={userScale}
          onSettingsChange={setAsciiSettings}
          onScaleChange={setUserScale}
          onReset={resetSettings}
          onExport={handleExport}
          onClose={() => setShowRightSidebar(false)}
        />
      </div>

      {/* Mobile Right Sidebar (Overlay) */}
      <AnimatePresence>
        {showRightSidebar && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 z-50 bg-black/50" 
            onClick={() => setShowRightSidebar(false)}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              className="absolute right-0 top-0 bottom-0 w-[280px] shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
              <PropertiesPanel
                settings={asciiSettings}
                scale={userScale}
                onSettingsChange={setAsciiSettings}
                onScaleChange={setUserScale}
                onReset={resetSettings}
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

function Settings2Icon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 7h-9" />
      <path d="M14 17H5" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </svg>
  );
}