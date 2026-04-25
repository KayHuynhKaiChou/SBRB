import React from 'react';
import { Button, Tooltip } from 'antd';

/**
 * SBRB Icon Button — SRS 6.2
 *
 * Round icon-only button with tooltip on hover.
 * - Default 32px, medium 40px, large 48px (FAB)
 * - Variants: primary (red), ghost (transparent), danger (red outline)
 * - Focus ring: brand red glow
 */

type IconButtonVariant = 'primary' | 'ghost' | 'danger';
type IconButtonSize = 'small' | 'default' | 'large';

interface IIconButtonProps {
  icon: React.ReactNode;
  tooltip?: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  htmlType?: 'button' | 'submit' | 'reset';
}

const SIZE_MAP: Record<IconButtonSize, { button: number; icon: number }> = {
  small: { button: 32, icon: 16 },
  default: { button: 40, icon: 18 },
  large: { button: 48, icon: 20 },
};

const BRAND = '#D72A44';
const BRAND_DARK = '#A81E33';
const BRAND_LIGHT = '#FCEEF0';

function getVariantStyles(
  variant: IconButtonVariant,
  active: boolean,
  hovered: boolean,
  disabled: boolean,
): React.CSSProperties {
  if (disabled) {
    return { background: '#f5f5f5', color: '#bfbfbf', cursor: 'not-allowed' };
  }

  switch (variant) {
    case 'primary':
      return {
        background: hovered ? BRAND_DARK : BRAND,
        color: '#ffffff',
        cursor: 'pointer',
      };

    case 'danger':
      return {
        background: hovered ? BRAND_LIGHT : 'transparent',
        color: BRAND,
        border: `1px solid ${BRAND}`,
        cursor: 'pointer',
      };

    case 'ghost':
    default:
      return {
        background: active
          ? BRAND_LIGHT
          : hovered
            ? BRAND_DARK
            : BRAND_LIGHT,
        color: active ? BRAND : hovered ? '#ffffff' : BRAND,
        border: `1px solid ${hovered ? BRAND_DARK : BRAND}`,
        cursor: 'pointer',
      };
  }
}

export function IconButton({
  icon,
  tooltip,
  variant = 'ghost',
  size = 'default',
  active = false,
  disabled = false,
  loading = false,
  onClick,
  className,
  style,
  htmlType,
}: IIconButtonProps) {
  const [hovered, setHovered] = React.useState(false);
  const dims = SIZE_MAP[size];
  const variantStyle = getVariantStyles(variant, active, hovered, disabled);

  const button = (
    <Button
      type="text"
      shape="circle"
      icon={icon}
      htmlType={htmlType}
      disabled={disabled || loading}
      loading={loading}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        width: dims.button,
        height: dims.button,
        minWidth: dims.button,
        fontSize: dims.icon,
        padding: 0,
        transition: 'background-color 150ms ease, box-shadow 150ms ease, color 150ms ease',
        ...variantStyle,
        ...style,
      }}
      onFocus={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(215,42,68,0.3)';
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  );

  if (tooltip) {
    return <Tooltip title={tooltip}>{button}</Tooltip>;
  }

  return button;
}
