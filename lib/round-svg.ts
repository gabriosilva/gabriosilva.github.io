import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

// Server (Node) and browser can disagree in the last digits of Math.sin,
// Math.hypot and friends, e.g. 147.8 vs 147.79999999999998. In SVG attributes
// that breaks hydration. Rounding every coordinate to 2 decimals makes the
// output identical on both sides and is far below what the eye can see.

const LONG_NUMBER = /-?\d*\.\d{3,}(?:e-?\d+)?|-?\d+e-\d+/g;

function round(value: unknown): unknown {
  if (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    !Number.isInteger(value)
  )
    return Math.round(value * 100) / 100;
  if (typeof value === 'string')
    return value.replace(LONG_NUMBER, (m) =>
      String(Math.round(Number(m) * 100) / 100),
    );
  return value;
}

export function roundSvg(node: ReactNode): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<Record<string, unknown>>;
    const props: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(el.props)) {
      if (k === 'children') continue;
      const r = round(v);
      if (r !== v) props[k] = r;
    }
    if (el.props.children !== undefined)
      props.children = roundSvg(el.props.children as ReactNode);
    return cloneElement(el, props);
  });
}
