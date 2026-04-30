import { useRef } from "react";
import { Button } from "./ui/button";
import { Upload, Box, X } from "lucide-react";

interface Model {
    name: string;
    url: string;
}

interface SidebarProps {
    models: Model[];
    selectedModel: string;
    onSelectModel: (url: string) => void;
    onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onClose?: () => void;
}

import { motion } from "motion/react";
import { pressScale } from "../lib/transitions";

export function Sidebar({ models, selectedModel, onSelectModel, onUpload, onClose }: SidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
     <div className="h-full w-[280px] p-3">
        <div className="w-full h-full flex flex-col bg-[var(--background-tertiary)] rounded-[24px] border-[1px] border-[var(--border-primary)] shadow-xl">
            <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                <h2 className="h6 text-[var(--content-primary)] flex items-center gap-2">
                   <Box size={24} />
                    Assets
                </h2>
                {onClose && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 text-[var(--content-secondary)] hover:text-[var(--content-primary)] rounded-full hover:bg-[var(--background-secondary)] transition-colors"
                    >
                        <X size={18} />
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                <div className="flex flex-col p-2 gap-2">
                    <div className="px-3 text-[var(--content-secondary)] label-xs">
                        Library
                    </div>
                    <div className="flex flex-col gap-0.5">
                    {models.map((model) => (
                        <motion.button
                            {...pressScale}
                            key={model.url}
                            onClick={() => onSelectModel(model.url)}
                            className={`w-full text-left px-3 py-2 label-s rounded-[12px] transition-colors flex items-center
                ${selectedModel === model.url
                                    ? "bg-[var(--background-secondary)] text-[var(--content-primary)]"
                                    : "text-[var(--content-secondary)] hover:bg-[var(--background-hover)] hover:text-[var(--content-primary)]"
                                }
              `}
                        >
                            {model.name}
                        </motion.button>
                    ))}
                    </div>

                </div>
            </div>

            <div className="flex p-4 border-t border-[var(--border-primary)]">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onUpload}
                    accept=".glb,.gltf"
                    className="hidden"
                />
                <Button
                    variant="outline"
                    className="w-full justify-center gap-2 rounded-[99px] bg-[var(--background-primary)] hover:bg-[var(--background-hover)] text-[var(--content-primary)] border-[var(--border-primary)] py-5"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload size={16} />
                    Upload .GLB
                </Button>
            </div>
        </div>
      </div>
    );
}
