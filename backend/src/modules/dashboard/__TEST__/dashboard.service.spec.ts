import { DashboardService } from '../dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let repo: any;

  beforeEach(() => {
    repo = {
      getStats: jest.fn(),
      getAcademicContext: jest.fn(),
      getAlerts: jest.fn(),
    };
    service = new DashboardService(repo);
    jest.clearAllMocks();
  });

  it('getStats returns data on success', async () => {
    repo.getStats.mockResolvedValue({ students: 10, educators: 5 });
    expect(await service.getStats()).toEqual({ students: 10, educators: 5 });
    expect(repo.getStats).toHaveBeenCalled();
  });

  it('getStats throws wrapped error on failure', async () => {
    repo.getStats.mockRejectedValue(new Error('db fail'));
    await expect(service.getStats()).rejects.toThrow('Failed to fetch dashboard statistics: db fail');
  });

  it('getAcademicContext returns data', async () => {
    repo.getAcademicContext.mockResolvedValue({ schoolYear: '2024-2025' });
    expect(await service.getAcademicContext()).toEqual({ schoolYear: '2024-2025' });
  });

  it('getAcademicContext wraps error', async () => {
    repo.getAcademicContext.mockRejectedValue(new Error('oops'));
    await expect(service.getAcademicContext()).rejects.toThrow('Failed to fetch academic context: oops');
  });

  it('getAlerts returns array', async () => {
    repo.getAlerts.mockResolvedValue([{ id: 'alert-1', type: 'pending' }]);
    expect(await service.getAlerts()).toEqual([{ id: 'alert-1', type: 'pending' }]);
  });

  it('getAlerts wraps error', async () => {
    repo.getAlerts.mockRejectedValue(new Error('fail'));
    await expect(service.getAlerts()).rejects.toThrow('Failed to fetch alerts: fail');
  });

  it('getStats handles null response', async () => {
    repo.getStats.mockResolvedValue(null);
    expect(await service.getStats()).toBeNull();
  });
});
