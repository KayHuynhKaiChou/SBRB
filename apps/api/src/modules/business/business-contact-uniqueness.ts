import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Business } from './entities/business.entity';

/**
 * Enforce that contactPhone / contactEmail are not already used by ANOTHER business
 * (global uniqueness — no same-owner exception). Null/empty values are skipped; email
 * is matched case-insensitively. Mirrors the DB partial unique indexes added in
 * migration 1777500010000 — that index is the race-safe source of truth; this gives
 * a friendly error before hitting it. Pass `excludeBusinessId` on edit so a business
 * keeps its own contact details.
 */
export async function assertBusinessContactUnique(
  businessRepo: Repository<Business>,
  fields: { contactPhone?: string | null; contactEmail?: string | null },
  excludeBusinessId?: string,
): Promise<void> {
  const phone = fields.contactPhone?.trim();
  if (phone) {
    const qb = businessRepo
      .createQueryBuilder('b')
      .where('b.contact_phone = :phone', { phone });
    if (excludeBusinessId) qb.andWhere('b.id != :id', { id: excludeBusinessId });
    if ((await qb.getCount()) > 0) {
      throw new BadRequestException('This contact phone is already used by another business');
    }
  }

  const email = fields.contactEmail?.trim().toLowerCase();
  if (email) {
    const qb = businessRepo
      .createQueryBuilder('b')
      .where('LOWER(b.contact_email) = :email', { email });
    if (excludeBusinessId) qb.andWhere('b.id != :id', { id: excludeBusinessId });
    if ((await qb.getCount()) > 0) {
      throw new BadRequestException('This contact email is already used by another business');
    }
  }
}
