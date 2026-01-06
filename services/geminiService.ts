
import { GoogleGenAI, Type } from "@google/genai";
import { RecyclingInfo, MapStation } from "../types";

// Initialize AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image of waste to identify it and provide recycling instructions.
 */
export async function analyzeRecyclable(base64Image: string): Promise<RecyclingInfo> {
  const prompt = `Analyze this image of waste. Identify what it is and tell me exactly how to recycle it correctly. 
  Include the potential environmental consequences if this item is just thrown in the trash instead of recycled.
  Return the response in JSON format.`;

  // Use standard contents object structure with parts array as per guidelines
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING },
          category: { 
            type: Type.STRING,
            description: 'One of: Plastic, Paper, Metal, Glass, Electronic, Organic, Hazardous, Unknown'
          },
          instructions: { type: Type.STRING },
          consequences: { type: Type.STRING }
        },
        required: ['itemName', 'category', 'instructions', 'consequences']
      }
    }
  });

  // Extract generated text directly from the response.text property
  const jsonStr = response.text || "{}";
  return JSON.parse(jsonStr);
}

/**
 * Finds recycling stations based on category and location using Maps Grounding.
 */
export async function findRecyclingStations(category: string, lat?: number, lng?: number): Promise<MapStation[]> {
  const prompt = `Find the 3 closest recycling drop-off stations for ${category} waste. Provide direct links to their locations on maps.`;
  
  try {
    // Maps grounding is only supported in Gemini 2.5 series models.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: (lat !== undefined && lng !== undefined) ? { latitude: lat, longitude: lng } : undefined
          }
        }
      },
    });

    // Extract map links from grounding metadata and list them as links
    const stations: MapStation[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.maps) {
          stations.push({
            title: chunk.maps.title,
            uri: chunk.maps.uri
          });
        }
      });
    }

    return stations;
  } catch (error) {
    console.error("Maps grounding error:", error);
    return [];
  }
}
