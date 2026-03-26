import mlbbImg from '@/assets/game-mlbb.jpg';
import pubgImg from '@/assets/game-pubg.jpg';
import genshinImg from '@/assets/game-genshin.jpg';
import hokImg from '@/assets/game-hok.jpg';
import silkroadImg from '@/assets/game-silkroad.jpg';

export interface Game {
  id: string;
  name: string;
  image: string;
  slug: string;
}

export interface PackageItem {
  id: string;
  name: string;
  price: number;
  popular?: boolean;
}

export interface PackageCategory {
  category: string;
  packages: PackageItem[];
}

export const games: Game[] = [
  { id: 'mlbb', name: 'Mobile Legends', image: mlbbImg, slug: 'mobile-legends' },
  { id: 'pubg', name: 'PUBG Mobile', image: pubgImg, slug: 'pubg-mobile' },
  { id: 'genshin', name: 'Genshin Impact', image: genshinImg, slug: 'genshin-impact' },
  { id: 'hok', name: 'Honor of Kings', image: hokImg, slug: 'honor-of-kings' },
  { id: 'silkroad', name: 'Silkroad Mobile', image: silkroadImg, slug: 'silkroad-mobile' },
];

export const mlbbServers = [
  'Global', 'Indonesian', 'Philippines', 'Russian', 'Turkish', 'Malaysian', 'Singaporean',
];

export const mlbbPackages: PackageCategory[] = [
  {
    category: 'Basic Packages',
    packages: [
      { id: 'basic-86', name: '86 Diamonds', price: 75 },
      { id: 'basic-172', name: '172 Diamonds', price: 140 },
      { id: 'basic-600', name: '600 Diamonds', price: 465, popular: true },
      { id: 'basic-1412', name: '1412 Diamonds', price: 1050 },
      { id: 'basic-2195', name: '2195 Diamonds', price: 1600 },
      { id: 'basic-4830', name: '4830 Diamonds', price: 3500 },
      { id: 'basic-10000', name: '10000 Diamonds', price: 7200 },
      { id: 'basic-30059', name: '30059 Diamonds', price: 22000 },
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
      { id: 'double-50', name: '50+50 Diamonds', price: 50 },
      { id: 'double-150', name: '150+150 Diamonds', price: 140 },
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
