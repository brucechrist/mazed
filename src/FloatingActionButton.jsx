import React from 'react';
import '../floating-action-button.css';

const sizeClassMap = {
  small: 'floating-action-button--small',
  medium: 'floating-action-button--medium',
  large: 'floating-action-button--large',
};

const variantClassMap = {
  primary: 'floating-action-button--primary',
  neutral: 'floating-action-button--neutral',
};

export default function FloatingActionButton({
  icon = '+',
  children,
  ariaLabel = 'Trigger action',
  size = 'medium',
  variant = 'primary',
  className = '',
  ...props
}) {
  const resolvedSizeClass = sizeClassMap[size] ?? sizeClassMap.medium;
  const resolvedVariantClass = variantClassMap[variant] ?? variantClassMap.primary;
  const content = children ?? icon;

  return (
    <button
      type="button"
      className={[
        'floating-action-button',
        resolvedSizeClass,
        resolvedVariantClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
      {...props}
    >
      <span aria-hidden="true" className="floating-action-button__icon">
        {content}
      </span>
    </button>
  );
}
