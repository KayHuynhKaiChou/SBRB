import { gql } from '@apollo/client';

export const DATA_SHEETS_QUERY = gql`
  query DataSheets($businessId: ID!, $filter: ListDataSheetsInput) {
    dataSheets(businessId: $businessId, filter: $filter) {
      id
      name
      status
      templateType
      periodHeaders
      widgetCount
      originalFilename
      importedAt
      createdAt
      updatedAt
      uploader {
        id
        fullName
        email
        avatarUrl
      }
    }
  }
`;

export const DATA_SERIES_QUERY = gql`
  query DataSeries($datasheetId: ID!, $search: String) {
    dataSeries(datasheetId: $datasheetId, search: $search) {
      id
      seriesName
      dataSheetId
      rowIndex
      departmentId
      department {
        id
        name
      }
    }
  }
`;

export const IMPORT_PROGRESS_SUBSCRIPTION = gql`
  subscription ImportProgress($datasheetId: ID!) {
    importProgress(datasheetId: $datasheetId) {
      datasheetId
      percent
      status
      errorMessage
    }
  }
`;

export const RENAME_DATASHEET_MUTATION = gql`
  mutation RenameDataSheet($id: ID!, $input: UpdateDatasheetDto!) {
    renameDataSheet(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_DATASHEET_MUTATION = gql`
  mutation DeleteDataSheet($id: ID!) {
    deleteDataSheet(id: $id)
  }
`;

export const TOGGLE_DATASHEET_STATUS_MUTATION = gql`
  mutation ToggleDataSheetStatus($id: ID!) {
    toggleDataSheetStatus(id: $id) { id status }
  }
`;

export const DATASHEET_DETAIL_QUERY = gql`
  query DataSheetDetail($id: ID!) {
    dataSheet(id: $id) {
      id
      name
      periodHeaders
      status
      periodType
      templateType
    }
    dataSeries(datasheetId: $id) {
      id
      seriesName
      rowIndex
      values
      departmentId
      department {
        id
        name
      }
    }
  }
`;

export const UPDATE_SERIES_VALUE_MUTATION = gql`
  mutation UpdateSeriesValue($input: UpdateSeriesValueDto!) {
    updateSeriesValue(input: $input) {
      id
      values
    }
  }
`;

export const ADD_SERIES_MUTATION = gql`
  mutation AddSeries($input: AddSeriesDto!) {
    addSeries(input: $input) { id seriesName rowIndex values }
  }
`;

export const DELETE_SERIES_MUTATION = gql`
  mutation DeleteSeries($seriesId: ID!) {
    deleteSeries(seriesId: $seriesId)
  }
`;

export const ADD_PERIOD_MUTATION = gql`
  mutation AddPeriod($input: AddPeriodDto!) {
    addPeriod(input: $input) { id periodHeaders }
  }
`;

export const DELETE_PERIOD_MUTATION = gql`
  mutation DeletePeriod($datasheetId: ID!, $periodName: String!) {
    deletePeriod(datasheetId: $datasheetId, periodName: $periodName) { id periodHeaders }
  }
`;

export const INSERT_PERIOD_MUTATION = gql`
  mutation InsertPeriod($input: InsertPeriodDto!) {
    insertPeriod(input: $input) { id periodHeaders }
  }
`;

export const INSERT_SERIES_MUTATION = gql`
  mutation InsertSeries($input: InsertSeriesDto!) {
    insertSeries(input: $input) { id }
  }
`;

export const DELETE_SERIES_BY_NAME_MUTATION = gql`
  mutation DeleteSeriesByName($datasheetId: ID!, $name: String!) {
    deleteSeriesByName(datasheetId: $datasheetId, name: $name)
  }
`;

export const ADD_DEPARTMENT_TO_DATASHEET_MUTATION = gql`
  mutation AddDepartmentToDatasheet($input: AddDepartmentToDatasheetDto!) {
    addDepartmentToDatasheet(input: $input) { id }
  }
`;

export const DELETE_DEPARTMENT_FROM_DATASHEET_MUTATION = gql`
  mutation DeleteDepartmentFromDatasheet($datasheetId: ID!, $departmentId: ID!) {
    deleteDepartmentFromDatasheet(datasheetId: $datasheetId, departmentId: $departmentId)
  }
`;

export const UPSERT_CELL_VALUE_MUTATION = gql`
  mutation UpsertCellValue($input: UpsertCellValueDto!) {
    upsertCellValue(input: $input) { id values }
  }
`;

export const RENAME_SERIES_MUTATION = gql`
  mutation RenameSeries($seriesId: ID!, $name: String!) {
    renameSeries(seriesId: $seriesId, name: $name) { id seriesName }
  }
`;
