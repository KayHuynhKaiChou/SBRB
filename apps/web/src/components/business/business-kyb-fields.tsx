import React from 'react';
import { Form, Input, Select, InputNumber, DatePicker } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import {
  INDUSTRY_OPTIONS,
  CURRENCIES,
  BUSINESS_TYPE_OPTIONS,
  EBusinessAssetKind,
} from '@sbrb/shared-constants';
import { BusinessAssetUpload } from './business-asset-upload';

interface IBusinessKybFieldsProps {
  /** Existing business id — enables ownership-scoped uploads (omit during signup). */
  businessId?: string;
  /** Hide the licence/logo/banner upload block (e.g. when not needed). */
  hideAssets?: boolean;
  /** 1 = one field per row (signup wizard, narrow card). 2 = two-column grid (My Business page). */
  columns?: 1 | 2;
  /** Read-only mode — disables every input + upload (view-only for non-owners). */
  readOnly?: boolean;
}

const { TextArea } = Input;

/**
 * Renders all KYB business fields as antd Form.Items.
 * Parent owns the <Form> + submit. Reused by the signup wizard (columns=1) and
 * the My Business page (columns=2, profile-style grid; readOnly for non-owners).
 */
export function BusinessKybFields({
  businessId,
  hideAssets,
  columns = 1,
  readOnly = false,
}: IBusinessKybFieldsProps) {
  const { t } = useTranslation('business');

  // columns=2 → responsive grid; full-width items span both columns.
  const grid = columns === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-x-4' : '';
  const full = columns === 2 ? 'md:col-span-2' : '';

  return (
    <>
      <div className={grid}>
        <Form.Item
          name="name"
          label={t('field_name')}
          rules={[
            { required: true, message: t('field_name_required') },
            { min: 2, message: t('validation_min_chars', { count: 2 }) },
          ]}
        >
          <Input placeholder={t('field_name_ph')} maxLength={100} disabled={readOnly} />
        </Form.Item>

        <Form.Item
          name="legalName"
          label={t('field_legal_name')}
          rules={[
            { required: true, message: t('field_legal_name_required') },
            { min: 2, message: t('validation_min_chars', { count: 2 }) },
          ]}
        >
          <Input placeholder={t('field_legal_name_ph')} maxLength={150} disabled={readOnly} />
        </Form.Item>

        <Form.Item
          name="taxCode"
          label={t('field_tax_code')}
          rules={[
            { required: true, message: t('field_tax_code_required') },
            { min: 8, message: t('validation_min_chars', { count: 8 }) },
          ]}
        >
          <Input placeholder={t('field_tax_code_ph')} maxLength={20} disabled={readOnly} />
        </Form.Item>

        <Form.Item name="businessType" label={t('field_business_type')}>
          <Select
            placeholder={t('field_business_type_ph')}
            options={[...BUSINESS_TYPE_OPTIONS]}
            allowClear
            disabled={readOnly}
          />
        </Form.Item>

        <Form.Item name="industry" label={t('field_industry')}>
          <Select
            placeholder={t('field_industry_ph')}
            options={[...INDUSTRY_OPTIONS]}
            allowClear
            disabled={readOnly}
          />
        </Form.Item>

        <Form.Item name="currency" label={t('field_currency')}>
          <Select
            options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
            disabled={readOnly}
          />
        </Form.Item>

        <Form.Item
          name="address"
          label={t('field_address')}
          rules={[
            { required: true, message: t('field_address_required') },
            { min: 3, message: t('validation_min_chars', { count: 3 }) },
          ]}
        >
          <Input placeholder={t('field_address_ph')} maxLength={255} disabled={readOnly} />
        </Form.Item>

        <Form.Item
          name="contactPhone"
          label={t('field_contact_phone')}
          rules={[{ required: true, message: t('field_contact_phone_required') }]}
        >
          <Input placeholder={t('field_contact_phone_ph')} maxLength={30} disabled={readOnly} />
        </Form.Item>

        <Form.Item
          name="contactEmail"
          label={t('field_contact_email')}
          rules={[{ type: 'email', message: t('field_contact_email_invalid') }]}
        >
          <Input placeholder={t('field_contact_email_ph')} maxLength={255} disabled={readOnly} />
        </Form.Item>

        <Form.Item name="website" label={t('field_website')}>
          <Input placeholder="https://" maxLength={255} disabled={readOnly} />
        </Form.Item>

        {/* Year-only picker; form value stays a plain year number (BE expects Int). */}
        <Form.Item
          name="foundedYear"
          label={t('field_founded_year')}
          getValueProps={(value: number | null) => ({
            value: value ? dayjs().year(value) : null,
          })}
          normalize={(value: Dayjs | null) => (value ? value.year() : null)}
        >
          <DatePicker
            picker="year"
            className="!w-full"
            placeholder="2020"
            disabled={readOnly}
            disabledDate={(d) => d.year() > dayjs().year() || d.year() < 1900}
          />
        </Form.Item>

        {/* Headcount as a whole number (0–1500). precision=0 + min=0 reject decimals
            and negatives; onKeyDown blocks typing a sign / decimal point outright. */}
        <Form.Item name="companySize" label={t('field_company_size')}>
          <InputNumber<number>
            className="!w-full"
            min={0}
            max={1500}
            step={1}
            precision={0}
            onKeyDown={(e) => {
              if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
            }}
            placeholder={t('field_company_size_ph')}
            disabled={readOnly}
          />
        </Form.Item>

        <Form.Item name="description" label={t('field_description')} className={full}>
          <TextArea
            rows={3}
            placeholder={t('field_description_ph')}
            maxLength={2000}
            disabled={readOnly}
          />
        </Form.Item>
      </div>

      {!hideAssets && (
        <div className={grid}>
          <Form.Item name="logoUrl" label={t('field_logo')}>
            <BusinessAssetUpload
              kind={EBusinessAssetKind.LOGO}
              businessId={businessId}
              disabled={readOnly}
            />
          </Form.Item>

          <Form.Item name="bannerUrl" label={t('field_banner')}>
            <BusinessAssetUpload
              kind={EBusinessAssetKind.BANNER}
              businessId={businessId}
              disabled={readOnly}
            />
          </Form.Item>

          <Form.Item
            name="licenseFileUrl"
            label={t('field_license')}
            rules={[{ required: true, message: t('field_license_required') }]}
            extra={readOnly ? undefined : t('field_license_hint')}
            className={full}
          >
            <BusinessAssetUpload
              kind={EBusinessAssetKind.LICENSE}
              businessId={businessId}
              disabled={readOnly}
            />
          </Form.Item>
        </div>
      )}
    </>
  );
}
