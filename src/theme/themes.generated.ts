export const THEMES = [
  {
    "id": "default",
    "name": "Default"
  },
  {
    "id": "forest",
    "name": "Forest"
  },
  {
    "id": "ocean",
    "name": "Ocean"
  },
  {
    "id": "sunset",
    "name": "Sunset"
  }
] as const satisfies readonly { id: string; name: string }[];
