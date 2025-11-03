
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig } from "@google/generative-ai";
import { getStorage } from 'firebase-admin/storage';

// 1. Environment Variable Check
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// 2. Model Configuration
const generationConfig: GenerationConfig = {
    temperature: 0.4,
    topK: 32,
    topP: 1,
    maxOutputTokens: 8192,
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Function to extract the file path from a gs:// URI or a simple path
function getFilePath(fullPath: string): string {
    if (fullPath.startsWith('gs://')) {
        const parts = fullPath.split('/');
        // Slice(3) removes 'gs:', '', and the bucket name, returning the object path
        return parts.slice(3).join('/');
    }
    // If it's not a gs:// URI, assume it's already a direct path to the file
    return fullPath;
}


// 4. Combined Generation Logic
interface GenerateParams {
    type: 'generate' | 'optimize';
    prompt: string;
    imageUrl?: string;
    sizeReferenceImageUrl?: string; // New parameter for the size reference image
}

interface GenerationResult {
    imageUrl?: string | null;
    text?: string | null;
}

export async function generate(params: GenerateParams): Promise<GenerationResult> {
    const { type, prompt, imageUrl, sizeReferenceImageUrl } = params;

    try {
        if (type === 'optimize') {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const fullPrompt = `You are an expert prompt engineer specializing in creating hyper-realistic product photography prompts for a text-to-image AI. Your task is to take a user\'s simple scene description and expand it into a detailed, professional photographic prompt. Fill in any missing details with creative yet plausible photographic terms. Keep the total length of the expanded prompt to a reasonable size, ideally under 800 words, to ensure it is effective for the image generation model. Crucially, you must append the provided \'Fidelity constraints\' to the end of your response. Ensure the final output is only the expanded prompt text and nothing else.

**Template to use for expansion:**
"A high-resolution, well-lit product photograph of the referenced product on a [background surface/description]. The lighting is a [lighting setup] to [lighting purpose]. The camera angle is a [angle type] to showcase [specific feature]. Ultra-realistic, with sharp focus on [key detail]. [Aspect ratio]."

**Fidelity constraints to append:**
- Use the provided product image(s) as ground truth for features, geometry/scale, materials/finish, color, labels/packaging, and transparency/contents.
- If any user input conflicts with the reference, keep the product unchanged and adjust only scene/background/camera/light.

---
**User\'s simple description:**
"${prompt}"
---

**Expanded Prompt:**
`;
            const result = await model.generateContent(fullPrompt);
            const optimizedText = result.response.text().trim();
            if (!optimizedText) {
                throw new Error("The model did not return an optimized prompt.");
            }
            return { text: optimizedText };

        } else if (type === 'generate') {
            if (!imageUrl) {
                throw new Error("Image URL is required for 'generate' type.");
            }
            
            const bucket = getStorage().bucket();
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image", safetySettings, generationConfig });
            
            // Prepare an array for all parts of the prompt (text and images)
            const promptParts: (string | { inlineData: { data: string; mimeType: string; } })[] = [];

            // 1. Download and add the main product image
            const productFilePath = getFilePath(imageUrl);
            const productFile = bucket.file(productFilePath);
            const [productFileBuffer] = await productFile.download();
            const [productMetadata] = await productFile.getMetadata();
            const productMimeType = productMetadata.contentType || 'image/png';
            const productBase64Data = productFileBuffer.toString('base64');
            promptParts.push({ inlineData: { data: productBase64Data, mimeType: productMimeType } });

            let finalPrompt = prompt;
            let sizeReferenceLoaded = false;

            // 2. If a size reference image is provided, try to download and add it
            if (sizeReferenceImageUrl) {
                try {
                    const sizeRefFilePath = getFilePath(sizeReferenceImageUrl);
                    const sizeRefFile = bucket.file(sizeRefFilePath);
                    const [sizeRefFileBuffer] = await sizeRefFile.download();
                    const [sizeRefMetadata] = await sizeRefFile.getMetadata();
                    const sizeRefMimeType = sizeRefMetadata.contentType || 'image/png';
                    const sizeRefBase64Data = sizeRefFileBuffer.toString('base64');
                    promptParts.push({ inlineData: { data: sizeRefBase64Data, mimeType: sizeRefMimeType } });
                    sizeReferenceLoaded = true;

                    // 3. Append the instructional text to the prompt
                    finalPrompt += "\n\nUse the product image as a strict reference for the product\'s size, shape, and how it looks in a person\'s hand. Be natural and don\'t copy the exact image but just use it to understand the scale and size.";
                } catch (error) {
                    // If size reference image fails to load, log it but continue without it
                    console.warn(`Warning: Could not load size reference image at ${sizeReferenceImageUrl}:`, error);
                    // Continue with just the product image - this is not an error condition
                    sizeReferenceLoaded = false;
                }
            }

            // 4. Prepend the final prompt string to the parts array
            promptParts.unshift(finalPrompt);

            // 5. Generate content with the combined prompt
            const result = await model.generateContent(promptParts);
            const response = result.response;
            const candidate = response.candidates?.[0];

            const generationResult: GenerationResult = { imageUrl: null, text: null };

            if (candidate) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData) {
                        generationResult.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    } else if (part.text) {
                        generationResult.text = (generationResult.text || '') + part.text + ' ';
                    }
                }
            }
            
            if (generationResult.text) generationResult.text = generationResult.text.trim();

            if (!generationResult.imageUrl && !generationResult.text) {
                 return { text: "The model did not return any content. Please try a different prompt." };
            }
            return generationResult;

        } else {
            throw new Error(`Invalid generation type: ${type}`);
        }

    } catch (error) {
        console.error(`Error in generate function (type: ${type}):`, error);
        throw new Error(`Failed to communicate with the Gemini API during ${type}. Please check the server logs.`);
    }
}
