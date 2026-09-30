export type Language = 'en' | 'ar'

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.cars': 'Cars',
    'nav.bookings': 'My Bookings',
    'nav.dashboard': 'Dashboard',
    'nav.support': 'Support',
    'nav.profile': 'Profile',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.admin': 'Admin',

    // Hero
    'hero.title1': 'Your Car, Every Month',
    'hero.title2': 'No Strings Attached',
    'hero.subtitle':
      'Flexible 1, 3, 6 or 12 month plans. Home delivery across Dubai. No long-term commitment, no hidden fees.',
    'hero.browse': 'Browse Fleet',
    'hero.howItWorks': 'How It Works',
    'hero.pickupCity': 'Pick-up city',
    'hero.rentalLength': 'Rental length',
    'hero.startDate': 'Start date',
    'hero.search': 'Search Cars',
    'hero.month1': '1 month',
    'hero.month3': '3 months',
    'hero.month6': '6 months',
    'hero.month12': '12 months',
    'hero.cityMarina': 'Dubai Marina',
    'hero.cityDowntown': 'Downtown Dubai',
    'hero.cityAirport': 'Dubai Airport (DXB)',
    'hero.cityBusinessBay': 'Business Bay',

    // Home
    'home.hero.title': 'Monthly Car Rental in Dubai',
    'home.hero.subtitle': 'Subscribe to a car for a month. No daily rates. No hassle.',
    'home.cta.browse': 'Browse Cars',
    'home.cta.learn': 'Learn More',

    // Filters
    'filters.category': 'Category',
    'filters.brand': 'Brand',
    'filters.transmission': 'Transmission',
    'filters.fuel': 'Fuel Type',
    'filters.seats': 'Seats',
    'filters.price': 'Price Range',
    'filters.location': 'Location',
    'filters.apply': 'Apply',
    'filters.reset': 'Reset',

    // Booking
    'booking.duration': 'Rental Duration',
    'booking.tier': 'Pricing Tier',
    'booking.addons': 'Add-ons',
    'booking.delivery': 'Pickup or Delivery',
    'booking.deposit': 'Security Deposit',
    'booking.sign': 'Sign Agreement',
    'booking.pay': 'Pay Now',
    'booking.month': 'month',
    'booking.months': 'months',

    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.next': 'Next',
    'common.back': 'Back',
    'common.language': 'Language',
    'common.theme': 'Theme',
    'common.light': 'Light',
    'common.dark': 'Dark',
    'common.system': 'System',
  },
  ar: {
    // Nav
    'nav.home': 'الرئيسية',
    'nav.cars': 'السيارات',
    'nav.bookings': 'حجوزاتي',
    'nav.dashboard': 'لوحة التحكم',
    'nav.support': 'الدعم',
    'nav.profile': 'الملف الشخصي',
    'nav.login': 'تسجيل الدخول',
    'nav.logout': 'تسجيل الخروج',
    'nav.admin': 'المشرف',

    // Hero
    'hero.title1': 'سيارتك، كل شهر',
    'hero.title2': 'بدون أي التزامات',
    'hero.subtitle':
      'خطط مرنة لمدة شهر أو 3 أو 6 أو 12 شهراً. توصيل مجاني إلى المنزل في جميع أنحاء دبي. بدون التزام طويل الأمد، وبدون رسوم خفية.',
    'hero.browse': 'تصفح الأسطول',
    'hero.howItWorks': 'كيف يعمل',
    'hero.pickupCity': 'مدينة الاستلام',
    'hero.rentalLength': 'مدة الإيجار',
    'hero.startDate': 'تاريخ البدء',
    'hero.search': 'ابحث عن سيارة',
    'hero.month1': 'شهر واحد',
    'hero.month3': '3 أشهر',
    'hero.month6': '6 أشهر',
    'hero.month12': '12 شهراً',
    'hero.cityMarina': 'دبي مارينا',
    'hero.cityDowntown': 'وسط مدينة دبي',
    'hero.cityAirport': 'مطار دبي (DXB)',
    'hero.cityBusinessBay': 'الخليج التجاري',

    // Home
    'home.hero.title': 'تأجير السيارات الشهري في دبي',
    'home.hero.subtitle': 'اشترك في سيارة لمدة شهر. بدون أسعار يومية. بدون متاعب.',
    'home.cta.browse': 'تصفح السيارات',
    'home.cta.learn': 'اعرف المزيد',

    // Filters
    'filters.category': 'الفئة',
    'filters.brand': 'الماركة',
    'filters.transmission': 'ناقل الحركة',
    'filters.fuel': 'نوع الوقود',
    'filters.seats': 'المقاعد',
    'filters.price': 'نطاق السعر',
    'filters.location': 'الموقع',
    'filters.apply': 'تطبيق',
    'filters.reset': 'إعادة تعيين',

    // Booking
    'booking.duration': 'مدة الإيجار',
    'booking.tier': 'فئة التسعير',
    'booking.addons': 'إضافات',
    'booking.delivery': 'الاستلام أو التوصيل',
    'booking.deposit': 'مبلغ التأمين',
    'booking.sign': 'توقيع العقد',
    'booking.pay': 'ادفع الآن',
    'booking.month': 'شهر',
    'booking.months': 'أشهر',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.confirm': 'تأكيد',
    'common.next': 'التالي',
    'common.back': 'السابق',
    'common.language': 'اللغة',
    'common.theme': 'المظهر',
    'common.light': 'فاتح',
    'common.dark': 'داكن',
    'common.system': 'النظام',
  },
}