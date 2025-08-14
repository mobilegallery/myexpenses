
import { GoogleGenAI, Type } from "@google/genai";

// This list should be kept in sync with the frontend constants
const CATEGORIES = ['Food', 'Rent', 'Car', 'Medical', 'Personal', 'Store', 'Other'];

interface RequestBody {
    notes?: string;
}

export const handler = async (event: { httpMethod: string; body: string }) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { notes } = JSON.parse(event.body) as RequestBody;

        if (!notes || typeof notes !== 'string' || !notes.trim()) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid 'notes' provided." }) };
        }
        
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("API key is not configured in server environment.");
            return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error. API_KEY not found." }) };
        }

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following expense note, suggest the most appropriate category. Expense Note: "${notes}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: {
                            type: Type.STRING,
                            enum: CATEGORIES,
                            description: "The single most likely expense category."
                        }
                    },
                    propertyOrdering: ["category"],
                },
            },
        });

        const jsonText = response.text.trim();
        // The Gemini response is already JSON, so we can return it directly.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: jsonText,
        };

    } catch (error) {
        console.error("Error in suggest-category function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to get AI suggestion due to an internal error." }),
        };
    }
};
