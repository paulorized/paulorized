export type ExtractedProduct = {
  brand: string;
  product_type: string;
  weight: string;
  strain_type: string;
  strain_name: string;
  strain_bio: string;
  thc_percent: number | null;
  cbd_percent: number | null;
  confidence: number;
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
  confidence: 0,
};
