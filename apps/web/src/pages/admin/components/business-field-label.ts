/**
 * Maps a business KYB field KEY (as stored in change-request diffs, e.g. `contactPhone`)
 * to its human-readable i18n key in the `business` namespace (e.g. `field_contact_phone`).
 * Consumers render it via t(`business:${BUSINESS_FIELD_LABEL_KEY[key]}`) with a fallback to the raw key.
 */
export const BUSINESS_FIELD_LABEL_KEY: Record<string, string> = {
  name: 'field_name',
  legalName: 'field_legal_name',
  taxCode: 'field_tax_code',
  businessType: 'field_business_type',
  industry: 'field_industry',
  currency: 'field_currency',
  address: 'field_address',
  contactPhone: 'field_contact_phone',
  contactEmail: 'field_contact_email',
  website: 'field_website',
  description: 'field_description',
  foundedYear: 'field_founded_year',
  companySize: 'field_company_size',
  logoUrl: 'field_logo',
  bannerUrl: 'field_banner',
  licenseFileUrl: 'field_license',
};
