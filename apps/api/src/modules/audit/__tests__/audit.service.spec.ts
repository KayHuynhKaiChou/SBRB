import { AuditService } from '../audit.service';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

type MockRepo = {
  create: jest.Mock;
  save: jest.Mock;
};

function makeMockRepo(): MockRepo {
  return {
    create: jest.fn(),
    save: jest.fn(),
  };
}

describe('AuditService', () => {
  let service: AuditService;
  let mockRepo: MockRepo;

  beforeEach(() => {
    mockRepo = makeMockRepo();
    service = new AuditService(mockRepo as unknown as Repository<AuditLog>);
  });

  it('calls repo.create with correct fields', async () => {
    const entry = { id: 'audit-1' } as AuditLog;
    mockRepo.create.mockReturnValue(entry);
    mockRepo.save.mockResolvedValue(entry);

    await service.log({
      businessId: 'biz-1',
      actorId: 'user-1',
      action: 'create_business',
      targetType: 'business',
      targetId: 'biz-1',
      targetName: 'My Shop',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        actorId: 'user-1',
        action: 'create_business',
        targetType: 'business',
        targetId: 'biz-1',
        targetName: 'My Shop',
      }),
    );
  });

  it('calls repo.save with the created entry', async () => {
    const entry = { id: 'audit-2' } as AuditLog;
    mockRepo.create.mockReturnValue(entry);
    mockRepo.save.mockResolvedValue(entry);

    await service.log({
      businessId: 'biz-2',
      actorId: 'user-2',
      action: 'update_business',
      targetType: 'business',
    });

    expect(mockRepo.save).toHaveBeenCalledWith(entry);
  });

  it('defaults metadata to empty object when not provided', async () => {
    mockRepo.create.mockImplementation((obj) => obj);
    mockRepo.save.mockResolvedValue({});

    await service.log({
      businessId: 'biz-3',
      actorId: 'user-3',
      action: 'delete_business',
      targetType: 'business',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: {} }),
    );
  });

  it('passes custom metadata when provided', async () => {
    mockRepo.create.mockImplementation((obj) => obj);
    mockRepo.save.mockResolvedValue({});

    await service.log({
      businessId: 'biz-4',
      actorId: 'user-4',
      action: 'transfer_ownership',
      targetType: 'business_member',
      metadata: { newOwner: 'user-5' },
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { newOwner: 'user-5' } }),
    );
  });

  it('sets targetId and targetName to null when not provided', async () => {
    mockRepo.create.mockImplementation((obj) => obj);
    mockRepo.save.mockResolvedValue({});

    await service.log({
      businessId: 'biz-5',
      actorId: 'user-5',
      action: 'some_action',
      targetType: 'entity',
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ targetId: null, targetName: null }),
    );
  });
});
