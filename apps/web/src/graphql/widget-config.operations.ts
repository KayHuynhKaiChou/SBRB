import { gql } from '@apollo/client';

export const WIDGET_CHART_DATA_QUERY = gql`
  query WidgetChartData($widgetId: ID!) {
    widgetChartData(widgetId: $widgetId) {
      labels
      datasets {
        label
        data
        backgroundColor
        borderColor
      }
      trend {
        value
        direction
        vsLabel
      }
    }
  }
`;

export const UPDATE_WIDGET_CONFIG_MUTATION = gql`
  mutation UpdateWidgetConfig($id: ID!, $config: JSON!) {
    updateWidgetConfig(id: $id, config: $config) {
      id
      config
    }
  }
`;

export const UPDATE_WIDGET_DATA_LINK_MUTATION = gql`
  mutation UpdateWidgetDataLink($id: ID!, $input: UpdateDataLinkDto!) {
    updateWidgetDataLink(id: $id, input: $input) {
      id
      dataSheetId
      selectedSeries
      selectedPeriods
    }
  }
`;

export const REMOVE_WIDGET_DATA_LINK_MUTATION = gql`
  mutation RemoveWidgetDataLink($id: ID!) {
    removeWidgetDataLink(id: $id) {
      id
      dataSheetId
      selectedSeries
      selectedPeriods
    }
  }
`;

export const AVAILABLE_SERIES_QUERY = gql`
  query AvailableSeries($widgetId: ID!) {
    availableSeries(widgetId: $widgetId) {
      id
      name
    }
  }
`;
