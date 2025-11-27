
import { GoogleGenAI } from "@google/genai";
import { RecommendationResult, Destination, UserPreferences, Language } from "../types";

// Helper to convert file to base64
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getTravelRecommendations = async (
  imageFile: File, 
  preferences: UserPreferences,
  language: Language
): Promise<RecommendationResult> => {
  // NOTE FOR DEPLOYMENT IN REGIONS WITHOUT GOOGLE ACCESS (e.g. China):
  // You need a reverse proxy or a server-side forwarder.
  // When initializing GoogleGenAI, you would typically point it to your proxy.
  // const ai = new GoogleGenAI({ apiKey: ..., transport: { baseUrl: 'https://your-proxy.com' } });
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const base64Image = await fileToGenerativePart(imageFile);

  const langInstruction = language === 'zh' 
    ? "Provide all textual content (Name, Location, Reason, Route, Season, Tips, Itinerary) in Simplified Chinese (简体中文). However, ALWAYS provide the 'EnglishName' field in English." 
    : "Provide all textual content in English. The 'EnglishName' field should be the standard English name.";

  // Optimized prompt: Requesting 4 high-quality destinations with deep grounding.
  const prompt = `
    Analyze the uploaded image (style, terrain, vibe) and user preferences:
    - Budget: ${preferences.budget}
    - Style: ${preferences.travelType}
    - Companions: ${preferences.companions}
    - User's Origin Location: ${preferences.originLocation || "Not specified"}
    - Trip Duration: ${preferences.tripDuration} days

    Identify 8 perfect real-world destinations that match this visual vibe and fit the duration.
    
    ${langInstruction}

    Use 'googleSearch' and 'googleMaps' EXTENSIVELY to find real-time, accurate details.

    CRITICAL INSTRUCTIONS FOR CONTENT FIELDS:
    
    1. **Route (Transportation)**: 
       - If Origin Location is provided ("${preferences.originLocation}"), you MUST search for real transportation options.
       - Recommend specific methods: "Fly from [Origin] to [Nearest Airport] (approx X hours)".
       - If applicable, mention train options (e.g., "High-speed train from [Origin] takes 3 hrs").
       - If no Origin is provided, list the nearest major airport/hub.
    
    2. **Reason**: 
       - Explain specifically why this destination matches the uploaded PHOTO. Mention matching colors, landscape features (e.g., "The jagged limestone peaks here perfectly match your photo of...").

    3. **Season**: 
       - Do not just say "Spring". Specify the BEST months (e.g., "April-May for cherry blossoms"). 
       - Search for local weather or seasonal events that justify this.

    4. **Tips**: 
       - Provide 3-4 specific, actionable tips. 
       - Include advice on booking tickets (train/plane) or local apps (e.g., "Use 12306 app for trains").
    
    5. **Itinerary**: 
       - Create a DETAILED, realistic day-by-day plan for ${preferences.tripDuration} days. 
       - Mention specific spot names, morning/afternoon activities.
       - Ensure the flow makes sense geographically.

    OUTPUT FORMAT:
    List 8 destinations separated by "---SEPARATOR---".
    Format each exactly like this:

    Name: [Name]
    EnglishName: [Standard English Name]
    Location: [City/Country]
    Reason: [Visual match explanation]
    Route: [Specific Transport from Origin + Local transfer]
    Season: [Best months & Why]
    Tips: [3-4 Specific Tips including ticket advice]
    Itinerary: [Detailed Day-by-Day Plan]
    ImageKeyword: [Visual description for search]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
      }
    });

    const text = response.text || "";
    
    // Extract Grounding Metadata
    const groundingLinks: { title: string; uri: string }[] = [];
    
    // Check for Grounding (Search and Maps)
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          groundingLinks.push({ title: chunk.web.title || "Source", uri: chunk.web.uri });
        }
        if (chunk.maps?.uri) {
          groundingLinks.push({ title: chunk.maps.title || "Google Maps", uri: chunk.maps.uri });
        }
      });
    }

    // Parse the unstructured text into objects
    const destinations: Destination[] = [];
    const sections = text.split("---SEPARATOR---").map(s => s.trim()).filter(s => s.length > 0);

    sections.forEach((section, index) => {
      // Helper to extract multi-line fields (like Itinerary) or single line fields
      const getField = (key: string) => {
        // Regex looks for "Key:" followed by content, until the next "Key:" or end of string
        const regex = new RegExp(`${key}:\\s*([\\s\\S]*?)(?=(?:\\n[A-Z][a-zA-Z]+:|\\s*$))`, 'i');
        const match = section.match(regex);
        return match ? match[1].trim() : "Information not available";
      };

      const name = getField("Name");
      
      if (name && name !== "Information not available" && name.length < 100) { 
        const englishName = getField("EnglishName");

        destinations.push({
          id: `dest-${Date.now()}-${index}`,
          name: name,
          englishName: englishName !== "Information not available" ? englishName : name,
          location: getField("Location"),
          reason: getField("Reason"),
          route: getField("Route"),
          season: getField("Season"),
          tips: getField("Tips"),
          itinerary: getField("Itinerary"),
          imageKeyword: getField("ImageKeyword") || name,
          imageUrl: "", 
          isFavorite: false,
          reviews: [],
          rating: 0
        });
      }
    });

    if (destinations.length === 0) {
      console.warn("Parsing failed, raw text:", text);
    }

    return {
      destinations,
      rawText: text,
      groundingLinks
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
