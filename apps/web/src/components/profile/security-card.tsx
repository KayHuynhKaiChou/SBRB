import { Card } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useToggle } from '@uidotdev/usehooks';
import { IconButton } from '@sbrb/ui';
import { ChangePasswordModal } from './change-password-modal';
import { SessionsTable } from './sessions-table';

export function SecurityCard() {
  const { t } = useTranslation('profile');
  const [pwOpen, togglePwOpen] = useToggle(false);

  return (
    <Card title={t('security_section')}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <IconButton
            icon={<LockOutlined />}
            tooltip={t('change_password_button')}
            variant="primary"
            onClick={() => togglePwOpen(true)}
          />
          <span>{t('change_password_button')}</span>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-base font-medium m-0">{t('sessions_title')}</h4>
          <SessionsTable />
        </div>
      </div>

      <ChangePasswordModal open={pwOpen} onClose={() => togglePwOpen(false)} />
    </Card>
  );
}
