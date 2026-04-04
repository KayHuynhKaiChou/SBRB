import { gql } from '@apollo/client';

const DEPARTMENT_FIELDS = gql`
  fragment DepartmentFields on DepartmentType {
    id
    name
    parentId
    businessId
    createdAt
    updatedAt
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
