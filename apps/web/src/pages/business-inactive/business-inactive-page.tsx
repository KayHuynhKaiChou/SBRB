import React from 'react';
import { Card } from 'antd';
import { InactiveBanner } from './components/inactive-banner';
import { InactiveActions } from './components/inactive-actions';

interface IInactiveBusiness {
  id: string;
  name: string;
  status: string;
  inactivatedAt?: string | null;
  inactiveReason?: string | null;
}

interface IBusinessInactivePageProps {
  business: IInactiveBusiness;
}

/**
 * Full-screen page shown when the current business has status 'inactive' (SRS §5.8, AC-4).
 * Centered card with banner (name, reason, date) + action buttons (switch / logout).
 */
export function BusinessInactivePage({ business }: IBusinessInactivePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card
        className="w-full max-w-md shadow-lg rounded-2xl"
        styles={{ body: { padding: '40px 32px' } }}
      >
        <InactiveBanner
          businessName={business.name}
          inactiveReason={business.inactiveReason}
          inactivatedAt={business.inactivatedAt ? String(business.inactivatedAt) : null}
        />

        <InactiveActions currentBusinessId={business.id} />
      </Card>
    </div>
  );
}
