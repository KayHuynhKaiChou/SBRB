import { gql } from '@apollo/client';

export const DATA_SHEETS_QUERY = gql`
  query DataSheets($businessId: ID!) {
    dataSheets(businessId: $businessId) {
      id
      name
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
