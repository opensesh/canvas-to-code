import mock from '@/data/brand-hub/colors.mock.json';

export type BrandHubColorRole =
  | 'brand-solid'
  | 'primary'
  | 'secondary'
  | 'surface'
  | 'subtle'
  | 'success'
  | 'warning'
  | 'danger';

export interface BrandHubColor {
  id: string;
  name: string;
  hex: string;
  role: BrandHubColorRole;
}

export interface BrandHubColorGroup {
  id: string;
  label: string;
  colorIds: string[];
}

export interface BrandHubColorsMock {
  groups: BrandHubColorGroup[];
  colors: BrandHubColor[];
}

export const MockBrandHubColors: BrandHubColorsMock = mock as BrandHubColorsMock;
