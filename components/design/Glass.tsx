'use client';

import { forwardRef, type ElementType, type HTMLAttributes } from 'react';

export type GlassThickness = 'ultra-thin' | 'thin' | 'regular' | 'thick' | 'ultra-thick';
export type GlassTint = 'none' | 'primary' | 'neural' | 'spark' | 'warn' | 'error';
export type GlassOutline = 'none' | 'primary' | 'neural' | 'warn';
export type GlassGlow = 'none' | 'primary' | 'neural' | 'spark';
export type GlassRadius = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type GlassElevation = 1 | 2 | 3 | 4;

export interface GlassProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  thickness?: GlassThickness;
  tint?: GlassTint;
  outline?: GlassOutline;
  glow?: GlassGlow;
  radius?: GlassRadius;
  elevation?: GlassElevation;
  interactive?: boolean;
  specular?: boolean;
}

function classesFor(props: GlassProps): string {
  const {
    thickness = 'regular',
    tint = 'none',
    outline = 'none',
    glow = 'none',
    radius = 'lg',
    elevation = 2,
    interactive = false,
    specular = false,
    className = '',
  } = props;

  return [
    'glass',
    `glass--${thickness}`,
    tint !== 'none' && `glass--tint-${tint}`,
    outline !== 'none' && `glass--outline-${outline}`,
    glow !== 'none' && `glass--glow-${glow}`,
    `glass--rounded-${radius}`,
    `glass--elev-${elevation}`,
    interactive && 'glass--interactive',
    specular && 'glass--specular',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export const Glass = forwardRef<HTMLElement, GlassProps>(function Glass(props, ref) {
  const {
    as: Component = 'div',
    thickness: _t,
    tint: _ti,
    outline: _o,
    glow: _g,
    radius: _r,
    elevation: _e,
    interactive: _i,
    specular: _s,
    className: _c,
    children,
    ...rest
  } = props;

  return (
    <Component ref={ref} className={classesFor(props)} {...rest}>
      {children}
    </Component>
  );
});
