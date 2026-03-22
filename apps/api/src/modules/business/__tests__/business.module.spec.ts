import 'reflect-metadata';
import { BusinessCrudService } from '../business-crud.service';
import { BusinessOwnershipService } from '../business-ownership.service';
import { BusinessService } from '../business.service';
import { MemberService } from '../member.service';
import { InvitationService } from '../invitation.service';
import { MinioModule } from '../../minio/minio.module';
import { AuditModule } from '../../audit/audit.module';
import { MinioService } from '../../minio/minio.service';
import { AuditService } from '../../audit/audit.service';

/**
 * BusinessModule structural tests — verifies key service definitions
 * without booting the NestJS DI container or compiling BusinessController
 * (avoids @types/multer dependency in test environment).
 */
describe('BusinessModule structure', () => {
  it('BusinessCrudService is defined', () => {
    expect(BusinessCrudService).toBeDefined();
    expect(typeof BusinessCrudService).toBe('function');
  });

  it('BusinessOwnershipService is defined', () => {
    expect(BusinessOwnershipService).toBeDefined();
    expect(typeof BusinessOwnershipService).toBe('function');
  });

  it('BusinessService is defined', () => {
    expect(BusinessService).toBeDefined();
    expect(typeof BusinessService).toBe('function');
  });

  it('MemberService is defined', () => {
    expect(MemberService).toBeDefined();
    expect(typeof MemberService).toBe('function');
  });

  it('InvitationService is defined', () => {
    expect(InvitationService).toBeDefined();
    expect(typeof InvitationService).toBe('function');
  });

  it('MinioModule is defined', () => {
    expect(MinioModule).toBeDefined();
  });

  it('AuditModule is defined', () => {
    expect(AuditModule).toBeDefined();
  });

  it('MinioService is exported from MinioModule', () => {
    const exports = Reflect.getMetadata('exports', MinioModule) as unknown[];
    const names = (exports ?? []).map((e) =>
      typeof e === 'function' ? e.name : String(e),
    );
    expect(names).toContain('MinioService');
  });

  it('AuditService is exported from AuditModule', () => {
    const exports = Reflect.getMetadata('exports', AuditModule) as unknown[];
    const names = (exports ?? []).map((e) =>
      typeof e === 'function' ? e.name : String(e),
    );
    expect(names).toContain('AuditService');
  });

  it('MinioService and AuditService are defined', () => {
    expect(MinioService).toBeDefined();
    expect(AuditService).toBeDefined();
  });
});
