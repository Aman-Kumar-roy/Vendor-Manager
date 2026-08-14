export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  iconName: 'LayoutDashboard' | 'Users' | 'BarChart2' | 'ShoppingCart' | 'Receipt';
  badge?: string;
  badgeColor?: 'brand' | 'emerald' | 'amber';
  isPlaceholder?: boolean;
}

export const navigationConfig: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    iconName: 'LayoutDashboard',
  },
  {
    id: 'sellers',
    label: 'Sellers',
    path: '/sellers',
    iconName: 'Users',
    badge: 'Core',
    badgeColor: 'brand',
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/reports',
    iconName: 'BarChart2',
    badge: 'New',
    badgeColor: 'emerald',
  },
  {
    id: 'orders',
    label: 'Orders',
    path: '/orders',
    iconName: 'ShoppingCart',
    isPlaceholder: true,
  },
  {
    id: 'receipts',
    label: 'Receipts',
    path: '/receipts',
    iconName: 'Receipt',
  },
];
