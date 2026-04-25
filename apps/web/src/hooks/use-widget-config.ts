import { t } from 'i18next';
import { useAppMutation } from '@sbrb/shared-apollo-client';
import {
  UPDATE_WIDGET_CONFIG_MUTATION,
  UPDATE_WIDGET_DATA_LINK_MUTATION,
  REMOVE_WIDGET_DATA_LINK_MUTATION,
} from '../graphql/widget-config.operations';
import type { IChartConfig } from '@sbrb/shared-types';

// Queries that depend on widget data link — must refetch after link mutations.
const DATA_LINK_DEPENDENT_QUERIES = ['WidgetChartData', 'AvailableSeries', 'Widgets'];

/** Input shape matching GraphQL UpdateDataLinkDto */
export interface IUpdateDataLinkInput {
  dataSheetId: string;
  selectedSeries: string[];
  selectedPeriods: string[] | null;
}

export function useWidgetConfig() {
  const [updateConfigMutation, { loading: updatingConfig }] = useAppMutation(
    UPDATE_WIDGET_CONFIG_MUTATION,
    {
      notifyOnSuccess: false,
      fallbackError: t('widget:update_config_error'),
    },
  );
  const [updateDataLinkMutation, { loading: updatingLink }] = useAppMutation(
    UPDATE_WIDGET_DATA_LINK_MUTATION,
    {
      notifyOnSuccess: false,
      fallbackError: t('widget:update_link_error'),
    },
  );
  const [removeDataLinkMutation, { loading: removingLink }] = useAppMutation(
    REMOVE_WIDGET_DATA_LINK_MUTATION,
    {
      notifyOnSuccess: false,
      fallbackError: t('widget:remove_link_error'),
    },
  );

  const updateConfig = async (id: string, config: Partial<IChartConfig> & { name?: string }) => {
    await updateConfigMutation({ variables: { id, config } }).catch(() => undefined);
  };

  const updateDataLink = async (id: string, dataLink: IUpdateDataLinkInput) => {
    await updateDataLinkMutation({
      variables: { id, input: dataLink },
      refetchQueries: DATA_LINK_DEPENDENT_QUERIES,
      awaitRefetchQueries: true,
    }).catch(() => undefined);
  };

  const removeDataLink = async (id: string) => {
    await removeDataLinkMutation({
      variables: { id },
      refetchQueries: DATA_LINK_DEPENDENT_QUERIES,
      awaitRefetchQueries: true,
    }).catch(() => undefined);
  };

  return {
    updateConfig,
    updateDataLink,
    removeDataLink,
    loading: updatingConfig || updatingLink || removingLink,
  };
}
