import type { NavItem } from "./Sidebar";

const icon = (d: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d={d}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ICONS = {
  grid: icon("M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"),
  building: icon("M4 20h16M6 20V6l6-3 6 3v14M10 10h4M10 14h4M10 18h4"),
  users: icon(
    "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M17 3.13a4 4 0 010 7.75",
  ),
  dollar: icon("M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"),
  route: icon("M6 3v13a3 3 0 003 3h6a3 3 0 003-3M6 6l3-3 3 3M18 16l-3 3-3-3"),
  cog: icon(
    "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  ),
  box: icon("M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12M12 22.08V12M20.73 6.96L12 12"),
  factory: icon("M3 21h18M4 21V10l6 4V10l6 4V6l4 3v12"),
  clipboard: icon(
    "M9 2h6a1 1 0 011 1v2H8V3a1 1 0 011-1zM8 5H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-3",
  ),
  rocket: icon(
    "M5 16l3-3M4.93 19.07A10 10 0 002 22l3-3M13 3l-1 1-5 5-2 4 3 1 4-2 5-5 1-1a3 3 0 00-5-3zM14.12 9.88L11 13",
  ),
  map: icon("M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3zM8 3v15M16 6v15"),
  eye: icon(
    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z",
  ),
};

export const adminNav: NavItem[] = [
  { label: "Operations Center", href: "/admin", icon: ICONS.grid },
  { label: "Companies", href: "/admin/companies", icon: ICONS.building },
  {
    label: "Customer Applications",
    href: "/admin/customer-applications",
    icon: ICONS.eye,
  },
  { label: "Suppliers", href: "/admin/suppliers", icon: ICONS.users },
  { label: "Quote Pipeline", href: "/admin/quotes", icon: ICONS.dollar },
  { label: "Routing Queue", href: "/admin/routing", icon: ICONS.route },
  { label: "RFQ Inbox", href: "/admin/rfqs", icon: ICONS.clipboard },
  { label: "Jobs", href: "/admin/jobs", icon: ICONS.factory },
];

export const supplierNav: NavItem[] = [
  { label: "Partner Dashboard", href: "/supplier", icon: ICONS.grid },
  { label: "Quote Requests", href: "/supplier/quote-requests", icon: ICONS.clipboard },
  { label: "Quotes", href: "/supplier/quotes", icon: ICONS.dollar },
  { label: "Jobs", href: "/supplier/jobs", icon: ICONS.factory },
  { label: "Company Profile", href: "/supplier/profile", icon: ICONS.cog },
  { label: "Equipment", href: "/supplier/equipment", icon: ICONS.box },
];

export const buyerNav: NavItem[] = [
  { label: "Mission Control", href: "/buyer/dashboard", icon: ICONS.grid },
  { label: "Programs", href: "/buyer/programs", icon: ICONS.rocket },
  { label: "RFQs", href: "/buyer/rfqs", icon: ICONS.clipboard },
  { label: "Production", href: "/buyer/jobs", icon: ICONS.factory },
  { label: "Submit Program", href: "/buyer/programs/new", icon: ICONS.map },
];
