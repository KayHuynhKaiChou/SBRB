import { useMutation } from '@apollo/client';
import { message } from 'antd';
import { t } from 'i18next';
import {
  UPDATE_WIDGET_CONFIG_MUTATION,
  UPDATE_WIDGET_DATA_LINK_MUTATION,
  REMOVE_WIDGET_DATA_LINK_MUTATION,
} from '../graphql/widget-config.operations';
import type { IChartConfig } from '@sbrb/shared-types';

/** Input shape matching GraphQL UpdateDataLinkDto */
export interface IUpdateDataLinkInput {
  dataSheetId: string;
  selectedSeries: string[];
  selectedPeriods: string[] | null;
}

export function useWidgetConfig() {
  const [updateConfigMutation, { loading: updatingConfig }] = useMutation(
    UPDATE_WIDGET_CONFIG_MUTATION,
  );
  const [updateDataLinkMutation, { loading: updatingLink }] = useMutation(
    UPDATE_WIDGET_DATA_LINK_MUTATION,
  );
  const [removeDataLinkMutation, { loading: removingLink }] = useMutation(
    REMOVE_WIDGET_DATA_LINK_MUTATION,
  );

  const updateConfig = async (id: string, config: Partial<IChartConfig> & { name?: string }) => {
    try {
      await updateConfigMutation({ variables: { id, config } });
    } catch {
      message.error(t('widget:update_config_error'));
    }
  };

  const updateDataLink = async (id: string, dataLink: IUpdateDataLinkInput) => {
    try {
      await updateDataLinkMutation({ variables: { id, input: dataLink } });
    } catch {
      message.error(t('widget:update_link_error'));
    }
  };

  const removeDataLink = async (id: string) => {
    try {
      await removeDataLinkMutation({ variables: { id } });
    } catch {
      message.error(t('widget:remove_link_error'));
    }
  };

  return {
    updateConfig,
    updateDataLink,
    removeDataLink,
    loading: updatingConfig || updatingLink || removingLink,
  };
}
