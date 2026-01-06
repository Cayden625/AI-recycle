
export interface RecyclingInfo {
  itemName: string;
  category: 'Plastic' | 'Paper' | 'Metal' | 'Glass' | 'Electronic' | 'Organic' | 'Hazardous' | 'Unknown';
  instructions: string;
  consequences: string;
}

export interface GroundingChunk {
  maps?: {
    uri: string;
    title: string;
  };
}

export interface MapStation {
  title: string;
  uri: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ScanRecord {
  id: string;
  userId: string;
  timestamp: number;
  image: string; // base64
  info: RecyclingInfo;
}
