export type ExtractedProduct = {
  brand: string;
  product_type: string;
  weight: string;
  strain_type: string;
  strain_name: string;
  strain_bio: string;
  thc_percent: number | null;
  cbd_percent: number | null;
  thc_mg: number | null;
  cbd_mg: number | null;
  mg_per_piece: number | null;
  confidence: number;
  thc_estimated?: boolean;
  typical_effects?: string[];
  typical_flavors?: string[];
  thc_min?: number | null;
  thc_max?: number | null;
  cbd_min?: number | null;
  cbd_max?: number | null;
  strain_enriched_source?: string;
};

export const emptyProduct: ExtractedProduct = {
  brand: '',
  product_type: '',
  weight: '',
  strain_type: '',
  strain_name: '',
  strain_bio: '',
  thc_percent: null,
  cbd_percent: null,
  thc_mg: null,
  cbd_mg: null,
  mg_per_piece: null,
  confidence: 0,
};
