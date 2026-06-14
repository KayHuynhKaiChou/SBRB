import React from 'react';
import { Button, Typography } from 'antd';
import { RiCheckboxCircleLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { APP_ROUTES } from '@sbrb/shared-constants';

/** Wizard step 4 — business submitted, awaiting admin approval. */
export function StepDone() {
  const { t } = useTranslation('business');
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center gap-4 py-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-50">
        <RiCheckboxCircleLine size={36} color="#22C55E" />
      </div>
      <div>
        <Typography.Title level={5} className="!mt-0 !mb-1.5">
          {t('wizard_done_title')}
        </Typography.Title>
        <Typography.Text className="!text-gray-500 !text-sm">
          {t('wizard_done_desc')}
        </Typography.Text>
      </div>
      <Button
        type="primary"
        block
        onClick={() => navigate(APP_ROUTES.MY_BUSINESS)}
        className="!h-11 !rounded-lg !bg-[#D72A44] !border-none !font-semibold"
      >
        {t('wizard_done_cta')}
      </Button>
    </div>
  );
}
