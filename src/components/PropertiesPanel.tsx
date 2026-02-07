import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Settings2, RotateCcw, Info } from "lucide-react";

interface AsciiSettings {
    resolution: number;
    characters: string;
    fgColor: string;
    bgColor: string;
    invert: boolean;
}

interface PropertiesPanelProps {
    settings: AsciiSettings;
    scale: number;
    onSettingsChange: (settings: AsciiSettings) => void;
    onScaleChange: (scale: number) => void;
    onReset: () => void;
}

export function PropertiesPanel({
    settings,
    scale,
    onSettingsChange,
    onScaleChange,
    onReset,
}: PropertiesPanelProps) {

    const presets = [
        { name: "Standard", chars: " .:-=+*#%@" },
        { name: "Minimal", chars: " .-+*#" },
        { name: "Matrix", chars: " 01" },
    ];

    const updateSetting = <K extends keyof AsciiSettings>(key: K, value: AsciiSettings[K]) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <div className="flex flex-col h-full bg-[var(--background-secondary)] border-l border-[var(--border-secondary)] w-[280px] shrink-0">
            <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                <h2 className="text-[var(--content-primary)] font-semibold text-sm tracking-tight flex items-center gap-2">
                    <Settings2 size={16} />
                    Properties
                </h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onReset}
                    className="h-6 w-6 text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                    title="Reset Settings"
                >
                    <RotateCcw size={14} />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Presets */}
                <div className="space-y-3">
                    <Label className="text-[var(--content-secondary)] text-xs uppercase font-semibold">Presets</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {presets.map((preset) => (
                            <Button
                                key={preset.name}
                                variant="outline"
                                size="sm"
                                onClick={() => updateSetting("characters", preset.chars)}
                                className={`text-xs justify-start border-[var(--border-primary)]
                    ${settings.characters === preset.chars
                                        ? "bg-[var(--background-selected)] text-[var(--content-primary)] border-[var(--border-focus)]"
                                        : "bg-[var(--background-primary)] text-[var(--content-secondary)]"
                                    }`}
                            >
                                {preset.name}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="h-[1px] bg-[var(--border-secondary)]" />

                {/* Resolution */}
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <Label className="text-[var(--content-secondary)] text-xs uppercase font-semibold">Resolution</Label>
                        <span className="text-xs text-[var(--content-primary)] font-mono">{settings.resolution.toFixed(2)}</span>
                    </div>
                    <Slider
                        value={[settings.resolution]}
                        onValueChange={([val]: number[]) => updateSetting("resolution", val)}
                        min={0.05}
                        max={0.5}
                        step={0.01}
                        className="[&_.bg-primary]:bg-[var(--brand-500)] [&_.border-primary]:border-[var(--brand-500)]"
                    />
                </div>

                {/* Scale */}
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <Label className="text-[var(--content-secondary)] text-xs uppercase font-semibold">Scale</Label>
                        <span className="text-xs text-[var(--content-primary)] font-mono">{scale.toFixed(1)}x</span>
                    </div>
                    <Slider
                        value={[scale]}
                        onValueChange={([val]: number[]) => onScaleChange(val)}
                        min={0.1}
                        max={3}
                        step={0.1}
                        className="[&_.bg-primary]:bg-[var(--brand-500)] [&_.border-primary]:border-[var(--brand-500)]"
                    />
                </div>

                <div className="h-[1px] bg-[var(--border-secondary)]" />

                {/* Color Toggles */}
                <div className="flex items-center justify-between">
                    <Label htmlFor="invert" className="text-[var(--content-primary)] text-sm cursor-pointer">Invert Colors</Label>
                    <Checkbox
                        id="invert"
                        checked={settings.invert}
                        onCheckedChange={(checked: boolean) => updateSetting("invert", checked)}
                        className="border-[var(--border-active)] data-[state=checked]:bg-[var(--brand-500)] data-[state=checked]:border-[var(--brand-500)]"
                    />
                </div>
            </div>

            {/* Footer / Credits */}
            <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--background-secondary)]">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2 text-[var(--content-secondary)] hover:text-[var(--content-primary)] text-xs">
                            <Info size={14} />
                            About & Credits
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[var(--background-primary)] border-[var(--border-primary)]">
                        <DialogHeader>
                            <DialogTitle className="text-[var(--content-primary)]">Credits</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 text-sm text-[var(--content-secondary)] p-2">
                            <p>Computer model by tzeshi</p>
                            <p>Pothos (House Plant) by stevencmutter</p>
                            <p>Shiba model by zixisun02</p>
                            <p>Crystal model by GenEugene</p>

                            <div className="mt-4 pt-4 border-t border-[var(--border-secondary)] text-xs">
                                <p>Creative Commons License</p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
