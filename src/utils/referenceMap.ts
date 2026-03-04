export const REFERENCE_MAP: Record<string, string> = {
  "WL 1": "ipnordic",
  "WL 71": "Enreach",
  "WL 74": "KLC",
};

export const getCustomerReferenceName = (reference: string) => {
  return REFERENCE_MAP[reference] || reference;
};

export const WHITELABEL_OPTIONS = [
  // localized 'All' label (Danish)
  { key: "all", label: "Alle" },
  ...Object.entries(REFERENCE_MAP).map(([key, label]) => ({ key, label })),
];

export const getWhitelabelLabel = (key: string) => {
  if (key === "all") return "Alle";
  return getCustomerReferenceName(key);
};

// color map for whitelabel badges (Tailwind classes)
export const WHITELABEL_COLOR_MAP: Record<string, string> = {
  "WL 1": "bg-green-200",
  "WL 71": "bg-purple-500",
  "WL 74": "bg-purple-300",
};

export const getWhitelabelColor = (key: string) => {
  if (key === "all") return "bg-slate-100";
  return WHITELABEL_COLOR_MAP[key] || "bg-slate-100";
};
