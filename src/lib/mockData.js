export const REGIONS = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
]

export const CATEGORIES = [
  'Antibiotics', 'Analgesics', 'Cardiovascular', 'Diabetes',
  'Respiratory', 'Gastrointestinal', 'Vitamins & Supplements',
  'Antiretrovirals', 'Psychiatric', 'Other'
]

export const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 299,
    period: 'per month',
    features: [
      'Post unlimited stock listings',
      'Contact other pharmacies via WhatsApp & email',
      'Filter and search the full marketplace',
      'Be discovered by pharmacies in your region',
    ],
    highlight: false,
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 2900,
    period: 'per year',
    badge: 'Save 17%',
    features: [
      'Post unlimited stock listings',
      'Contact other pharmacies via WhatsApp & email',
      'Filter and search the full marketplace',
      'Be discovered by pharmacies in your region',
    ],
    highlight: true,
  },
]
