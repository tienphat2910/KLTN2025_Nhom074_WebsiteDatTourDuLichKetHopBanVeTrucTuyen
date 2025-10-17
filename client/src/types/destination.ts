export type DestinationRegion =
  | "Miền Bắc"
  | "Miền Trung"
  | "Miền Nam"
  | "Tây Nguyên";

export interface Destination {
  id: string;
  name: string;
  country?: string;
  description: string;
  image: string;
  popular: boolean;
  slug: string;
  region: DestinationRegion;
  createdAt: string;
  updatedAt: string;
}

export interface DestinationFormData {
  name: string;
  country?: string;
  description: string;
  image: string;
  popular: boolean;
  region: DestinationRegion;
}
