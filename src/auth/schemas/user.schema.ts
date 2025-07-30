import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  spotifyId: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true })
  accessToken: string;

  @Prop({ required: true })
  refreshToken: string;

  @Prop()
  email?: string;

  @Prop()
  profileImageUrl?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
