import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class SpotifyImageSchema {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  height: number;

  @Prop({ required: true })
  width: number;
}

@Schema({ _id: false })
export class SpotifyExternalUrlsSchema {
  @Prop({ required: true })
  spotify: string;
}

@Schema({ _id: false })
export class SpotifyFollowersSchema {
  @Prop({ default: null })
  href: string;

  @Prop({ required: true })
  total: number;
}

@Schema({ _id: false })
export class SpotifyArtistSchema {
  @Prop({ type: SpotifyExternalUrlsSchema, required: true })
  external_urls: SpotifyExternalUrlsSchema;

  @Prop({ type: SpotifyFollowersSchema, required: true })
  followers: SpotifyFollowersSchema;

  @Prop({ type: [String], default: [] })
  genres: string[];

  @Prop({ required: true })
  href: string;

  @Prop({ required: true })
  id: string;

  @Prop({ type: [SpotifyImageSchema], default: [] })
  images: SpotifyImageSchema[];

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  popularity: number;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  uri: string;
}

@Schema({ timestamps: true })
export class SpotifyTopItemsCache extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: ['artists', 'tracks'] })
  type: string;

  @Prop({ required: true, enum: ['long_term', 'medium_term', 'short_term'] })
  time_range: string;

  @Prop({ required: true })
  limit: number;

  @Prop({ required: true })
  offset: number;

  @Prop({ type: Object, required: true })
  data: any;

  @Prop({ default: Date.now, expires: 3600 }) // Cache expires in 1 hour
  createdAt: Date;
}

export const SpotifyTopItemsCacheSchema =
  SchemaFactory.createForClass(SpotifyTopItemsCache);
