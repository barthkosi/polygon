import { useRef } from "react";
import { Button } from "./ui/button";
import { Upload, Box } from "lucide-react";

interface Model {
    name: string;
    url: string;
}

interface SidebarProps {
    models: Model[];
    selectedModel: string;
    onSelectModel: (url: string) => void;
    onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Sidebar({ models, selectedModel, onSelectModel, onUpload }: SidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col h-full bg-[var(--background-secondary)] border-r border-[var(--border-secondary)] w-60 shrink-0">
            <div className="p-4 border-b border-[var(--border-primary)]">
                <h2 className="text-[var(--content-primary)] font-semibold text-sm tracking-tight flex items-center gap-2">
                    <Box size={16} />
                    Assets
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                <div className="px-2 space-y-0.5">
                    <div className="px-2 py-1.5 text-[var(--content-secondary)] text-xs font-medium uppercase tracking-wider">
                        Library
                    </div>
                    {models.map((model) => (
                        <button
                            key={model.url}
                            onClick={() => onSelectModel(model.url)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2
                ${selectedModel === model.url
                                    ? "bg-[var(--background-selected)] text-[var(--content-primary)] font-medium"
                                    : "text-[var(--content-secondary)] hover:bg-[var(--background-hover)] hover:text-[var(--content-primary)]"
                                }
              `}
                        >
                            {model.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--background-secondary)]">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onUpload}
                    accept=".glb,.gltf"
                    className="hidden"
                />
                <Button
                    variant="outline"
                    className="w-full justify-center gap-2 bg-[var(--background-primary)] hover:bg-[var(--background-hover)] text-[var(--content-primary)] border-[var(--border-primary)] py-5"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload size={16} />
                    Upload .GLB
                </Button>
            </div>
        </div>
    );
}
