type P = { className?: string };
const base = {
  width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
};

export const IconChevronDown = ({ className }: P) => (
  <svg {...base} className={className}><path d="m6 9 6 6 6-6" /></svg>
);
export const IconPlus = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconOverview = ({ className }: P) => (
  <svg {...base} className={className}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></svg>
);
export const IconBuilding = ({ className }: P) => (
  <svg {...base} className={className}><path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 9h5a1 1 0 0 1 1 1v11M2 21h20M8 8h2M8 12h2M8 16h2" /></svg>
);
export const IconDining = ({ className }: P) => (
  <svg {...base} className={className}><path d="M6 3v7a2 2 0 0 0 2 2v9M10 3v7M6 3v7M18 21V3c-2.5 1.5-3 5-3 8h3" /></svg>
);
export const IconRetail = ({ className }: P) => (
  <svg {...base} className={className}><path d="M5 8h14l-1 12H6L5 8ZM9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
export const IconArrowUp = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
);
export const IconArrowDown = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
);
export const IconSort = ({ className }: P) => (
  <svg {...base} className={className}><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" /></svg>
);
export const IconInfo = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
);
export const IconClose = ({ className }: P) => (
  <svg {...base} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconTeam = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="9" cy="8" r="3.2" /><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M16 4.5a3.2 3.2 0 0 1 0 6M18 14.2A5 5 0 0 1 21 19v1" /></svg>
);
