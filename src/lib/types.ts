export interface AsciiSettings {
  enabled: boolean;
  resolution: number;
  characters: string;
  fgColor: string;
  bgColor: string;
  invert: boolean;
  autoRotate: boolean;
}

export const DEFAULT_ASCII_SETTINGS: AsciiSettings = {
  enabled: true,
  resolution: 0.22,
  characters: " .:-=+*#%@",
  fgColor: "#ffffff",
  bgColor: "transparent",
  invert: false,
  autoRotate: true,
};

export interface ModelEntry {
  name: string;
  url: string;
  baseScale: number;
  position: [number, number, number];
}
