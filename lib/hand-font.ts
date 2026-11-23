import { Caveat } from 'next/font/google';

/** Handwriting, for notes stuck onto paper. Only loaded where it's used. */
export const hand = Caveat({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-hand',
  display: 'swap',
});
