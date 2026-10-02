export type Category = "fb" | "non-fb";
export type CategoryFilter = "all" | Category;
export type Period = "daily" | "monthly" | "annual";

export type Property = { id: string; name: string };

export type Tenant = {
  id: string;
  property_id: string;
  name: string;
  category: Category;
};

export type TurnoverEntry = {
  id: string;
  tenant_id: string;
  entry_date: string; // YYYY-MM-DD
  amount: number;
};

export type PerformanceStatus =
  | "outperforming"
  | "on-track"
  | "underperforming"
  | "no-baseline"
  | "no-data";

export const CATEGORY_LABEL: Record<Category, string> = {
  fb: "F&B",
  "non-fb": "Non-F&B",
};
