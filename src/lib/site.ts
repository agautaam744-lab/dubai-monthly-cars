// Central site configuration for shared chrome (footer, legal pages).
//
// IMPORTANT: contact details below reuse only what already exists in the app.
// - Support phone uses placeholder 800-XXXX format.
//   TODO(owner): replace with the real support number before production launch.
// - No company email, address, or social URLs exist in the project, so they are
//   intentionally omitted here. Add them when available — do not invent them.

export const siteConfig = {
  brand: 'Dubai Monthly Cars',
  shortBrand: 'DMC',
  description:
    'Flexible monthly car rental in Dubai. Choose from Basic, Plus or Premium plans with home delivery.',
  // Support phone placeholder - replace with real number before launch
  // TODO(owner): set the real 24/7 support number here and in README.
  supportPhoneDisplay: '800-0000 (24/7)',
  supportPhoneHref: 'tel:+9718000000',
  linkGroups: [
    {
      title: 'Explore',
      links: [
        { label: 'Browse Cars', href: '/cars' },
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'My Bookings', href: '/bookings' },
        { label: 'Watchlist', href: '/watchlist' },
        { label: 'Dashboard', href: '/dashboard' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Support Center', href: '/support' },
        { label: 'Condition Report', href: '/condition-report' },
        { label: 'Damage Report', href: '/damage-report' },
        { label: 'Notifications', href: '/notifications' },
        { label: 'My Profile', href: '/profile' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/how-it-works' },
        { label: 'Contact', href: '/support' },
        { label: 'FAQ', href: '/support' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms & Conditions', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
      ],
    },
  ],
} as const
