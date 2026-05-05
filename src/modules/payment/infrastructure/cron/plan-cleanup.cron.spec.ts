/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanCleanupCron } from './plan-cleanup.cron';
import { PlanEntity } from '../database/entities/plan.entity';

describe('PlanCleanupCron', () => {
  let cron: PlanCleanupCron;
  let planRepo: jest.Mocked<Repository<PlanEntity>>;

  beforeEach(async () => {
    planRepo = {
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlanEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanCleanupCron,
        { provide: getRepositoryToken(PlanEntity), useValue: planRepo },
      ],
    }).compile();

    cron = module.get<PlanCleanupCron>(PlanCleanupCron);
  });

  it('should be defined', () => {
    expect(cron).toBeDefined();
  });

  it('should delete archived plans older than 30 days', async () => {
    planRepo.delete.mockResolvedValue({
      affected: 5,
      raw: [],
    } as import('typeorm').DeleteResult);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const loggerSpy = jest.spyOn((cron as any).logger, 'log');

    await cron.handleCleanup();

    expect(planRepo.delete).toHaveBeenCalledWith({
      isActive: false,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      updatedAt: expect.anything(), // LessThan cutoffDate
    });
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Đã xóa 5 plan(s)'),
    );
  });

  it('should handle error during cleanup', async () => {
    planRepo.delete.mockRejectedValue(new Error('DB Error'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const loggerSpy = jest.spyOn((cron as any).logger, 'error');

    await cron.handleCleanup();

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('Lỗi trong quá trình dọn dẹp Plan:'),
      expect.any(Error),
    );
  });
});
