import { Layout, Spin, Typography } from 'antd';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { EBusinessRole } from '@sbrb/shared-constants';
import type { IProfileQueryData, IProfileQueryVars } from '@sbrb/shared-types';
import { Sidebar } from '../../components/layout/sidebar';
import { useAuthStore } from '../../store/auth.store';
import { PROFILE_QUERY } from '../../graphql/profile.operations';
import { PersonalInfoCard } from '../../components/profile/personal-info-card';
import { BusinessInfoCard } from '../../components/profile/business-info-card';
import { SecurityCard } from '../../components/profile/security-card';

const { Title } = Typography;

export default function ProfilePage() {
  const { t } = useTranslation('profile');
  const businessId = useAuthStore((s) => s.currentBusinessId);

  const { data, loading } = useQuery<IProfileQueryData, IProfileQueryVars>(PROFILE_QUERY, {
    variables: { businessId: businessId ?? '' },
    skip: !businessId,
  });

  if (!businessId) return <Navigate to="/onboarding" replace />;

  return (
    <Layout className="!min-h-screen">
      <Sidebar />
      <Layout className="!ml-[60px]">
        <div className="p-6 h-full overflow-y-auto">
          {loading || !data?.me ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
              <Title level={3} className="!m-0">
                {t('title', 'Profile')}
              </Title>
              <PersonalInfoCard user={data.me} role={data.myMembership?.role} />
              {data.myMembership?.role === EBusinessRole.OWNER && data.business && (
                <BusinessInfoCard
                  business={data.business}
                  joinedAt={data.myMembership?.joinedAt}
                />
              )}
              <SecurityCard />
            </div>
          )}
        </div>
      </Layout>
    </Layout>
  );
}
