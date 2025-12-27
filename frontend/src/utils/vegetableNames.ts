// Mapping nama sayuran dari English ke Indonesia
export const vegetableNamesId: Record<string, string> = {
  'Bean': 'Kacang Buncis',
  'Bitter_Gourd': 'Pare',
  'Bottle_Gourd': 'Labu Air',
  'Brinjal': 'Terong',
  'Broccoli': 'Brokoli',
  'Cabbage': 'Kubis/Kol',
  'Capsicum': 'Paprika',
  'Carrot': 'Wortel',
  'Cauliflower': 'Kembang Kol',
  'Cucumber': 'Timun',
  'Papaya': 'Pepaya',
  'Potato': 'Kentang',
  'Pumpkin': 'Labu Kuning',
  'Radish': 'Lobak',
  'Tomato': 'Tomat',
  'Unknown vegetable': 'Sayuran tidak dikenali'
}

// Fungsi untuk mendapatkan nama Indonesia
export function getIndonesianName(englishName: string): string {
  // Handle underscore replacement
  const cleanName = englishName.replace(/_/g, '_')
  return vegetableNamesId[cleanName] || englishName.replace(/_/g, ' ')
}

// Fungsi untuk mendapatkan nama English dari Indonesia (reverse lookup)
export function getEnglishName(indonesianName: string): string {
  const entry = Object.entries(vegetableNamesId).find(([_, indo]) => indo === indonesianName)
  return entry ? entry[0] : indonesianName
}
