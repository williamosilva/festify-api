import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { GetTopItemsDto } from './dto/get-top-items.dto';
import {
  ArtistsList,
  ProcessedArtistsResponse,
  SpotifyArtist,
  SpotifyTopArtistsResponse,
  SpotifyTopTracksResponse,
} from './interfaces/spotify-top-items.interface';
import { SpotifyTopItemsCache } from './schemas/spotify-response.schema';

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private readonly SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(SpotifyTopItemsCache.name)
    private readonly cacheModel: Model<SpotifyTopItemsCache>,
  ) {}

  async getTopItems(
    dto: GetTopItemsDto,
    userId?: string,
  ): Promise<SpotifyTopArtistsResponse | SpotifyTopTracksResponse> {
    try {
      // Check cache first if userId is provided
      if (userId) {
        const cachedData = await this.getCachedData(userId, dto);
        if (cachedData) {
          this.logger.log(`Returning cached data for user ${userId}`);
          return cachedData.data;
        }
      }

      const url = `${this.SPOTIFY_API_BASE_URL}/me/top/${dto.type}`;
      const params = {
        time_range: dto.time_range,
        limit: dto.limit,
        offset: dto.offset,
      };

      // Garantir que o token tenha o prefixo "Bearer "
      const authToken = this.formatAuthToken(dto.authorization);

      const headers = {
        Authorization: authToken,
        'Content-Type': 'application/json',
      };

      this.logger.log(`Making request to Spotify API: ${url}`);
      this.logger.debug(
        `Authorization header: ${authToken.substring(0, 20)}...`,
      );

      const response = await firstValueFrom(
        this.httpService.get(url, { headers, params }),
      );

      const data = response.data;

      // Cache the response if userId is provided
      if (userId) {
        await this.cacheData(userId, dto, data);
      }

      return data;
    } catch (error) {
      this.logger.error(
        'Error fetching top items from Spotify:',
        error.response?.data || error.message,
      );

      if (error.response?.status === 401) {
        throw new HttpException(
          'Unauthorized - Invalid or expired token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (error.response?.status === 403) {
        throw new HttpException(
          'Forbidden - Insufficient permissions',
          HttpStatus.FORBIDDEN,
        );
      }

      if (error.response?.status === 429) {
        throw new HttpException(
          'Rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new HttpException(
        'Failed to fetch data from Spotify API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Método para garantir que o token tenha o formato correto
  private formatAuthToken(authorization: string): string {
    if (!authorization) {
      throw new HttpException(
        'Authorization token is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (authorization.startsWith('Bearer ')) {
      return authorization;
    }

    if (authorization.toLowerCase().startsWith('bearer ')) {
      return `Bearer ${authorization.substring(7)}`;
    }

    return `Bearer ${authorization}`;
  }

  async getTopArtists(
    dto: Omit<GetTopItemsDto, 'type'> & { type?: never },
    userId?: string,
  ): Promise<SpotifyTopArtistsResponse> {
    return this.getTopItems(
      { ...dto, type: 'artists' as any },
      userId,
    ) as Promise<SpotifyTopArtistsResponse>;
  }

  async getTopTracks(
    dto: Omit<GetTopItemsDto, 'type'> & { type?: never },
    userId?: string,
  ): Promise<SpotifyTopTracksResponse> {
    return this.getTopItems(
      { ...dto, type: 'tracks' as any },
      userId,
    ) as Promise<SpotifyTopTracksResponse>;
  }

  private async getCachedData(
    userId: string,
    dto: GetTopItemsDto,
  ): Promise<SpotifyTopItemsCache | null> {
    try {
      return await this.cacheModel
        .findOne({
          userId,
          type: dto.type,
          time_range: dto.time_range,
          limit: dto.limit,
          offset: dto.offset,
        })
        .exec();
    } catch (error) {
      this.logger.warn('Error fetching cached data:', error.message);
      return null;
    }
  }

  private async cacheData(
    userId: string,
    dto: GetTopItemsDto,
    data: any,
  ): Promise<void> {
    try {
      await this.cacheModel
        .findOneAndUpdate(
          {
            userId,
            type: dto.type,
            time_range: dto.time_range,
            limit: dto.limit,
            offset: dto.offset,
          },
          {
            userId,
            type: dto.type,
            time_range: dto.time_range,
            limit: dto.limit,
            offset: dto.offset,
            data,
          },
          { upsert: true, new: true },
        )
        .exec();

      this.logger.log(`Data cached for user ${userId}`);
    } catch (error) {
      this.logger.warn('Error caching data:', error.message);
    }
  }

  /**
   * Processa a resposta original do Spotify e retorna 3 listas distribuídas
   * @param originalResponse - Resposta original da API do Spotify
   * @returns ProcessedArtistsResponse com 3 listas organizadas
   */
  static processTopArtists(
    originalResponse: SpotifyTopArtistsResponse,
  ): ProcessedArtistsResponse {
    const { items } = originalResponse;

    if (!items || items.length === 0) {
      return {
        lists: [],
        originalTotal: 0,
        processedAt: new Date(),
      };
    }

    // Ordenar artistas por popularidade (maior para menor)
    const sortedArtists = [...items].sort(
      (a, b) => b.popularity - a.popularity,
    );

    // Pegar os 3 artistas com maior popularidade para serem líderes das listas
    const topThreeArtists = sortedArtists.slice(0, 3);
    const remainingArtists = sortedArtists.slice(3);

    // Criar as 3 listas com seus respectivos líderes (primeiro na lista)
    const lists: ArtistsList[] = topThreeArtists.map((leadArtist, index) => ({
      id: index + 1,
      artists: [{ name: leadArtist.name, popularity: leadArtist.popularity }],
      averagePopularity: leadArtist.popularity,
    }));

    // Distribuir os artistas restantes entre as 3 listas de forma balanceada
    this.distributeRemainingArtists(lists, remainingArtists);

    // Calcular popularidade média de cada lista
    lists.forEach((list) => {
      const totalPopularity = list.artists.reduce(
        (sum, artist) => sum + artist.popularity,
        0,
      );
      list.averagePopularity = Math.round(
        totalPopularity / list.artists.length,
      );
    });

    return {
      lists,
      originalTotal: items.length,
      processedAt: new Date(),
    };
  }

  /**
   * Distribui os artistas restantes entre as 3 listas de forma balanceada
   * @param lists - Array das 3 listas
   * @param remainingArtists - Artistas restantes para distribuir
   */
  private static distributeRemainingArtists(
    lists: ArtistsList[],
    remainingArtists: SpotifyArtist[],
  ) {
    let currentListIndex = 0;

    // Distribuir os artistas restantes de forma circular entre as 3 listas
    remainingArtists.forEach((artist) => {
      lists[currentListIndex].artists.push({
        name: artist.name,
        popularity: artist.popularity,
      });
      currentListIndex = (currentListIndex + 1) % 3;
    });
  }
  /**
   * Valida se a resposta tem o formato esperado
   * @param response - Resposta a ser validada
   * @returns boolean indicando se é válida
   */
  static validateResponse(
    response: any,
  ): response is SpotifyTopArtistsResponse {
    return (
      response &&
      Array.isArray(response.items) &&
      response.items.every(
        (item: any) =>
          typeof item.popularity === 'number' &&
          typeof item.name === 'string' &&
          typeof item.id === 'string',
      )
    );
  }

  async clearCache(userId: string): Promise<void> {
    try {
      await this.cacheModel.deleteMany({ userId }).exec();
      this.logger.log(`Cache cleared for user ${userId}`);
    } catch (error) {
      this.logger.warn('Error clearing cache:', error.message);
    }
  }
}
