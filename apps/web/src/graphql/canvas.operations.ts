import { gql } from '@apollo/client';

const WIDGET_FIELDS = gql`
  fragment WidgetFields on Widget {
    id
    tabId
    businessId
    name
    metricName
    unit
    position {
      x
      y
      w
      h
    }
    config
    chartConfig {
      type
      colorIndex
      showLabels
      yAxisFromZero
      showLegend
    }
    dataSheetId
    selectedSeries
    selectedPeriods
    isRestricted
    createdAt
    updatedAt
  }
`;

const TAB_FIELDS = gql`
  fragment TabFields on Tab {
    id
    businessId
    name
    iconColor
    iconName
    order
    isPinned
    isProtected
    createdAt
  }
`;

export const TABS_QUERY = gql`
  query Tabs($businessId: ID!) {
    tabs(businessId: $businessId) {
      ...TabFields
    }
  }
  ${TAB_FIELDS}
`;

export const WIDGETS_QUERY = gql`
  query Widgets($tabId: ID!) {
    widgets(tabId: $tabId) {
      ...WidgetFields
    }
  }
  ${WIDGET_FIELDS}
`;

export const CREATE_TAB_MUTATION = gql`
  mutation CreateTab($input: CreateTabInput!) {
    createTab(input: $input) {
      code
      message { vi en }
      data { ...TabFields }
    }
  }
  ${TAB_FIELDS}
`;

export const UPDATE_TAB_MUTATION = gql`
  mutation UpdateTab($id: ID!, $input: UpdateTabInput!) {
    updateTab(id: $id, input: $input) {
      code
      message { vi en }
      data { ...TabFields }
    }
  }
  ${TAB_FIELDS}
`;

export const DELETE_TAB_MUTATION = gql`
  mutation DeleteTab($id: ID!) {
    deleteTab(id: $id) {
      code
      message { vi en }
      data { id businessId }
    }
  }
`;

export const REORDER_TABS_MUTATION = gql`
  mutation ReorderTabs($orders: [TabOrderInput!]!) {
    reorderTabs(orders: $orders) {
      code
      message { vi en }
    }
  }
`;

export const CREATE_WIDGET_MUTATION = gql`
  mutation CreateWidget($input: CreateWidgetInput!) {
    createWidget(input: $input) {
      code
      message {
        vi
        en
      }
      data {
        ...WidgetFields
      }
    }
  }
  ${WIDGET_FIELDS}
`;

export const UPDATE_WIDGET_MUTATION = gql`
  mutation UpdateWidget($id: ID!, $input: UpdateWidgetInput!) {
    updateWidget(id: $id, input: $input) {
      code
      message {
        vi
        en
      }
      data {
        ...WidgetFields
      }
    }
  }
  ${WIDGET_FIELDS}
`;

export const DELETE_WIDGET_MUTATION = gql`
  mutation DeleteWidget($id: ID!) {
    deleteWidget(id: $id) {
      code
      message {
        vi
        en
      }
      data {
        id
        tabId
      }
    }
  }
`;
