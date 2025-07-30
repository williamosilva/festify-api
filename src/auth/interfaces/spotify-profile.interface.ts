export interface SpotifyProfile {
  id: string;
  displayName: string;
  emails: [{ value: string }];
  photos: [{ value: string }];
  provider: string;
}
