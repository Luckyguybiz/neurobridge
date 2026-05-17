'use client';

import { type ReactNode } from 'react';
import { Glass, type GlassProps } from './Glass';

export interface PanelProps extends Omit<GlassProps, 'children' | 'title'> {
  title?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap: Record<NonNullable<PanelProps['padding']>, string> = {
  none: '0',
  sm: 'var(--space-3)',
  md: 'var(--space-5)',
  lg: 'var(--space-7)',
};

export function Panel({
  title,
  eyebrow,
  actions,
  footer,
  children,
  padding = 'md',
  ...glassProps
}: PanelProps) {
  return (
    <Glass {...glassProps} style={{ padding: paddingMap[padding], ...glassProps.style }}>
      {(eyebrow || title || actions) && (
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            marginBottom: children ? 'var(--space-4)' : 0,
          }}
        >
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            {eyebrow && <div className="type-eyebrow" style={{ marginBottom: 'var(--space-1)' }}>{eyebrow}</div>}
            {title && <div className="type-title-3">{title}</div>}
          </div>
          {actions && <div style={{ flex: '0 0 auto', display: 'flex', gap: 'var(--space-2)' }}>{actions}</div>}
        </header>
      )}
      {children}
      {footer && (
        <footer
          style={{
            marginTop: 'var(--space-4)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--edge-outline)',
          }}
        >
          {footer}
        </footer>
      )}
    </Glass>
  );
}
