import { Spin, Typography } from 'antd';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import type { IProfileQueryData, IProfileQueryVars } from '@sbrb/shared-types';
import { useAuthStore } from '../../store/auth.store';
import { PROFILE_QUERY } from '../../graphql/profile.operations';
import { PersonalInfoCard } from '../../components/profile/personal-info-card';
// Business info now lives in the dedicated "My Business" page (all changes admin-gated).
import { SecurityCard } from '../../components/profile/security-card';
import { SwitchBusinessButton } from '../../components/profile/switch-business-button';
import { FeatureTour } from '../../components/guide/feature-tour';
import { profileTourSteps } from './profile-tour-steps';

const { Title } = Typography;

export default function ProfilePage() {
  const { t } = useTranslation('profile');
  const { t: tg } = useTranslation('guide');
  const businessId = useAuthStore((s) => s.currentBusinessId);

  const { data, loading } = useQuery<IProfileQueryData, IProfileQueryVars>(PROFILE_QUERY, {
    variables: { businessId: businessId ?? '' },
    skip: !businessId,
  });

  if (!businessId) return <Navigate to="/onboarding" replace />;

  return (
    <div className="p-6 h-full overflow-y-auto">
      {loading || !data?.me ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <Title level={3} className="!m-0">
              {t('title', 'Profile')}
            </Title>
            <SwitchBusinessButton />
          </div>
          <div data-testid="tour-profile-personal">
            <PersonalInfoCard user={data.me} role={data.myMembership?.role} />
          </div>
          <div data-testid="tour-profile-security">
            <SecurityCard />
          </div>
          <FeatureTour tourId="profile" steps={profileTourSteps(tg)} />
        </div>
      )}
    </div>
  );
}
