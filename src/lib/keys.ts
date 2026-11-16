// One source for the keyboard map and the ? sheet.
export type KeyRow = { key: string; label: string; go?: string };
export const keyGroups: [string, KeyRow[]][] = [
  ["Go to", [
    { key: "h", label: "Home", go: "/" },
    { key: "t", label: "Tongue twisters", go: "/#twisters" },
    { key: "s", label: "Sounds", go: "/sounds/" },
    { key: "a", label: "About", go: "/about/" },
  ]],
  ["On a twister page", [
    { key: "p", label: "Play the twister" },
    { key: "l", label: "Play it slowly" },
    { key: "r", label: "Start or stop recording" },
    { key: "n", label: "Next twister" },
    { key: "b", label: "Previous twister" },
  ]],
  ["Anywhere", [
    { key: "v", label: "Switch voice" },
    { key: "m", label: "Switch theme (system, light, dark)" },
    { key: "/", label: "Search" },
    { key: "?", label: "This list" },
  ]],
];
export const keyMap = () => Object.fromEntries(keyGroups.flatMap(([, rows]) => rows.filter((r) => r.go).map((r) => [r.key, r.go!])));
