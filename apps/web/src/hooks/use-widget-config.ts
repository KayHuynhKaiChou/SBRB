import { useAppMutation } from '@sbrb/shared-apollo-client';
import {
  UPDATE_WIDGET_CONFIG_MUTATION,
  UPDATE_WIDGET_DATA_LINK_MUTATION,
  REMOVE_WIDGET_DATA_LINK_MUTATION,
} from '../graphql/widget-config.operations';
import type { IChartConfig, IUpdateDataLinkInput } from '@sbrb/shared-types';

// Re-export for back-compat with existing consumers in this app.
export type { IUpdateDataLinkInput };

// WidgetChartData and AvailableSeries are computed from the data link in a
// separate resolver, so they do NOT auto-update via Apollo's entity
// normalization when the Widget is patched. Refetch them explicitly.
const DATA_LINK_DEPENDENT_QUERIES = ['WidgetChartData', 'AvailableSeries'];

export function useWidgetConfig() {
  const [updateConfigMutation, { loading: updatingConfig }] = useAppMutation(
    UPDATE_WIDGET_CONFIG_MUTATION,
    { notifyOnSuccess: false },
  );
  const [updateDataLinkMutation, { loading: updatingLink }] = useAppMutation(
    UPDATE_WIDGET_DATA_LINK_MUTATION,
    { notifyOnSuccess: false },
  );
  const [removeDataLinkMutation, { loading: removingLink }] = useAppMutation(
    REMOVE_WIDGET_DATA_LINK_MUTATION,
    { notifyOnSuccess: false },
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
