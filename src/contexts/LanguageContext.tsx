import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'ar' | 'en';

const translations = {
  ar: {
    storeName: 'HMK STORE',
    home: 'الرئيسية',
    orders: 'الطلبات',
    vip: 'VIP',
    profile: 'الملف',
    topUpGames: 'شحن الألعاب',
    searchGames: 'ابحث عن لعبة...',
    allGames: 'الكل',
    uidGame: 'UID لعبة',
    loginGame: 'لعبة دخول',
    other: 'أخرى',
    limitedEvent: 'عرض محدود',
    topUpNow: 'اشحن الآن واحصل على سكينات حصرية!',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    phone: 'رقم الهاتف (مثال: 01012345678)',
    password: 'كلمة المرور',
    noAccount: 'ليس لديك حساب؟',
    hasAccount: 'لديك حساب بالفعل؟',
    accountCreated: 'تم إنشاء الحساب!',
    canSignIn: 'يمكنك تسجيل الدخول الآن.',
    error: 'خطأ',
    staffPortal: 'بوابة الموظفين',
    signOut: 'تسجيل الخروج',
    adminDashboard: 'لوحة الإدارة',
    manageOrders: 'إدارة الطلبات والمناوبة',
    ownerDashboard: 'لوحة المالك',
    manageUsers: 'إدارة المستخدمين والأدوار',
    onDuty: 'في المناوبة',
    offDuty: 'خارج المناوبة',
    approve: 'قبول',
    reject: 'رفض',
    viewReceipt: 'عرض الإيصال',
    uidCopied: 'تم نسخ UID!',
    pending: 'قيد الانتظار',
    approved: 'مقبول',
    rejected: 'مرفوض',
    loading: 'جار التحميل...',
    noOrders: 'لا توجد طلبات بعد',
    yourOrders: 'طلباتك',
    customerReviews: 'آراء العملاء',
    addReview: 'أضف تقييم',
    reviewName: 'الاسم',
    reviewText: 'نص التقييم',
    submit: 'إرسال',
    cancel: 'إلغاء',
    socialLinks: 'تابعنا',
    mostRequested: 'الأكثر طلباً',
    termsConditions: 'الشروط والأحكام',
    privacyPolicy: 'سياسة الخصوصية',
    copyright: '© 2026 HMK STORE',
    vipZone: 'منطقة VIP',
    vipLocked: 'اشحن 250 ماسة أو أكثر لفتح العضوية',
    vipBenefits: 'مزايا العضوية',
    vipBenefit1: 'أدلة سكينات منخفضة التكلفة',
    vipBenefit2: 'تسريبات وأخبار حصرية',
    vipBenefit3: 'أدلة ألعاب مفصلة',
    vipProgress: 'التقدم نحو VIP',
    diamonds: 'ماسة',
    selectServer: 'اختر السيرفر',
    playerUid: 'UID اللاعب',
    zone: 'المنطقة',
    nextPackage: 'التالي: اختر الباقة',
    nextPayment: 'التالي: الدفع',
    paymentMethod: 'طريقة الدفع',
    requestTransfer: 'طلب رقم التحويل',
    uploadReceipt: 'ارفع إيصال الدفع',
    submitOrder: 'إرسال الطلب',
    availableAdmin: 'المسؤول المتاح',
    transferTo: 'حوّل إلى',
    back: 'رجوع',
    close: 'إغلاق',
    userManagement: 'إدارة المستخدمين',
    enterPhone: 'أدخل رقم الهاتف',
    assignAdmin: 'تعيين كمسؤول',
    removeAdmin: 'إزالة المسؤول',
    reviews: 'التقييمات',
    addCustomerReview: 'أضف تقييم عميل',
    platform: 'المنصة',
    rating: 'التقييم',
    accessDenied: 'تم رفض الوصول',
    adminRequired: 'مطلوب صلاحية مسؤول',
    ownerRequired: 'مطلوب صلاحية مالك',
  },
  en: {
    storeName: 'HMK STORE',
    home: 'Home',
    orders: 'Orders',
    vip: 'VIP',
    profile: 'Profile',
    topUpGames: 'Top Up Games',
    searchGames: 'Search games...',
    allGames: 'All',
    uidGame: 'UID Game',
    loginGame: 'Login Game',
    other: 'Other',
    limitedEvent: 'Limited Event',
    topUpNow: 'Top up now & unlock exclusive skins!',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    phone: 'Phone number (e.g. 01012345678)',
    password: 'Password',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    accountCreated: 'Account created!',
    canSignIn: 'You can now sign in.',
    error: 'Error',
    staffPortal: 'Staff Portal',
    signOut: 'Sign Out',
    adminDashboard: 'Admin Dashboard',
    manageOrders: 'Manage orders & go on duty',
    ownerDashboard: 'Owner Dashboard',
    manageUsers: 'Manage users & roles',
    onDuty: 'On Duty',
    offDuty: 'Off Duty',
    approve: 'Approve',
    reject: 'Reject',
    viewReceipt: 'View Receipt',
    uidCopied: 'UID Copied!',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    loading: 'Loading...',
    noOrders: 'No orders yet',
    yourOrders: 'Your Orders',
    customerReviews: 'Customer Reviews',
    addReview: 'Add Review',
    reviewName: 'Name',
    reviewText: 'Review text',
    submit: 'Submit',
    cancel: 'Cancel',
    socialLinks: 'Follow Us',
    mostRequested: 'Most Requested',
    termsConditions: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
    copyright: '© 2026 HMK STORE',
    vipZone: 'VIP Zone',
    vipLocked: 'Top up 250 Diamonds or more to unlock membership',
    vipBenefits: 'Membership Benefits',
    vipBenefit1: 'Detailed low-cost skin guides',
    vipBenefit2: 'Exclusive leaks & news',
    vipBenefit3: 'Detailed game guides',
    vipProgress: 'Progress to VIP',
    diamonds: 'Diamonds',
    selectServer: 'Select Server',
    playerUid: 'Player UID',
    zone: 'Zone',
    nextPackage: 'Next: Choose Package',
    nextPayment: 'Next: Payment',
    paymentMethod: 'Payment Method',
    requestTransfer: 'Request Transfer Number',
    uploadReceipt: 'Upload Payment Receipt',
    submitOrder: 'Submit Order',
    availableAdmin: 'Available Admin',
    transferTo: 'Transfer to',
    back: 'Back',
    close: 'Close',
    userManagement: 'User Management',
    enterPhone: 'Enter phone number',
    assignAdmin: 'Assign Admin',
    removeAdmin: 'Remove Admin',
    reviews: 'Reviews',
    addCustomerReview: 'Add Customer Review',
    platform: 'Platform',
    rating: 'Rating',
    accessDenied: 'Access Denied',
    adminRequired: 'Admin role required',
    ownerRequired: 'Owner role required',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  t: (key: TranslationKey) => string;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('hmk-lang') as Lang) || 'ar';
  });

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    localStorage.setItem('hmk-lang', lang);
  }, [lang, dir]);

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations.en[key] || key;
  };

  const toggleLang = () => setLang(prev => (prev === 'ar' ? 'en' : 'ar'));

  return (
    <LanguageContext.Provider value={{ lang, dir, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
};
