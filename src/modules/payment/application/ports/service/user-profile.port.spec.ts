import { USER_PROFILE_PORT } from './user-profile.port';

describe('UserProfilePort', () => {
  it('USER_PROFILE_PORT token should be a Symbol', () => {
    expect(typeof USER_PROFILE_PORT).toBe('symbol');
    expect(USER_PROFILE_PORT.toString()).toContain('USER_PROFILE_PORT');
  });
});
