import { useMutation } from '@apollo/client';
import { message } from 'antd';
import {
  UPDATE_WIDGET_CONFIG_MUTATION,
  UPDATE_WIDGET_DATA_LINK_MUTATION,
  REMOVE_WIDGET_DATA_LINK_MUTATION,
} from '../graphql/widget-config.operations';
import type { IChartConfig, IWidgetDataLink } from '@sbrb/shared-types';

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
      await updateConfigMutation({
        variables: { id, config },
        optimisticResponse: {
          updateWidgetConfig: {
            __typename: 'Widget',
            id,
            name: config.name,
            chartConfig: config,
          },
        },
      });
    } catch {
      message.error('Không thể cập nhật cấu hình widget');
    }
  };

  const updateDataLink = async (id: string, dataLink: IWidgetDataLink) => {
    try {
      await updateDataLinkMutation({ variables: { id, input: dataLink } });
    } catch {
      message.error('Không thể cập nhật liên kết dữ liệu');
    }
  };

  const removeDataLink = async (id: string) => {
    try {
      await removeDataLinkMutation({ variables: { id } });
    } catch {
      message.error('Không thể xoá liên kết dữ liệu');
    }
  };

  return {
    updateConfig,
    updateDataLink,
    removeDataLink,
    loading: updatingConfig || updatingLink || removingLink,
  };
}
