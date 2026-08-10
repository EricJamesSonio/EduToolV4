import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GiphyImageSet {
  url?: string | null;
}

interface GiphyResult {
  id?: string;
  images?: {
    fixed_width?: GiphyImageSet;
    original?: GiphyImageSet;
  };
}

@Injectable()
export class GiphyService {
  private readonly logger = new Logger(GiphyService.name);

  constructor(private readonly config: ConfigService) {}

  async search(query: string) {
    const key = this.config.get<string>('GIPHY_API_KEY');
    if (!key) {
      throw new BadRequestException('GIF search is not configured.');
    }
    const q = (query ?? '').trim();
    if (!q) {
      throw new BadRequestException('A search query is required.');
    }

    const url = `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(
      key,
    )}&q=${encodeURIComponent(q)}&limit=25&rating=g`;

    let res: Response;
    try {
      res = await fetch(url);
    } catch (err) {
      this.logger.error('Giphy search request failed', err as Error);
      throw new BadRequestException('GIF search failed.');
    }

    if (!res.ok) {
      this.logger.error(`Giphy returned ${res.status}`);
      throw new BadRequestException('GIF search failed.');
    }

    const json = (await res.json()) as { data?: GiphyResult[] };
    const data = json?.data ?? [];

    // Trim to only what the client needs — never forward Giphy's raw response.
    return data
      .map((g) => ({
        id: g.id ?? '',
        previewUrl: g.images?.fixed_width?.url ?? g.images?.original?.url ?? null,
        url: g.images?.original?.url ?? null,
      }))
      .filter((r) => r.id && r.url);
  }
}