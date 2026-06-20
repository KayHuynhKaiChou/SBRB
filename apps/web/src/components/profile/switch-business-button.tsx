import { Button } from 'antd';
import { RiSwapBoxLine } from 'react-icons/ri';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { APP_ROUTES } from '@sbrb/shared-constants';
import { MY_BUSINESSES_QUERY } from '../../graphql/auth.operations';

interface IMyBusinessesData {
  myBusinesses: Array<{ id: string }>;
}

/**
 * Profile action that opens the business hub (`/select-business`) where the user can
 * switch between businesses and register a new one. Shown to any business member;
 * hidden only if they somehow have none (the page itself would redirect anyway).
 */
export function SwitchBusinessButton() {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();

  const { data } = useQuery<IMyBusinessesData>(MY_BUSINESSES_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  if ((data?.myBusinesses?.length ?? 0) < 1) return null;

  return (
    <Button
      icon={<RiSwapBoxLine size={16} />}
      onClick={() => navigate(APP_ROUTES.SELECT_BUSINESS)}
      className="!rounded-lg !border-red05 !font-medium !text-red05"
    >
      {t('manage_businesses')}
    </Button>
  );
}
