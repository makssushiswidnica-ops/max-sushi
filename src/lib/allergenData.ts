import { AllergenKey } from '@/types';

/**
 * Базова офіційна карта алергенів для страв Maks Sushi
 * складена згідно з офіційною таблицею ресторану
 */
export const DEFAULT_PRODUCT_ALLERGENS: Record<string, AllergenKey[]> = {
  // Mini Maki
  'maki-losos': ['fish'],
  'maki-tunczyk': ['fish'],
  'maki-krewetka': ['crustaceans'],
  'maki-krab': ['gluten', 'crustaceans', 'eggs', 'fish', 'soy', 'mustard'],
  'maki-ogorek': ['milk', 'sesame'],
  'maki-awokado': ['gluten', 'soy', 'sesame', 'sulphites'],
  'maki-wegorz': ['gluten', 'fish', 'soy', 'sulphites'],
  'maki-tykwa': ['soy'],
  'maki-rzodkiew': [],
  'maki-tempura': ['gluten', 'crustaceans', 'mustard'],

  // Futomaki
  'futomaki-banzai': ['gluten', 'crustaceans', 'eggs', 'fish', 'soy', 'mustard'],
  'futomaki-losos': ['fish', 'milk'],
  'futomaki-tunczyk': ['gluten', 'fish', 'peanuts', 'soy', 'mustard', 'sesame'],
  'futomaki-tokio': ['crustaceans', 'fish'],
  'futomaki-bangkok': ['crustaceans', 'soy'],
  'futomaki-wegan': ['soy'],
  'futomaki-kurama': ['fish', 'soy'],
  'futomaki-osmiornica': ['gluten', 'mustard', 'molluscs'],

  // Lux Rolki
  'lux-filadelfia-losos': ['gluten', 'fish', 'soy', 'milk'],
  'lux-filadelfia-tunczyk': ['gluten', 'fish', 'peanuts', 'soy', 'milk', 'mustard', 'sesame'],
  'lux-zloty-smok': ['gluten', 'fish', 'soy', 'milk', 'sesame', 'sulphites'],
  'lux-zielony-smok': ['gluten', 'fish', 'soy', 'milk', 'sesame', 'sulphites'],
  'lux-krolewski-smok': ['crustaceans', 'milk'],
  'lux-favorite': ['gluten', 'crustaceans', 'fish'],
  'lux-fila-lux': ['gluten', 'crustaceans', 'eggs', 'fish', 'soy', 'milk', 'mustard'],
  'lux-mikado': ['crustaceans', 'fish', 'milk'],
  'lux-mango-fila': ['fish', 'milk'],
  'lux-kanada': ['gluten', 'fish', 'soy', 'sesame', 'sulphites'],
  'lux-azuma': ['gluten', 'eggs', 'fish', 'soy', 'milk', 'sulphites'],
  'lux-okinawa': ['gluten', 'crustaceans', 'fish', 'soy', 'sulphites'],
  'lux-komaki': ['fish', 'milk'],
  'lux-matsue': ['fish', 'milk', 'sesame'],
  'lux-sunrise': ['fish', 'milk'],

  // Rolki
  'rolki-kalifornia-krewetki': ['crustaceans', 'milk', 'sesame'],
  'rolki-czarna-kalifornia': ['fish', 'milk', 'sesame'],
  'rolki-kalifornia-tunczyk-sezam': ['fish', 'milk', 'sesame'],
  'rolki-kalifornia-tunczyk-masago': ['gluten', 'fish', 'soy'],
  'rolki-kalifornia-light': ['gluten', 'fish', 'soy', 'milk'],
  'rolki-kalifornia-masago': ['gluten', 'crustaceans', 'eggs', 'fish', 'soy', 'mustard'],
  'rolki-sniezny-krab': ['gluten', 'crustaceans', 'eggs', 'fish', 'soy', 'mustard', 'sesame'],
  'rolki-cheese-light': ['fish', 'milk'],
  'rolki-cheese-ami': ['milk', 'molluscs'],
  'rolki-miami': ['milk', 'sesame', 'molluscs'],
  'rolki-bonito': ['fish', 'milk'],
  'rolki-laguna-red': ['gluten', 'crustaceans', 'fish', 'soy', 'milk'],
  'rolki-rock-n-roll': ['gluten', 'fish', 'soy', 'milk', 'sesame', 'sulphites'],
  'rolki-lawa-tunczyk': ['gluten', 'fish', 'peanuts', 'soy', 'milk', 'mustard', 'sesame'],
  'rolki-lawa-losos': ['gluten', 'fish', 'soy', 'milk'],
  'rolki-kalifornia-losos-masago': ['gluten', 'fish', 'soy'],
  'rolki-kalifornia-tunczyk-tempura': ['gluten', 'fish', 'soy', 'mustard'],
  'rolki-hanami': ['soy', 'milk', 'sesame'],
  'rolki-miyako': ['gluten', 'crustaceans', 'milk', 'sesame'],

  // Pieczone Rolki
  'pieczone-kamikaze': ['milk', 'molluscs'],
  'pieczone-pieczony-krab': ['gluten', 'crustaceans', 'eggs', 'fish', 'soy', 'milk', 'mustard'],
  'pieczone-pieczona-fila': ['fish', 'milk'],
  'pieczone-japonia': ['crustaceans', 'eggs', 'milk'],
  'pieczone-lawa-katana': ['gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk', 'mustard', 'sesame'],
  'pieczone-lawa-oni': ['gluten', 'crustaceans', 'eggs', 'fish', 'soy', 'milk', 'mustard'],

  // Rolki w Tempurze
  'tempura-krab': ['gluten', 'crustaceans', 'eggs', 'fish', 'soy', 'milk', 'mustard'],
  'tempura-losos': ['gluten', 'fish', 'soy', 'milk'],
  'tempura-fudzi': ['gluten', 'crustaceans', 'fish', 'soy'],
  'tempura-tunczyk': ['gluten', 'fish', 'peanuts', 'soy', 'milk', 'mustard', 'sesame'],
  'tempura-aloha-nami': ['gluten', 'crustaceans', 'fish', 'soy'],

  // Burgery
  'burger-salmon': ['gluten', 'fish', 'soy', 'milk', 'sesame', 'sulphites'],
  'burger-tuna': ['gluten', 'fish', 'peanuts', 'soy', 'milk', 'mustard', 'sesame'],
  'burger-morski': ['gluten', 'crustaceans', 'eggs', 'fish', 'soy', 'nuts', 'mustard'],
  'burger-shrimp': ['gluten', 'crustaceans', 'eggs', 'peanuts', 'soy', 'milk', 'mustard', 'sesame'],
  'burger-tecza': ['gluten', 'fish', 'soy', 'sesame'],
  'burger-wege': ['gluten', 'soy', 'sesame'],

  // Poke Bowl
  'poke-losos': ['gluten', 'fish', 'soy', 'sesame'],
  'poke-tunczyk': ['gluten', 'fish', 'soy', 'sesame'],
  'poke-krewetki': ['gluten', 'crustaceans', 'soy', 'sesame'],

  // Przekąski
  'krewetki-tempurze': ['gluten', 'crustaceans', 'mustard'],
  'kalmar-tempurze': ['gluten', 'mustard', 'molluscs'],
  'salatka-wakame': ['soy', 'sesame'],
  'duze-spring-rolls': ['gluten', 'soy', 'sesame'],
  'gyoza-z-miesem': ['gluten', 'soy', 'sesame'],
  'gyoza-z-kurczakiem': ['gluten', 'soy', 'sesame'],

  // Zupy
  'miso-zupa': ['gluten', 'soy'],
  'miso-zupa-losos': ['gluten', 'fish', 'soy'],
  'miso-zupa-krewetki': ['gluten', 'crustaceans', 'soy'],

  // Dodatki i sosy
  'sos-sojowy-dodatkowy': ['gluten', 'soy'],
  'sos-unagi': ['gluten', 'soy', 'sulphites'],
  'sos-teriyaki': ['gluten', 'soy'],
  'sos-sriracha-mayo': ['gluten', 'peanuts', 'soy', 'mustard', 'sesame'],
  'sos-ponzu': ['gluten', 'soy'],
  'sos-mango-jalapeno': [],
  'wasabi-dodatkowy': ['mustard'],
  'imbir-dodatkowy': [],
};

