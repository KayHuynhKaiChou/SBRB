import { RefreshTokenService } from '../refresh-token.service';

function buildService() {
  const tokenRepo = {
    delete: jest.fn().mockResolvedValue({ affected: 3 }),
  };
  const service = new RefreshTokenService(tokenRepo as never);
  return { service, tokenRepo };
}

describe('RefreshTokenService', () => {
  describe('revokeAllForUser', () => {
    it('hard-deletes all tokens for the given userId', async () => {
      const { service, tokenRepo } = buildService();
      await service.revokeAllForUser('user-abc');
      expect(tokenRepo.delete).toHaveBeenCalledWith({ userId: 'user-abc' });
    });

    it('resolves without error when user has no tokens', async () => {
      const { service, tokenRepo } = buildService();
      tokenRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.revokeAllForUser('user-no-tokens')).resolves.toBeUndefined();
    });
  });
});
