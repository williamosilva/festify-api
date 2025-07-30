import { IsString, IsNotEmpty } from 'class-validator';

export class TokenValidationDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
