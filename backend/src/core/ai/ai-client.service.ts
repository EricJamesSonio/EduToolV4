import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly referer: string;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENROUTER_API_KEY') ?? '';
    this.model = this.config.get<string>('AI_MODEL') ?? 'qwen/qwen3-235b-a22b:free';
    // Referer/referrer fields are only used for OpenRouter analytics. If APP_URL
    // is unset we send nothing rather than a hardcoded localhost.
    this.referer = process.env.APP_URL ?? '';
  }

  async callAi(
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 2000,
    temperature = 0.3,
    signal?: AbortSignal,
  ): Promise<string> {
    this.logger.log(`[AI] Calling model: ${this.model} | max_tokens: ${maxTokens} | temp: ${temperature}`);

    const response = await fetch(this.apiUrl, {
      signal,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': this.referer,
        'X-Title': 'EduTool AI',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorText.slice(0, 500)}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`OpenRouter error: ${data.error?.message ?? JSON.stringify(data.error)}`);
    }

    const content: string = data?.choices?.[0]?.message?.content ?? '';
    this.logger.log(`[AI] Response received (${content.length} chars)`);
    return content;
  }
}
