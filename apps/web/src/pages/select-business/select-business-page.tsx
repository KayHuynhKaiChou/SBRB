import { Spin, Button } from 'antd';
import { RiAddLine } from 'react-icons/ri';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { APP_ROUTES, MAX_BUSINESSES_PER_OWNER } from '@sbrb/shared-constants';
import type { IMyBusinessSummary } from '@sbrb/shared-types';
import { AuthLayout } from '../../components/auth/auth-layout';
import { BusinessChoiceCard } from '../../components/business/business-choice-card';
import { useAuthStore } from '../../store/auth.store';
import { MY_BUSINESSES_QUERY } from '../../graphql/auth.operations';

interface IMyBusinessesData {
  myBusinesses: IMyBusinessSummary[];
}

/**
 * Business hub: pick which business to work in (post-login chooser + profile entry)
 * and register a new one. A user with zero businesses is sent to onboarding instead.
 */
export default function SelectBusinessPage() {
  const { t } = useTranslation('business');
  const navigate = useNavigate();
  const currentBusinessId = useAuthStore((s) => s.currentBusinessId);
  const setCurrentBusiness = useAuthStore((s) => s.setCurrentBusiness);

  const { data, loading } = useQuery<IMyBusinessesData>(MY_BUSINESSES_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const businesses = data?.myBusinesses;

  const handleSelect = (id: string) => {
    setCurrentBusiness(id);
    navigate(APP_ROUTES.DASHBOARD);
  };

  // canGoBack lets the onboarding page show a Back button (this is an opt-in flow,
  // unlike the forced onboarding a user with zero businesses lands on).
  const handleRegister = () => {
    navigate(APP_ROUTES.ONBOARDING, { state: { canGoBack: true } });
  };

  // First load (no cached data yet) → spinner.
  if (loading && !businesses) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Zero businesses → must create one first (onboarding handles that flow).
  if (!businesses || businesses.length === 0) {
    return <Navigate to={APP_ROUTES.ONBOARDING} replace />;
  }

  const canRegister = businesses.length < MAX_BUSINESSES_PER_OWNER;

  return (
    <AuthLayout title={t('select_title')} subtitle={t('select_subtitle')}>
      <div
        className="flex flex-col gap-3 rounded-2xl border border-gray02 bg-neutral-50 p-4"
        data-testid="tour-select-business"
      >
        {businesses.map((b) => (
          <BusinessChoiceCard
            key={b.id}
            business={b}
            isCurrent={b.id === currentBusinessId}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {canRegister && (
        <Button
          type="dashed"
          block
          icon={<RiAddLine size={18} />}
          onClick={handleRegister}
          className="!mt-3 !h-12 !rounded-xl !font-medium !text-red05 hover:!border-red05"
        >
          {t('select_register_cta')}
        </Button>
      )}
    </AuthLayout>
  );
}
