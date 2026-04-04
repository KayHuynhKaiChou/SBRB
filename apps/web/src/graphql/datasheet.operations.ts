import { gql } from '@apollo/client';

export const DATA_SHEETS_QUERY = gql`
  query DataSheets($businessId: ID!, $departmentId: ID) {
    dataSheets(businessId: $businessId, departmentId: $departmentId) {
      id
      name
      departmentId
      status
      periodHeaders
      seriesCount
      periodCount
      originalFilename
      importedAt
      createdAt
      updatedAt
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

export const DATASHEET_DETAIL_QUERY = gql`
  query DataSheetDetail($id: ID!) {
    dataSheet(id: $id) {
      id
      name
      periodHeaders
      status
      periodType
      seriesCount
      periodCount
    }
    dataSeries(datasheetId: $id) {
      id
      seriesName
      rowIndex
      values
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
    addPeriod(input: $input) { id periodHeaders periodCount }
  }
`;

export const DELETE_PERIOD_MUTATION = gql`
  mutation DeletePeriod($datasheetId: ID!, $periodName: String!) {
    deletePeriod(datasheetId: $datasheetId, periodName: $periodName) { id periodHeaders periodCount }
  }
`;

export const RENAME_SERIES_MUTATION = gql`
  mutation RenameSeries($seriesId: ID!, $name: String!) {
    renameSeries(seriesId: $seriesId, name: $name) { id seriesName }
  }
`;
