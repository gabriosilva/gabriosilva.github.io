import type { MDXComponents } from 'mdx/types';
import BallRamp from '@/components/contraptions/BallRamp';
import PulseNetwork from '@/components/contraptions/PulseNetwork';
import Ferry from '@/components/contraptions/Ferry';
import FractalTree from '@/components/contraptions/FractalTree';
import WindowLight from '@/components/contraptions/WindowLight';
import {
  Demo,
  Figure,
  Item,
  Note,
  Predict,
  Scribble,
  Sound,
  Spread,
  Todo,
} from '@/components/mdx/blocks';
import { Aside, Stop, Timeline } from '@/components/mdx/timeline';
import Drawing from '@/components/work/Drawing';

// Every field note can use these without importing anything.
// See WRITING.md for how to use each one.
const components: MDXComponents = {
  Note,
  Figure,
  Predict,
  Spread,
  Item,
  Scribble,
  Sound,
  Todo,
  Demo,
  PulseNetwork,
  BallRamp,
  WindowLight,
  Ferry,
  FractalTree,
  Timeline,
  Stop,
  Aside,
  Drawing,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
