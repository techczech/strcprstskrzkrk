import { SITE_INTRO } from './constants';

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}

export const pages: PageMeta[] = [
  {
    path: '/',
    title: 'Strč prst skrz krk · Czech tongue twisters with audio',
    description: SITE_INTRO,
  },
];
