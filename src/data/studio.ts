export const ROOM_IMAGE = "/images/studio-room.png";
export const STYLES = [
  {
    id: "modern",
    name: "Warm modern",
    description: "Clean lines, natural textures, warm oak and linen",
    position: "50% 60%",
    tone: "",
  },
  {
    id: "scandinavian",
    name: "Scandinavian",
    description: "Airy Nordic simplicity, pale woods and soft white textiles",
    position: "15% 50%",
    tone: "saturate(.65) brightness(1.12)",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description:
      "Thoughtful open space, sculptural furniture and restrained detailing",
    position: "70% 45%",
    tone: "saturate(.35)",
  },
  {
    id: "mid-century",
    name: "Mid-century",
    description:
      "Mid-century silhouettes, walnut timber and warm earthy accents",
    position: "40% 80%",
    tone: "sepia(.18) saturate(1.15)",
  },
  {
    id: "coastal",
    name: "Coastal",
    description:
      "Relaxed coastal living, woven textures and light natural finishes",
    position: "10% 20%",
    tone: "brightness(1.15) saturate(.5)",
  },
  {
    id: "industrial",
    name: "Industrial",
    description:
      "Industrial character, dark metal, rich leather and textured finishes",
    position: "85% 65%",
    tone: "brightness(.65) saturate(.6)",
  },
];
export const PALETTES = [
  {
    id: "earth",
    name: "Earth & linen",
    colors: ["#e6dece", "#b9ad91", "#6e7559"],
    prompt: "warm ivory, linen, natural oak and muted olive",
  },
  {
    id: "neutral",
    name: "Soft neutrals",
    colors: ["#eeeae3", "#c7c2b9", "#8e8a81"],
    prompt: "soft off-white, warm grey and taupe",
  },
  {
    id: "warm",
    name: "Terracotta",
    colors: ["#eedcca", "#bf8268", "#765446"],
    prompt: "warm cream, terracotta and rich walnut",
  },
  {
    id: "cool",
    name: "Coastal calm",
    colors: ["#e5e7df", "#a7b5b5", "#647e87"],
    prompt: "chalk white, sand and muted blue-green",
  },
];
export interface StudioSettings {
  room: string;
  style: string;
  palette: string;
  density: string;
  preserve: boolean;
  notes: string;
}
export const DEFAULT_SETTINGS: StudioSettings = {
  room: "Living room",
  style: "modern",
  palette: "earth",
  density: "Balanced",
  preserve: true,
  notes: "",
};
export function buildDesignInstructions(settings: StudioSettings): string {
  const style = STYLES.find((item) => item.id === settings.style) || STYLES[0];
  const palette =
    PALETTES.find((item) => item.id === settings.palette) || PALETTES[0];
  return [
    `Stage this ${settings.room.toLowerCase()} in a ${style.name.toLowerCase()} style: ${style.description}.`,
    `Colour palette: ${palette.prompt}. Furnishing density: ${settings.density.toLowerCase()}.`,
    settings.preserve
      ? "Preserve the existing walls, windows, doors, flooring, camera angle and room proportions."
      : "",
    "Create a realistic, cohesive interior with natural lighting and furniture appropriate to the room.",
    settings.notes.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}
