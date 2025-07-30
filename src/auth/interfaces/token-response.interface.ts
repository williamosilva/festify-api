export interface TokenResponse {
  isValid: boolean;
  newAccessToken?: string;
  user?: {
    id: string;
    spotifyId: string;
    displayName: string;
    email?: string;
    profileImageUrl?: string;
  };
  error?: string;
}
