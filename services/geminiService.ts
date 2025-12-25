
import { GoogleGenAI } from "@google/genai";
import { ImageFile, AudioAnalysisResult } from "../types";

// Dynamic client initialization to support custom user keys
const getClient = () => {
    const customKey = localStorage.getItem('lex_custom_api_key');
    // Fallback to process.env.API_KEY if no custom key is set
    return new GoogleGenAI({ apiKey: customKey || process.env.API_KEY });
};

const MODEL_ID = "gemini-2.5-flash";

export const extractTextFromImages = async (
  pages: ImageFile[]
): Promise<string> => {
  try {
    const ai = getClient();
    
    // Prepare content parts: Instructions + All Images
    const parts: any[] = [];

    // Add images
    pages.forEach(page => {
       parts.push({
         inlineData: {
           data: page.base64,
           mimeType: page.mimeType
         }
       });
    });

    // Add prompt
    parts.push({
      text: `Extract text from these ${pages.length} images. 
      This is a single document split into pages. 
      
      CRITICAL FORMATTING INSTRUCTION:
      You MUST start the text for EACH page with the exact delimiter: "[[Page N]]" where N is the page number (1, 2, 3...).
      
      Example Output format:
      [[Page 1]]
      Text from the first page...
      
      [[Page 2]]
      Text from the second page...

      Preserve the layout structure (newlines, paragraphs). 
      If there are tables, represent them with spacing or markdown.
      Return ONLY the extracted text with these delimiters.`
    });

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: {
        parts: parts,
      },
    });

    if (response.text) {
      return response.text;
    }

    throw new Error("No text returned from the model.");
  } catch (error: any) {
    console.error("Gemini OCR Error:", error);
    handleGeminiError(error);
    throw error;
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<AudioAnalysisResult> => {
    try {
        const ai = getClient();
        const prompt = `
            Analyze this audio recording.
            Return a JSON object with the following structure:
            {
                "transcription": "Full verbatim transcription of the audio in Russian language.",
                "summary": "A concise summary of the content in Russian language (max 3 sentences).",
                "keyPoints": ["List of 3-5 main takeaways or action items in Russian language"]
            }
            ENSURE ALL TEXT IS IN RUSSIAN.
            Do not include markdown code blocks in the response, just the raw JSON string.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: {
                parts: [
                    { inlineData: { data: base64Audio, mimeType: mimeType } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from audio model");

        // Parse JSON
        try {
            const result = JSON.parse(text);
            return result as AudioAnalysisResult;
        } catch (e) {
             console.error("JSON Parse error", text);
             throw new Error("Failed to parse AI response");
        }

    } catch (error: any) {
        console.error("Gemini Audio Error:", error);
        handleGeminiError(error);
        throw error;
    }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `
            ROLE: Professional Translator.
            TASK: Translate the following text to ${targetLanguage}.
            
            CONSTRAINTS:
            1. Preserve all original formatting (newlines, bullet points, markdown).
            2. Preserve page markers like "[[Page N]]".
            3. Do not add any conversational filler (e.g. "Here is the translation").
            4. Return ONLY the translated text.
            
            TEXT TO TRANSLATE:
            """
            ${text}
            """
        `;

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
        });

        return response.text || text;
    } catch (error: any) {
        console.error("Translation Error:", error);
        handleGeminiError(error);
        throw error;
    }
};

export const convertTextToTable = async (text: string): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `
            ROLE: Data Analyst.
            TASK: Identify tabular data in the provided text and convert it into a CSV format.
            
            INPUT TEXT:
            """
            ${text}
            """
            
            INSTRUCTIONS:
            1. Find the most prominent table or list of structured data.
            2. Extract headers and rows.
            3. Return ONLY valid CSV data.
            4. Use comma (,) as delimiter.
            5. Do not include markdown blocks (like \`\`\`csv). Just raw CSV.
            6. If no table is found, create a CSV with "Error" column and "No table data found" value.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
        });

        return response.text || "";
    } catch (error: any) {
        console.error("Table Conversion Error:", error);
        handleGeminiError(error);
        throw error;
    }
};

const handleGeminiError = (error: any) => {
    const errorMessage = error.message || error.toString();
    
    // Handle Region/Permission errors
    if (errorMessage.includes("Region not supported") || errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
        throw new Error("Ошибка доступа (403): Проверьте ваш API ключ или включите VPN (США/Европа).");
    }
    
    // Handle Quota errors
    if (errorMessage.includes("429") || errorMessage.includes("Quota exceeded")) {
        throw new Error("Лимит запросов исчерпан (429). Попробуйте позже или используйте свой API ключ в настройках.");
    }
    
    // Handle Network/Payload errors
    if (errorMessage.includes("XHR error") || errorMessage.includes("Rpc failed") || errorMessage.includes("Overloaded")) {
         throw new Error("Ошибка сети: Файл слишком большой или соединение прервано. Попробуйте загружать меньше страниц за раз.");
    }
};
