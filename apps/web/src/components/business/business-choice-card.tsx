import { Avatar, Typography } from 'antd';
import { RiArrowRightLine, RiCheckLine } from 'react-icons/ri';
import type { IMyBusinessSummary } from '@sbrb/shared-types';
import { BusinessStatusTag } from './business-status-tag';

const { Text } = Typography;

interface IBusinessChoiceCardProps {
  business: IMyBusinessSummary;
  /** Highlights the business the user is currently working in. */
  isCurrent?: boolean;
  onSelect: (id: string) => void;
}

/** One selectable business row inside the "switch business" chooser. */
export function BusinessChoiceCard({ business, isCurrent, onSelect }: IBusinessChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(business.id)}
      className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-red05 hover:shadow-[var(--shadow-red)] ${
        isCurrent ? 'border-red05 bg-red00' : 'border-gray02 bg-white'
      }`}
    >
      <Avatar
        size={40}
        shape="square"
        src={business.logoUrl ?? undefined}
        style={{ background: 'var(--red05)', fontSize: 16, flexShrink: 0 }}
      >
        {business.name?.[0]?.toUpperCase()}
      </Avatar>

      <div className="min-w-0 flex-1">
        <Text strong className="block truncate !text-[15px] !text-gray09" title={business.name}>
          {business.name}
        </Text>
        <div className="mt-1">
          <BusinessStatusTag status={business.status} />
        </div>
      </div>

      {isCurrent ? (
        <RiCheckLine size={20} className="shrink-0 text-red05" />
      ) : (
        <RiArrowRightLine
          size={20}
          className="shrink-0 text-gray03 transition-colors group-hover:text-red05"
        />
      )}
    </button>
  );
}
