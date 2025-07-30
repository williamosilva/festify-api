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
      if (userId) {
        const cachedData = await this.getCachedData(userId, dto);
        if (cachedData) {
          // this.logger.log(`Returning cached data for user ${userId}`);
          return cachedData.data;
        }
      }

      const url = `${this.SPOTIFY_API_BASE_URL}/me/top/${dto.type}`;
      const params = {
        time_range: dto.time_range,
        limit: dto.limit,
        offset: dto.offset,
      };

      const authToken = this.formatAuthToken(dto.authorization);

      const headers = {
        Authorization: authToken,
        'Content-Type': 'application/json',
      };

      // this.logger.log(`Making request to Spotify API: ${url}`);
      // this.logger.debug(
      //   `Authorization header: ${authToken.substring(0, 20)}...`,
      // );

      const response = await firstValueFrom(
        this.httpService.get(url, { headers, params }),
      );

      const data = response.data;

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

    const sortedArtists = [...items].sort(
      (a, b) => b.popularity - a.popularity,
    );

    const topThreeArtists = sortedArtists.slice(0, 3);
    const remainingArtists = sortedArtists.slice(3);

    const lists: ArtistsList[] = topThreeArtists.map((leadArtist, index) => ({
      id: index + 1,
      artists: [{ name: leadArtist.name, popularity: leadArtist.popularity }],
      averagePopularity: leadArtist.popularity,
    }));

    this.distributeRemainingArtists(lists, remainingArtists);

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

  private static distributeRemainingArtists(
    lists: ArtistsList[],
    remainingArtists: SpotifyArtist[],
  ) {
    let currentListIndex = 0;

    remainingArtists.forEach((artist) => {
      lists[currentListIndex].artists.push({
        name: artist.name,
        popularity: artist.popularity,
      });
      currentListIndex = (currentListIndex + 1) % 3;
    });
  }

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
