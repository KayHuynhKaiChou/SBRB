import { validate } from 'class-validator';
import { UpdateProfileDto } from '../dto/update-profile.dto';

describe('UpdateProfileDto', () => {
  it('accepts valid phone format +84 901 234 567', async () => {
    const dto = new UpdateProfileDto();
    dto.phone = '+84 901 234 567';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts phone format (123) 456-7890', async () => {
    const dto = new UpdateProfileDto();
    dto.phone = '(123) 456-7890';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects phone format abc!!', async () => {
    const dto = new UpdateProfileDto();
    dto.phone = 'abc!!';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('matches');
  });

  it('rejects phone format with invalid characters', async () => {
    const dto = new UpdateProfileDto();
    dto.phone = '+84#901&234*567';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects phone shorter than 8 characters', async () => {
    const dto = new UpdateProfileDto();
    dto.phone = '+84 901';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects phone longer than 20 characters', async () => {
    const dto = new UpdateProfileDto();
    dto.phone = '+84 (901) 234-5678-9012-345';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects bio longer than 500 characters', async () => {
    const dto = new UpdateProfileDto();
    dto.bio = 'a'.repeat(501);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('maxLength');
  });

  it('accepts bio with exactly 500 characters', async () => {
    const dto = new UpdateProfileDto();
    dto.bio = 'a'.repeat(500);

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('requires valid UUID for departmentId', async () => {
    const dto = new UpdateProfileDto();
    dto.departmentId = 'not-a-uuid';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('accepts valid UUID for departmentId', async () => {
    const dto = new UpdateProfileDto();
    dto.departmentId = '550e8400-e29b-41d4-a716-446655440000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects fullName longer than 100 characters', async () => {
    const dto = new UpdateProfileDto();
    dto.fullName = 'a'.repeat(101);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects fullName with empty string', async () => {
    const dto = new UpdateProfileDto();
    dto.fullName = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts fullName with exactly 100 characters', async () => {
    const dto = new UpdateProfileDto();
    dto.fullName = 'a'.repeat(100);

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts language "vi"', async () => {
    const dto = new UpdateProfileDto();
    dto.language = 'vi';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts language "en"', async () => {
    const dto = new UpdateProfileDto();
    dto.language = 'en';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid language', async () => {
    const dto = new UpdateProfileDto();
    dto.language = 'fr' as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isIn');
  });

  it('rejects avatarUrl longer than 500 characters', async () => {
    const dto = new UpdateProfileDto();
    dto.avatarUrl = 'https://example.com/' + 'a'.repeat(481);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('allows optional fields to be undefined', async () => {
    const dto = new UpdateProfileDto();
    // No fields set

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('allows multiple fields simultaneously', async () => {
    const dto = new UpdateProfileDto();
    dto.fullName = 'John Doe';
    dto.phone = '+84 901 234 567';
    dto.language = 'en';
    dto.bio = 'Software engineer';
    dto.departmentId = '550e8400-e29b-41d4-a716-446655440000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
