import { gql } from '@apollo/client';

export const TABS_QUERY = gql`
  query Tabs($businessId: ID!) {
    tabs(businessId: $businessId) {
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
  }
`;

export const WIDGETS_QUERY = gql`
  query Widgets($tabId: ID!) {
    widgets(tabId: $tabId) {
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
      chartConfig {
        type
        colorIndex
        showLabels
        yAxisFromZero
        showLegend
      }
      isRestricted
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_TAB_MUTATION = gql`
  mutation CreateTab($input: CreateTabInput!) {
    createTab(input: $input) {
      id
      name
      iconColor
      iconName
      order
      isPinned
      isProtected
    }
  }
`;

export const UPDATE_TAB_MUTATION = gql`
  mutation UpdateTab($id: ID!, $input: UpdateTabInput!) {
    updateTab(id: $id, input: $input) {
      id
      name
      iconColor
      iconName
      order
      isPinned
      isProtected
    }
  }
`;

export const DELETE_TAB_MUTATION = gql`
  mutation DeleteTab($id: ID!) {
    deleteTab(id: $id)
  }
`;

export const REORDER_TABS_MUTATION = gql`
  mutation ReorderTabs($orders: [TabOrderInput!]!) {
    reorderTabs(orders: $orders)
  }
`;

export const CREATE_WIDGET_MUTATION = gql`
  mutation CreateWidget($input: CreateWidgetInput!) {
    createWidget(input: $input) {
      id
      name
      metricName
      unit
      position {
        x
        y
        w
        h
      }
    }
  }
`;

export const UPDATE_WIDGET_MUTATION = gql`
  mutation UpdateWidget($id: ID!, $input: UpdateWidgetInput!) {
    updateWidget(id: $id, input: $input) {
      id
      name
      metricName
      unit
    }
  }
`;

export const DELETE_WIDGET_MUTATION = gql`
  mutation DeleteWidget($id: ID!) {
    deleteWidget(id: $id)
  }
`;
