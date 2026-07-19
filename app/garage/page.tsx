import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Garage | Admon',
  description: 'A public Garage of GitHub-verified build records minted on Monad.',
};

export const revalidate = 60;

export { default } from '../commitcar/page';
