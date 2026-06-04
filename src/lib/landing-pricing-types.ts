export type PublicPricingTier = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  period: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
  chip: string;
  savings: string;
  description: string;
  accent: string;
  /** MongoDB course ids included with this plan */
  courseIds?: string[];
};

export type PublicPricingCompareRow = {
  label: string;
  cells: string[];
};
