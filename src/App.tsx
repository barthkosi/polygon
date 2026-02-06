import { useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { ModelViewer } from "./components/ModelViewer";
import { Sidebar } from "./components/Sidebar";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { Menu, X } from "lucide-react";
import { Button } from "./components/ui/button";

const defaultModels = [
  {
    name: "Logo",
    url: "https://danielcodepen.s3.us-east-1.amazonaws.com/figma.fbx.glb",
    baseScale: 0.8,
    position: [0, -0.2, 0] as [number, number, number],
  },
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
    resolution: 0.22,
    characters: " .:-=+*#%@",
    fgColor: "#ffffff",
    bgColor: "transparent",
    invert: false,
  });

  const resetSettings = () => {
    setAsciiSettings({
      resolution: 0.22,
      characters: " .:-=+*#%@",
      fgColor: "#ffffff",
      bgColor: "transparent",
      invert: false,
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
    <div className="flex w-full h-screen bg-[var(--background-secondary)] overflow-hidden">

      {/* Left Sidebar - Desktop */}
      <div className={`${showLeftSidebar ? 'translate-x-0' : '-translate-x-full'} hidden md:block transition-transform duration-300 ease-in-out`}>
        <Sidebar
          models={models}
          selectedModel={selectedModel}
          onSelectModel={handleModelChange}
          onUpload={handleFileUpload}
        />
      </div>

      {/* Mobile Sidebar (Overlay) */}
      {showLeftSidebar && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowLeftSidebar(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl" onClick={e => e.stopPropagation()}>
            <Sidebar
              models={models}
              selectedModel={selectedModel}
              onSelectModel={(url) => { handleModelChange(url); setShowLeftSidebar(false); }}
              onUpload={handleFileUpload}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0">

        {/* Top Bar for Mobile / Toggle */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Button variant="secondary" size="icon" onClick={() => setShowLeftSidebar(!showLeftSidebar)} className="shadow-sm border border-[var(--border-primary)] bg-[var(--background-primary)]">
            {showLeftSidebar ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>

        <div className="absolute top-4 right-4 z-10 md:hidden flex gap-2">
          <Button variant="secondary" size="icon" onClick={() => setShowRightSidebar(!showRightSidebar)} className="shadow-sm border border-[var(--border-primary)] bg-[var(--background-primary)]">
            {showRightSidebar ? <X size={18} /> : <Settings2Icon size={18} />}
          </Button>
        </div>

        <ModelViewer
          selectedModel={selectedModel}
          modelPosition={currentModel?.position || [0, 0, 0]}
          scale={finalScale}
          asciiSettings={asciiSettings}
        />
      </div>

      {/* Right Sidebar - Desktop */}
      <div className={`${showRightSidebar ? 'translate-x-0' : 'translate-x-full'} hidden md:block transition-transform duration-300 ease-in-out`}>
        <PropertiesPanel
          settings={asciiSettings}
          scale={userScale}
          onSettingsChange={setAsciiSettings}
          onScaleChange={setUserScale}
          onReset={resetSettings}
        />
      </div>

      {/* Mobile Right Sidebar (Overlay) */}
      {showRightSidebar && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowRightSidebar(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-[280px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <PropertiesPanel
              settings={asciiSettings}
              scale={userScale}
              onSettingsChange={setAsciiSettings}
              onScaleChange={setUserScale}
              onReset={resetSettings}
            />
          </div>
        </div>
      )}

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