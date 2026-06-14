import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginDto!) {
    login(input: $input) {
      accessToken
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      fullName
      avatarUrl
      phone
      language
      bio
      department {
        id
        name
      }
      emailVerified
      createdAt
      platformRole
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterDto!) {
    register(input: $input) {
      message
    }
  }
`;

export const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password)
  }
`;

export const VERIFY_OTP_MUTATION = gql`
  mutation VerifyEmailOtp($email: String!, $code: String!) {
    verifyEmailOtp(email: $email, code: $code)
  }
`;

// NOTE: CREATE_BUSINESS_MUTATION moved to graphql/business.operations.ts (now carries KYB).
// ACCEPT_INVITATION_MUTATION removed — staff join is no longer a public flow (owner adds members).

export const MY_BUSINESSES_QUERY = gql`
  query MyBusinesses {
    myBusinesses {
      id
      name
      status
    }
  }
`;

export const ACCEPT_INVITATION_MUTATION = gql`
  mutation AcceptInvitation($token: String!) {
    acceptInvitation(token: $token) {
      id
      name
    }
  }
`;
