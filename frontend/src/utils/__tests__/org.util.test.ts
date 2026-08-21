import { getOrgLogoUrl } from '../org.util';

jest.mock('@/config/api.config', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

describe('getOrgLogoUrl', () => {
  it('returns default when logoUrl falsy', () => {
    expect(getOrgLogoUrl(null)).toBe('http://localhost:3000/uploads/organizations/default.png');
    expect(getOrgLogoUrl(undefined)).toBe('http://localhost:3000/uploads/organizations/default.png');
    expect(getOrgLogoUrl('')).toBe('http://localhost:3000/uploads/organizations/default.png');
  });

  it('returns uploads + logoUrl when provided', () => {
    expect(getOrgLogoUrl('organizations/abc.png')).toBe('http://localhost:3000/uploads/organizations/abc.png');
    expect(getOrgLogoUrl('custom/path.jpg')).toBe('http://localhost:3000/uploads/custom/path.jpg');
  });

  it('handles logoUrl with leading slash (preserves as-is)', () => {
    // Real function does simple concat, so leading slash creates double slash — document behavior
    expect(getOrgLogoUrl('/organizations/x.png')).toBe('http://localhost:3000/uploads//organizations/x.png');
  });
});
