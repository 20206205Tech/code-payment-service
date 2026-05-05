export const USER_PROFILE_PORT = Symbol('USER_PROFILE_PORT');

export interface UserProfile {
  fullName?: string;
  email?: string;
}

export interface UserProfilePort {
  getProfile(userId: string): Promise<UserProfile | null>;
}
