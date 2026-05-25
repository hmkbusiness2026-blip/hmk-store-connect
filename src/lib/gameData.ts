import mlbbImg from '@/assets/game-mlbb.jpg';
import hokImg from '@/assets/game-hok.jpg';

export interface Game {
  id: string;
  name: string;
  nameAr: string;
  image: string;
  slug: string;
  category: 'uid' | 'login' | 'other';
}

export interface PackageItem {
  id: string;
  name: string;
  price: number;
  popular?: boolean;
  diamonds?: number;
}

export interface PackageCategory {
  category: string;
  packages: PackageItem[];
}

export const games: Game[] = [
  { id: 'hok', name: 'Honor of Kings', nameAr: 'هونر أوف كينجز', image: hokImg, slug: 'honor-of-kings', category: 'other' },
  { id: 'mlbb', name: 'Mobile Legends', nameAr: 'موبايل ليجندز', image: mlbbImg, slug: 'mobile-legends', category: 'uid' },
];

export interface ServerOption {
  id: string;
  labelAr: string;
  labelEn: string;
}

export const arabicServers: ServerOption[] = [
  { id: 'global', labelAr: 'عالمي', labelEn: 'Global' },
  { id: 'indonesian', labelAr: 'اندونيسي', labelEn: 'Indonesian' },
  { id: 'philippine', labelAr: 'فلبيني', labelEn: 'Philippine' },
  { id: 'turkish', labelAr: 'تركي', labelEn: 'Turkish' },
  { id: 'malaysian', labelAr: 'ماليزي', labelEn: 'Malaysian' },
  { id: 'singaporean', labelAr: 'سنغافوري', labelEn: 'Singaporean' },
  { id: 'american', labelAr: 'امريكي', labelEn: 'American' },
];

export const mlbbServers = [
  'Global', 'Indonesian', 'Philippines', 'Russian', 'Turkish', 'Malaysian', 'Singaporean',
];

export const mlbbPackages: PackageCategory[] = [
  {
    category: 'Basic Packages',
    packages: [
      { id: 'basic-86', name: '86 Diamonds', price: 75, diamonds: 86 },
      { id: 'basic-172', name: '172 Diamonds', price: 140, diamonds: 172 },
      { id: 'basic-600', name: '600 Diamonds', price: 465, popular: true, diamonds: 600 },
      { id: 'basic-1412', name: '1412 Diamonds', price: 1050, diamonds: 1412 },
      { id: 'basic-2195', name: '2195 Diamonds', price: 1600, diamonds: 2195 },
      { id: 'basic-4830', name: '4830 Diamonds', price: 3500, diamonds: 4830 },
      { id: 'basic-10000', name: '10000 Diamonds', price: 7200, diamonds: 10000 },
      { id: 'basic-30059', name: '30059 Diamonds', price: 22000, diamonds: 30059 },
    ],
  },
  {
    category: 'Weekly',
    packages: [
      { id: 'weekly-1', name: 'Weekly Pass', price: 85 },
      { id: 'weekly-3', name: '3 Weekly Pass', price: 250 },
    ],
  },
  {
    category: 'Double (First Time)',
    packages: [
      { id: 'double-50', name: '50+50 Diamonds', price: 50, diamonds: 100 },
      { id: 'double-150', name: '150+150 Diamonds', price: 140, diamonds: 300 },
    ],
  },
  {
    category: 'Special Offers',
    packages: [
      { id: 'special-miya', name: 'Miya Subscribe', price: 455 },
      { id: 'special-monthly', name: 'Monthly Bundle', price: 225 },
    ],
  },
];

export const admins = [
  { name: 'Mostafa', transferNumber: '01012345678' },
  { name: 'Maryam', transferNumber: '01098765432' },
];
