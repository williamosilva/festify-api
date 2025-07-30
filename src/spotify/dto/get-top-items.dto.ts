import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum TopItemType {
  ARTISTS = 'artists',
  TRACKS = 'tracks',
}

export enum TimeRange {
  LONG_TERM = 'long_term',
  MEDIUM_TERM = 'medium_term',
  SHORT_TERM = 'short_term',
}

export class GetTopItemsDto {
  @IsEnum(TopItemType)
  type: TopItemType;

  @IsOptional()
  @IsEnum(TimeRange)
  time_range?: TimeRange = TimeRange.MEDIUM_TERM;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 39;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsString()
  authorization: string;
}
