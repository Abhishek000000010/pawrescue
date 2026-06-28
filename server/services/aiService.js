import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Analyze a cat photo using Google Gemini Vision API.
 * Returns { severity: 'critical' | 'moderate' | 'stable', reason: string }
 *
 * @param {string} imageUrl - The Cloudinary URL of the uploaded cat image
 * @returns {Promise<{ severity: string, reason: string }>}
 */
export async function analyzeCatSeverity(imageUrl) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not set. Returning default severity.');
      return {
        severity: 'moderate',
        reason: 'AI analysis unavailable — API key not configured. Defaulting to moderate severity.',
      };
    }

    const prompt = `You are a veterinary AI assistant for a stray cat rescue platform called PawNet India.

Analyze this photo of a stray cat. Rate its condition as one of:
- "critical" — severely injured, bleeding, unable to move, extremely malnourished, in immediate life-threatening danger
- "moderate" — visibly injured, limping, malnourished, showing signs of illness, needs medical attention soon
- "stable" — appears healthy but is a stray, no visible injuries, generally alert and responsive

Also determine the most appropriate health status category: "Healthy", "Injured", "Mother/Kittens", or "Sick".

Return ONLY a valid JSON object with no markdown formatting, no code blocks, no extra text:
{"severity": "critical|moderate|stable", "healthStatus": "Healthy|Injured|Mother/Kittens|Sick", "reason": "Brief 1-2 sentence explanation of why you assigned this severity level based on what you observe in the image."}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: await fetchImageAsBase64(imageUrl),
              },
            },
          ],
        },
      ],
    });

    const text = response.text.trim();
    
    // Extract JSON from the response (handle potential markdown wrapping)
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const result = JSON.parse(jsonStr);

    const validSeverities = ['critical', 'moderate', 'stable'];
    if (!validSeverities.includes(result.severity)) {
      result.severity = 'moderate';
    }

    const validHealthStatuses = ['Healthy', 'Injured', 'Mother/Kittens', 'Sick'];
    if (!validHealthStatuses.includes(result.healthStatus)) {
      result.healthStatus = result.severity === 'stable' ? 'Healthy' : 'Injured';
    }

    return {
      severity: result.severity,
      healthStatus: result.healthStatus,
      reason: result.reason || 'AI analysis complete.',
    };
  } catch (error) {
    console.error('Gemini AI analysis error:', error.message);
    return {
      severity: 'moderate',
      healthStatus: 'Injured',
      reason: 'AI analysis encountered an error. Defaulting to moderate — please manually assess.',
    };
  }
}

/**
 * Fetch an image URL and convert it to base64 for Gemini inline data
 */
async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}
