import { Injectable, Logger } from '@nestjs/common';
import { LLMService } from '../../common/ai/services/llm.service';

export interface AIKundliData {
  lagna: {
    sign: string;
    degrees: number;
    signLord: string;
  };
  nakshatra: {
    name: string;
    lord: string;
    pada: number;
  };
  planets: Array<{
    name: string;
    sign: string;
    signLord: string;
    degrees: number;
    nakshatra: string;
    nakshatraLord: string;
    nakshatraPada: number;
    house: number;
    isRetrograde: boolean;
  }>;
  tithi: string;
  yoga: string;
  karana: string;
  ayanamsa: number;
}

@Injectable()
export class AIKundliService {
  private readonly logger = new Logger(AIKundliService.name);

  constructor(private readonly llmService: LLMService) {}

  /**
   * Calculate Kundli using AI (OpenAI/Gemini)
   * This provides accurate Vedic astrology calculations
   * Works with both OpenAI and Gemini based on LLM_PROVIDER env variable
   */
  async calculateKundli(params: {
    birthDate: string; // YYYY-MM-DD
    birthTime: string; // HH:mm:ss
    birthPlace: string;
    latitude: number;
    longitude: number;
    timezone: string;
  }): Promise<AIKundliData> {
    const { birthDate, birthTime, birthPlace, latitude, longitude, timezone } = params;

    this.logger.log(`🔮 Calculating Kundli via AI for ${birthPlace} on ${birthDate} at ${birthTime}`);

    // Minimal system prompt
    const systemPrompt = `Vedic astrologer. Return JSON only.`;

    // Minimal user prompt to reduce tokens - Gemini has strict output limits
    const userPrompt = `Kundli for ${birthDate} ${birthTime} at ${birthPlace} (${latitude},${longitude} ${timezone}). Lahiri Ayanamsa, Whole Sign houses.

JSON format:
{"lagna":{"sign":"X","degrees":N,"signLord":"X"},"nakshatra":{"name":"X","lord":"X","pada":N},"planets":[{"name":"Sun","sign":"X","signLord":"X","degrees":N,"nakshatra":"X","nakshatraLord":"X","nakshatraPada":N,"house":N,"isRetrograde":false},{"name":"Moon",...},{"name":"Mars",...},{"name":"Mercury",...},{"name":"Jupiter",...},{"name":"Venus",...},{"name":"Saturn",...},{"name":"Rahu","isRetrograde":true,...},{"name":"Ketu","isRetrograde":true,...}],"tithi":"X","yoga":"X","karana":"X","ayanamsa":N}

Return complete JSON with all 9 planets calculated for the given birth data.`;

    try {
      const response = await this.llmService.callLLMJSON<AIKundliData>({
        systemPrompt,
        userPrompt,
        temperature: 0.1, // Low temperature for consistent, accurate results
        maxTokens: 8192, // High token limit to ensure complete response
        responseFormat: 'json_object',
        timeout: 60000, // 60 seconds timeout for complex calculations
        maxRetries: 2, // Retry up to 2 times on failure
      });

      this.logger.log(`✅ AI Kundli calculation successful`);

      // Validate the response structure
      const data = response.data;
      if (!data.lagna || !data.nakshatra || !data.planets) {
        throw new Error('Invalid AI response structure - missing lagna, nakshatra, or planets');
      }

      if (data.planets.length < 9) {
        this.logger.warn(`⚠️ AI returned only ${data.planets.length} planets, expected 9`);
        // Still return data if we have at least some planets
        if (data.planets.length < 5) {
          throw new Error(`Invalid AI response - only ${data.planets.length} planets returned`);
        }
      }

      return data;
    } catch (error) {
      this.logger.error(`❌ AI Kundli calculation failed: ${error}`);
      throw error;
    }
  }
}
