import { gql } from '@apollo/client';

/**
 * Fetch a single business by ID — used by BusinessGuard to check status + approval.
 * fetchPolicy 'cache-and-network' in consumers ensures stale cache doesn't hide changes.
 */
export const BUSINESS_QUERY = gql`
  query Business($id: ID!) {
    business(id: $id) {
      id
      name
      status
      rejectionReason
      inactivatedAt
      inactiveReason
    }
  }
`;

/** Full KYB detail for the owner's My Business page. */
export const MY_BUSINESS_DETAIL_QUERY = gql`
  query MyBusinessDetail($id: ID!) {
    business(id: $id) {
      id
      name
      industry
      currency
      status
      rejectionReason
      legalName
      taxCode
      businessType
      address
      contactPhone
      contactEmail
      website
      description
      logoUrl
      bannerUrl
      licenseFileUrl
      foundedYear
      companySize
      createdAt
    }
    myMembership(businessId: $id) {
      id
      role
    }
  }
`;

/** Create business (owner signup wizard step 2) — now carries full KYB profile. */
export const CREATE_BUSINESS_MUTATION = gql`
  mutation CreateBusiness($input: CreateBusinessDto!) {
    createBusiness(input: $input) {
      id
      name
      status
    }
  }
`;

/**
 * Live update. For approved businesses the backend only accepts operational fields
 * (logo/canvas); KYB changes must go through requestBusinessChange instead.
 */
export const UPDATE_BUSINESS_MUTATION = gql`
  mutation UpdateBusiness($id: ID!, $input: UpdateBusinessDto!) {
    updateBusiness(id: $id, input: $input) {
      id
      name
      industry
      currency
      logoUrl
      status
    }
  }
`;

/** Resubmit a rejected/pending business for admin review. */
export const SUBMIT_BUSINESS_FOR_REVIEW_MUTATION = gql`
  mutation SubmitBusinessForReview($id: ID!) {
    submitBusinessForReview(id: $id) {
      id
      status
      rejectionReason
    }
  }
`;

/** Request a change to an approved business (admin must approve). */
export const REQUEST_BUSINESS_CHANGE_MUTATION = gql`
  mutation RequestBusinessChange($id: ID!, $input: UpdateBusinessDto!) {
    requestBusinessChange(id: $id, input: $input) {
      id
      status
      changes
      createdAt
    }
  }
`;

/** Owner's currently-open (pending) change-request, if any. */
export const MY_OPEN_CHANGE_REQUEST_QUERY = gql`
  query MyOpenChangeRequest($businessId: ID!) {
    myOpenChangeRequest(businessId: $businessId) {
      id
      status
      changes
      createdAt
    }
  }
`;

/**
 * Signed upload URL for a business asset (logo/banner image or licence doc).
 * businessId is optional — omit during signup (no business yet); the path is then keyed by the owner.
 */
export const GET_BUSINESS_ASSET_UPLOAD_URL_MUTATION = gql`
  mutation GetBusinessAssetUploadUrl($input: GetBusinessAssetUploadUrlDto!, $businessId: ID) {
    getBusinessAssetUploadUrl(input: $input, businessId: $businessId) {
      uploadUrl
      publicUrl
      path
      token
    }
  }
`;
