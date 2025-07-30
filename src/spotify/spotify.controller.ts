import {
  Controller,
  Get,
  Query,
  Headers,
  Param,
  Delete,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  GetTopItemsDto,
  TimeRange,
  TopItemType,
} from './dto/get-top-items.dto';
import {
  ProcessedArtistsResponse,
  SpotifyTopArtistsResponse,
  SpotifyTopTracksResponse,
} from './interfaces/spotify-top-items.interface';
import { SpotifyService } from './spotify.service';

@ApiTags('Spotify')
@Controller('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('top/:type')
  @ApiOperation({ summary: 'Get user top artists or tracks from Spotify' })
  @ApiBearerAuth('spotify-bearer')
  @ApiQuery({
    name: 'time_range',
    enum: TimeRange,
    required: false,
    description: 'Time range for the data',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of items to return (1-50)',
    example: 39,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Index of first item to return',
    example: 0,
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved top items' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getTopItems(
    @Param('type') type: TopItemType,
    @Query('time_range') time_range?: TimeRange,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Headers('authorization') authorization?: string,
    @Req() req?: any,
  ): Promise<SpotifyTopArtistsResponse | SpotifyTopTracksResponse> {
    // Log para debug
    console.log('Authorization header received:', authorization);

    if (!authorization) {
      throw new BadRequestException('Authorization header is required');
    }

    const dto: GetTopItemsDto = {
      type,
      time_range: time_range || TimeRange.MEDIUM_TERM,
      limit: limit || 39,
      offset: offset || 0,
      authorization: authorization,
    };

    // Extract userId from request if available (assuming you have authentication)
    const userId = req?.user?.id;

    return this.spotifyService.getTopItems(dto, userId);
  }

  @Get('top/artists')
  @ApiOperation({ summary: 'Get user top artists from Spotify' })
  @ApiBearerAuth('spotify-bearer') // Usando Bearer Auth
  @ApiQuery({
    name: 'time_range',
    enum: TimeRange,
    required: false,
    description: 'Time range for the data',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of items to return (1-50)',
    example: 39,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Index of first item to return',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved top artists',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getTopArtists(
    @Query('time_range') time_range?: TimeRange,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Headers('authorization') authorization?: string,
    @Req() req?: any,
  ): Promise<SpotifyTopArtistsResponse> {
    console.log(
      'Authorization header received in getTopArtists:',
      authorization,
    );

    if (!authorization) {
      throw new BadRequestException('Authorization header is required');
    }

    const dto = {
      time_range: time_range || TimeRange.MEDIUM_TERM,
      limit: limit || 39,
      offset: offset || 0,
      authorization: authorization,
    };

    const userId = req?.user?.id;
    return this.spotifyService.getTopArtists(dto, userId);
  }

  @Get('top/tracks')
  @ApiOperation({ summary: 'Get user top tracks from Spotify' })
  @ApiBearerAuth('spotify-bearer') // Usando Bearer Auth
  @ApiQuery({
    name: 'time_range',
    enum: TimeRange,
    required: false,
    description: 'Time range for the data',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of items to return (1-50)',
    example: 39,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Index of first item to return',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved top tracks',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getTopTracks(
    @Query('time_range') time_range?: TimeRange,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Headers('authorization') authorization?: string,
    @Req() req?: any,
  ): Promise<SpotifyTopTracksResponse> {
    console.log(
      'Authorization header received in getTopTracks:',
      authorization,
    );

    if (!authorization) {
      throw new BadRequestException('Authorization header is required');
    }

    const dto = {
      time_range: time_range || TimeRange.MEDIUM_TERM,
      limit: limit || 39,
      offset: offset || 0,
      authorization: authorization,
    };

    const userId = req?.user?.id;
    return this.spotifyService.getTopTracks(dto, userId);
  }

  @Delete('cache')
  @ApiOperation({ summary: 'Clear user Spotify cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache(@Req() req: any): Promise<{ message: string }> {
    const userId = req?.user?.id;
    if (!userId) {
      return { message: 'User not authenticated' };
    }

    await this.spotifyService.clearCache(userId);
    return { message: 'Cache cleared successfully' };
  }

  @Get('top/artists/processed')
  @ApiOperation({ summary: 'Get user top artists distributed in 3 lists' })
  @ApiBearerAuth('spotify-bearer')
  @ApiQuery({
    name: 'time_range',
    enum: TimeRange,
    required: false,
    description: 'Time range for the data',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of items to return (1-50)',
    example: 39,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: false,
    description: 'Index of first item to return',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description:
      'Successfully retrieved and processed top artists into 3 lists',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getTopArtistsProcessed(
    @Query('time_range') time_range?: TimeRange,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Headers('authorization') authorization?: string,
    @Req() req?: any,
  ): Promise<ProcessedArtistsResponse> {
    console.log(
      'Authorization header received in getTopArtistsProcessed:',
      authorization,
    );

    if (!authorization) {
      throw new BadRequestException('Authorization header is required');
    }

    const dto = {
      time_range: time_range || TimeRange.MEDIUM_TERM,
      limit: limit || 39,
      offset: offset || 0,
      authorization: authorization,
    };

    const userId = req?.user?.id;

    // Buscar dados originais do Spotify
    const originalResponse = await this.spotifyService.getTopArtists(
      dto,
      userId,
    );

    // Validar resposta
    if (!SpotifyService.validateResponse(originalResponse)) {
      throw new BadRequestException('Invalid response format from Spotify API');
    }

    // Processar e retornar as 3 listas
    return SpotifyService.processTopArtists(originalResponse);
  }
}
