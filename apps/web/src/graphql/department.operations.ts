import { gql } from '@apollo/client';

const DEPARTMENT_FIELDS = gql`
  fragment DepartmentFields on DepartmentType {
    id
    name
    parentId
    businessId
    isRoot
    positionX
    positionY
    memberCount
    createdAt
    updatedAt
  }
`;

const DEPARTMENT_MEMBER_FIELDS = gql`
  fragment DepartmentMemberFields on DepartmentMember {
    id
    departmentId
    userId
    isManager
    businessRole
    joinedAt
    user {
      id
      fullName
      email
      avatarUrl
      phone
    }
  }
`;

export const DEPARTMENTS_QUERY = gql`
  query Departments($businessId: ID!) {
    departments(businessId: $businessId) {
      ...DepartmentFields
    }
  }
  ${DEPARTMENT_FIELDS}
`;

export const DEPARTMENT_TREE_QUERY = gql`
  query DepartmentTree($businessId: ID!) {
    departmentTree(businessId: $businessId) {
      ...DepartmentFields
      manager {
        ...DepartmentMemberFields
      }
      children {
        ...DepartmentFields
        manager {
          ...DepartmentMemberFields
        }
        children {
          ...DepartmentFields
          manager {
            ...DepartmentMemberFields
          }
          children {
            ...DepartmentFields
            manager {
              ...DepartmentMemberFields
            }
            children {
              ...DepartmentFields
              manager {
                ...DepartmentMemberFields
              }
            }
          }
        }
      }
    }
  }
  ${DEPARTMENT_FIELDS}
  ${DEPARTMENT_MEMBER_FIELDS}
`;

export const DEPARTMENT_MEMBERS_QUERY = gql`
  query DepartmentMembers($departmentId: ID!) {
    departmentMembers(departmentId: $departmentId) {
      ...DepartmentMemberFields
    }
  }
  ${DEPARTMENT_MEMBER_FIELDS}
`;

export const CREATE_DEPARTMENT_MUTATION = gql`
  mutation CreateDepartment($input: CreateDepartmentDto!) {
    createDepartment(input: $input) {
      ...DepartmentFields
    }
  }
  ${DEPARTMENT_FIELDS}
`;

export const UPDATE_DEPARTMENT_MUTATION = gql`
  mutation UpdateDepartment($id: ID!, $input: UpdateDepartmentDto!) {
    updateDepartment(id: $id, input: $input) {
      ...DepartmentFields
    }
  }
  ${DEPARTMENT_FIELDS}
`;

export const DELETE_DEPARTMENT_MUTATION = gql`
  mutation DeleteDepartment($id: ID!) {
    deleteDepartment(id: $id)
  }
`;

export const ADD_DEPARTMENT_MEMBER_MUTATION = gql`
  mutation AddDepartmentMember($departmentId: ID!, $userId: ID!) {
    addDepartmentMember(departmentId: $departmentId, userId: $userId) {
      ...DepartmentMemberFields
    }
  }
  ${DEPARTMENT_MEMBER_FIELDS}
`;

export const REMOVE_DEPARTMENT_MEMBER_MUTATION = gql`
  mutation RemoveDepartmentMember($departmentId: ID!, $userId: ID!) {
    removeDepartmentMember(departmentId: $departmentId, userId: $userId)
  }
`;

export const MY_BUSINESS_ROLE_QUERY = gql`
  query MyBusinessRole($businessId: ID!) {
    myBusinessRole(businessId: $businessId)
  }
`;

export const UPDATE_DEPARTMENT_POSITIONS_MUTATION = gql`
  mutation UpdateDepartmentPositions(
    $businessId: ID!
    $positions: [DepartmentPositionInput!]!
  ) {
    updateDepartmentPositions(businessId: $businessId, positions: $positions) {
      id
      positionX
      positionY
    }
  }
`;

export const SET_DEPARTMENT_MANAGER_MUTATION = gql`
  mutation SetDepartmentManager($departmentId: ID!, $userId: ID!) {
    setDepartmentManager(departmentId: $departmentId, userId: $userId) {
      ...DepartmentMemberFields
    }
  }
  ${DEPARTMENT_MEMBER_FIELDS}
`;
