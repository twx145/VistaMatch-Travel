
export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface Destination {
  id: string;
  name: string;
  englishName?: string; // New field for image searching
  location: string;
  reason: string;
  route: string;
  season: string;
  tips: string;
  itinerary: string; // New field for detailed travel guide
  imageKeyword: string;
  imageUrl?: string;
  isFavorite?: boolean;
  reviews?: Review[];
  rating?: number;
}

export interface RecommendationResult {
  destinations: Destination[];
  rawText: string;
  groundingLinks: { title: string; uri: string }[];
}

export type AppStatus = 'idle' | 'analyzing' | 'success' | 'error';

export interface UserPreferences {
  budget: string;
  travelType: string;
  companions: string;
  tripDuration: string;
  originLocation: string;
}

export type Language = 'en' | 'zh';
