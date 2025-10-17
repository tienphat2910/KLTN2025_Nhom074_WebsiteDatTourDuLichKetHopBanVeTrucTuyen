export interface ActivityLocation {
  name?: string;
  address?: string;
}

export interface ActivityPrice {
  retail: {
    adult?: number;
    child?: number;
    locker?: number;
    baby?: number;
    senior?: number;
  };
  note?: string;
}

export interface ActivityOperatingHours {
  mon_to_sat?: string;
  sunday_holidays?: string;
  ticket_cutoff?: string;
  rides_end?: string;
}

export interface ActivityDetail {
  d1?: string;
  d2?: string;
  d3?: string;
  d4?: string;
  d5?: string;
  d6?: string;
  d7?: string;
}

export interface Activity {
  _id: string;
  name: string;
  description?: string;
  location?: ActivityLocation;
  price?: ActivityPrice;
  operating_hours?: ActivityOperatingHours;
  features?: string[];
  detail?: ActivityDetail;
  gallery?: string[];
  popular?: boolean;
  destinationId: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}
