export interface UserProfileRequest {
  firstName: string;
  lastName: string;
  bio: string;
  resumeUrl: string;
}

export interface UserProfileResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  resumeUrl: string;
}
