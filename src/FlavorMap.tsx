/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Utensils,
  Sparkles,
  Search,
  Filter,
  Flame,
  Droplets,
  Clock,
  Thermometer,
  ChevronRight,
  Info,
  CheckCircle2,
  Share2,
  Compass,
  Layers,
  ArrowRight,
  HelpCircle,
  Eye,
  Plus
} from 'lucide-react';

export interface FlavorConnection {
  dishId: string;
  blendId: string;
  affinity: number; // 1 to 5
  rule: string;
  ruleEn?: string;
  ruleEs?: string;
}

export interface DishProfile {
  id: string;
  name: string;
  nameEn: string;
  nameEs: string;
  category: 'pescados' | 'carnes' | 'sobremesas' | 'brunch' | 'asiatica' | 'saladas' | 'digestivo';
  icon: string;
  color: string;
  bgLight: string;
  bgDark: string;
  dishes: string[];
  dishesEn: string[];
  sensoryDesire: string;
  sensoryDesireEn: string;
}

export interface TeaBlendProfile {
  id: string;
  name: string;
  category: string;
  categoryType: 'preto' | 'verde' | 'infusao' | 'rooibos' | 'branco' | 'matcha';
  color: string;
  borderHex: string;
  caffeine: string;
  tagline: string;
  taglineEn: string;
  imageUrl: string;
  sensory: {
    intensity: number;
    acidity: number;
    sweetness: number;
    freshness: number;
    body: number;
  };
  brewTemp: string;
  brewTime: string;
  keyNotes: string[];
  sommelierPairing: string;
  sommelierPairingEn: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA: Dish Profiles & Gastronomy Nodes
// ─────────────────────────────────────────────────────────────────────────────
export const DISH_PROFILES: DishProfile[] = [
  {
    id: 'pescados',
    name: 'Pescados & Frutos do Mar',
    nameEn: 'Seafood & Light Fish',
    nameEs: 'Pescados y Mariscos',
    category: 'pescados',
    icon: '🐟',
    color: '#3B82F6',
    bgLight: 'bg-blue-50/80 hover:bg-blue-100/90 border-blue-200 text-blue-900',
    bgDark: 'dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:border-blue-800 dark:text-blue-200',
    dishes: ['Sushis & Sashimis', 'Ceviche de Robalo', 'Salmão Grelhado', 'Ostras Frescas', 'Frutos do Mar Salteados'],
    dishesEn: ['Sushi & Sashimi', 'Sea Bass Ceviche', 'Grilled Salmon', 'Fresh Oysters', 'Sautéed Seafood'],
    sensoryDesire: 'Frescor vegetal mineral, notas cítricas e adstringência zero para preservar a doçura natural do iodo marinho.',
    sensoryDesireEn: 'Vegetal mineral crispness and zero harsh tannins to safeguard delicate ocean sweetness.'
  },
  {
    id: 'carnes',
    name: 'Carnes Nobres & Massas Densas',
    nameEn: 'Prime Meats & Rich Pastas',
    nameEs: 'Carnes Nobles y Pastas Densas',
    category: 'carnes',
    icon: '🥩',
    color: '#8B2635',
    bgLight: 'bg-rose-50/80 hover:bg-rose-100/90 border-rose-200 text-rose-950',
    bgDark: 'dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:border-rose-800 dark:text-rose-200',
    dishes: ['Filé Mignon ao Poivre', 'Costela Assada', 'Risoto de Funghi Porcini', 'Ragù de Ossobuco', 'Massas Recheadas com Queijo'],
    dishesEn: ['Beef Mignon au Poivre', 'Slow-Roasted Ribs', 'Porcini Mushroom Risotto', 'Ossobuco Ragù', 'Cheese Stuffed Pastas'],
    sensoryDesire: 'Estrutura tânica marcante e acidez cítrica nobre para cortar a gordura do prato e limpar as papilas gustativas.',
    sensoryDesireEn: 'Sturdy tannic backbone and bright citrus notes to cut rich fats and refresh the palate.'
  },
  {
    id: 'sobremesas',
    name: 'Sobremesas & Confeitaria Fina',
    nameEn: 'Desserts & Fine Pastry',
    nameEs: 'Postres y Repostería Fina',
    category: 'sobremesas',
    icon: '🍰',
    color: '#C48021',
    bgLight: 'bg-amber-50/80 hover:bg-amber-100/90 border-amber-200 text-amber-950',
    bgDark: 'dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:border-amber-800 dark:text-amber-200',
    dishes: ['Torta de Maçã (Apple Pie)', 'Fondue de Chocolate 70%', 'Mil-folhas de Baunilha', 'Tiramisù Artesanal', 'Pudim e Doces de Colher'],
    dishesEn: ['Warm Apple Pie', 'Dark Chocolate Fondue', 'Vanilla Mille-feuille', 'Craft Tiramisù', 'Crème Caramel & Custards'],
    sensoryDesire: 'Notas aveludadas de amêndoas, canela, frutas vermelhas ou baunilha para harmonizar por semelhança ou contraste.',
    sensoryDesireEn: 'Velvety toasted almond, spice, or berries notes that echo dessert sweetness or offer tart contrast.'
  },
  {
    id: 'brunch',
    name: 'Brunch, Pães & Queijos Cremosos',
    nameEn: 'Brunch, Bakery & Soft Cheeses',
    nameEs: 'Brunch, Panadería y Quesos Suaves',
    category: 'brunch',
    icon: '🥐',
    color: '#10B981',
    bgLight: 'bg-emerald-50/80 hover:bg-emerald-100/90 border-emerald-200 text-emerald-950',
    bgDark: 'dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:border-emerald-800 dark:text-emerald-200',
    dishes: ['Croissant Amanteigado', 'Ovos Benedict & Mexidos', 'Queijo Brie & Camembert', 'Avocado Toast', 'Geleias e Focaccias'],
    dishesEn: ['Buttery Croissant', 'Eggs Benedict', 'Brie & Camembert', 'Avocado Toast', 'Artisan Sourdough & Jams'],
    sensoryDesire: 'Equilíbrio floral, notas amanteigadas reconfortantes e calor revigorante para a mesa matinal e vespertina.',
    sensoryDesireEn: 'Floral elegance, comforting pastry notes, and invigorating warmth for daytime gatherings.'
  },
  {
    id: 'asiatica',
    name: 'Culinária Asiática & Pratos Aromáticos',
    nameEn: 'Asian Cuisine & Spiced Dishes',
    nameEs: 'Cocina Asiática y Especias',
    category: 'asiatica',
    icon: '🍜',
    color: '#F97316',
    bgLight: 'bg-orange-50/80 hover:bg-orange-100/90 border-orange-200 text-orange-950',
    bgDark: 'dark:bg-orange-950/40 dark:hover:bg-orange-900/50 dark:border-orange-800 dark:text-orange-200',
    dishes: ['Curry Tailandês', 'Pad Thai com Camarão', 'Dim Sum no Vapor', 'Culinária Indiana', 'Tacos & Guacamole'],
    dishesEn: ['Thai Curry', 'Prawn Pad Thai', 'Steamed Dim Sum', 'Indian Spiced Dishes', 'Craft Tacos'],
    sensoryDesire: 'Gengibre picante nobre, capim-limão e notas cítricas para acompanhar o calor das especiarias com refrescância.',
    sensoryDesireEn: 'Zesty noble ginger, lemongrass, and citrus notes that embrace spices with crisp relief.'
  },
  {
    id: 'saladas',
    name: 'Saladas & Gastronomia Vegetal',
    nameEn: 'Salads & Plant-Based Plates',
    nameEs: 'Ensaladas y Cocina Vegetal',
    category: 'saladas',
    icon: '🥗',
    color: '#84CC16',
    bgLight: 'bg-lime-50/80 hover:bg-lime-100/90 border-lime-200 text-lime-950',
    bgDark: 'dark:bg-lime-950/40 dark:hover:bg-lime-900/50 dark:border-lime-800 dark:text-lime-200',
    dishes: ['Salada de Rúcula & Figos', 'Carpaccio de Beterraba', 'Bowls de Quinoa & Grãos', 'Legumes Grelhados', 'Queijos de Cabra Frescos'],
    dishesEn: ['Arugula & Fig Salad', 'Beet Carpaccio', 'Quinoa & Grain Bowls', 'Charred Garden Greens', 'Fresh Goat Cheese'],
    sensoryDesire: 'Acidez frutada brilhante, notas herbáceas doces e tônicas para contrastar com azeites e vinagretes.',
    sensoryDesireEn: 'Crisp fruity acidity and garden herbal notes that contrast vinaigrettes and virgin olive oil.'
  },
  {
    id: 'digestivo',
    name: 'Pós-Refeição & Fechamento de Banquete',
    nameEn: 'Digestif & Evening Rituals',
    nameEs: 'Digestivo y Cierre de Servicio',
    category: 'digestivo',
    icon: '✨',
    color: '#8B5CF6',
    bgLight: 'bg-purple-50/80 hover:bg-purple-100/90 border-purple-200 text-purple-950',
    bgDark: 'dark:bg-purple-950/40 dark:hover:bg-purple-900/50 dark:border-purple-800 dark:text-purple-200',
    dishes: ['Finalização de Almoço Executivo', 'Café & Chá da Tarde', 'Pós-Jantar Romântico', 'Digestivo Sem Álcool', 'Ritual de Relaxamento'],
    dishesEn: ['Executive Lunch Closing', 'Afternoon High Tea', 'Post-Dinner Digestif', 'Non-Alcoholic Closer', 'Sleep & Unwind Ritual'],
    sensoryDesire: 'Ação digestiva comprovada, notas calmantes de camomila, menta e maçã sem sobrecarga de cafeína.',
    sensoryDesireEn: 'Digestive soothing, pure chamomile and mint calmness with zero evening caffeine overload.'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA: Talchá Blends & Sensory Profiles
// ─────────────────────────────────────────────────────────────────────────────
export const TEA_BLENDS: TeaBlendProfile[] = [
  {
    id: 'earl-grey',
    name: 'Earl Grey Especial',
    category: 'Chá Preto',
    categoryType: 'preto',
    color: '#8B2635',
    borderHex: '#A32F40',
    caffeine: 'Cafeína Alta',
    tagline: 'Encorpado, cítrico e atemporal',
    taglineEn: 'Full-bodied, citrusy, and timeless',
    imageUrl: '/assets/creamearlgrey-yC8DmIAI.jpg',
    sensory: { intensity: 5, acidity: 3, sweetness: 1, freshness: 3, body: 5 },
    brewTemp: '95°C',
    brewTime: '3-4 min',
    keyNotes: ['Bergamota Natural', 'Ceilão Alta Altitude', 'Tostado'],
    sommelierPairing: 'Corta com precisão a untuosidade de carnes, risotos densos e queijos curados.',
    sommelierPairingEn: 'Precisely cuts fatty profiles of meats, dense risottos, and aged cheeses.'
  },
  {
    id: 'cherry-rose',
    name: 'Cherry Rose',
    category: 'Chá Verde',
    categoryType: 'verde',
    color: '#2E6B34',
    borderHex: '#3D8C46',
    caffeine: 'Cafeína Moderada',
    tagline: 'Sencha nobre, pétalas de rosa e flor de cerejeira',
    taglineEn: 'Noble Sencha, rose petals, and sakura cherry notes',
    imageUrl: '/assets/cha-verde-cherry-rose-talcha-D4nTpJYj.jpg',
    sensory: { intensity: 2, acidity: 2, sweetness: 3, freshness: 5, body: 2 },
    brewTemp: '75°C - 80°C',
    brewTime: '2-3 min',
    keyNotes: ['Sencha Japonês', 'Pétalas de Rosa', 'Cereja Doce'],
    sommelierPairing: 'Casamento clássico com sushi, salmão defumado, saladas finas e brunch folhado.',
    sommelierPairingEn: 'Classic pairing with sushi, smoked salmon, fine salads, and brunch pastries.'
  },
  {
    id: 'doce-amendoa',
    name: 'Doce Amêndoa',
    category: 'Infusão de Frutas',
    categoryType: 'infusao',
    color: '#C48021',
    borderHex: '#E09B36',
    caffeine: 'Sem Cafeína (0%)',
    tagline: 'Maçã caramelizada, canela e amêndoas laminadas',
    taglineEn: 'Baked apple, aromatic cinnamon, and toasted almonds',
    imageUrl: '/assets/doceamendoa-BlMYaqBT.jpg',
    sensory: { intensity: 3, acidity: 1, sweetness: 5, freshness: 1, body: 4 },
    brewTemp: '100°C',
    brewTime: '5-8 min',
    keyNotes: ['Maçã Caramelizada', 'Amêndoas Tostadas', 'Canela'],
    sommelierPairing: 'Harmonização por semelhança com tortas quentes, chocolates e confeitaria artesanal.',
    sommelierPairingEn: 'Harmonious affinity with warm pies, chocolates, and artisan pastries.'
  },
  {
    id: 'vermelho-intenso',
    name: 'Vermelho Intenso',
    category: 'Infusão Frutas Silvestres',
    categoryType: 'infusao',
    color: '#A02C3D',
    borderHex: '#C53C51',
    caffeine: 'Sem Cafeína (0%)',
    tagline: 'Hibisco nobre, morango, framboesa e maçã',
    taglineEn: 'Noble hibiscus, wild strawberry, raspberry, and apple',
    imageUrl: '/assets/vermelho-intenso-talcha-BCZZNWYz.jpg',
    sensory: { intensity: 4, acidity: 5, sweetness: 2, freshness: 4, body: 3 },
    brewTemp: '100°C',
    brewTime: '5-6 min',
    keyNotes: ['Hibisco Rubro', 'Frutas Vermelhas', 'Acidez Cítrica'],
    sommelierPairing: 'Contraste vívido com sobremesas cremosas, queijos de cabra e excelente como Iced Tea gastronômico.',
    sommelierPairingEn: 'Vibrant contrast with creamy desserts, goat cheese, and remarkable as culinary Iced Tea.'
  },
  {
    id: 'gengibre-fresh',
    name: 'Gengibre Fresh',
    category: 'Infusão Digestiva',
    categoryType: 'infusao',
    color: '#658C36',
    borderHex: '#7EAE44',
    caffeine: 'Sem Cafeína (0%)',
    tagline: 'Gengibre picante, capim-limão e hortelã fresca',
    taglineEn: 'Zesty ginger, lemongrass, and crisp garden mint',
    imageUrl: '/assets/infusaofrescor-DEKs3cbB.jpg',
    sensory: { intensity: 4, acidity: 3, sweetness: 1, freshness: 5, body: 2 },
    brewTemp: '100°C',
    brewTime: '5-6 min',
    keyNotes: ['Gengibre Raiz', 'Capim-Limão', 'Hortelã'],
    sommelierPairing: 'Companheiro perfeito de pratos tailandeses, ceviches picantes e digestivo pós-almoço.',
    sommelierPairingEn: 'Ideal companion for Thai dishes, zesty ceviches, and after-meal digestive relief.'
  },
  {
    id: 'rooibos-equilibrio',
    name: 'Rooibos Equilíbrio',
    category: 'Rooibos Sul-Africano',
    categoryType: 'rooibos',
    color: '#9E5B32',
    borderHex: '#BF6E3D',
    caffeine: 'Sem Cafeína (0%)',
    tagline: 'Arbusto de Cederberg com notas de mel e aveludadas',
    taglineEn: 'Cederberg herbal bush with honey and comforting velvet notes',
    imageUrl: '/assets/talcha_b2b_servir-Df2AfCVZ.jpg',
    sensory: { intensity: 3, acidity: 1, sweetness: 3, freshness: 2, body: 3 },
    brewTemp: '95°C',
    brewTime: '4-5 min',
    keyNotes: ['Mel Silvestre', 'Madeira Nobre', 'Baunilha Natural'],
    sommelierPairing: 'Aquece o paladar com aves grelhadas, pães artesanais, queijos suaves e final de noite.',
    sommelierPairingEn: 'Warms the palate alongside poultry, sourdough bread, soft cheeses, and late-night service.'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA: Sensory Pairing Links (Matrix)
// ─────────────────────────────────────────────────────────────────────────────
export const FLAVOR_CONNECTIONS: FlavorConnection[] = [
  // Pescados
  { dishId: 'pescados', blendId: 'cherry-rose', affinity: 5, rule: 'Harmonização por Frescor: o Sencha vegetal não amarga com o iodo do peixe cru.' },
  { dishId: 'pescados', blendId: 'vermelho-intenso', affinity: 4, rule: 'Contraste Cítrico: excelente servido gelado ao lado de ceviches e frutos do mar.' },
  { dishId: 'pescados', blendId: 'gengibre-fresh', affinity: 4, rule: 'Limpeza de Paladar: o gengibre realça o frescor de peixes brancos e marinadas.' },

  // Carnes
  { dishId: 'carnes', blendId: 'earl-grey', affinity: 5, rule: 'Corte Tânico: a bergamota cítrica e taninos do Ceilão cortam a gordura de carnes nobres.' },
  { dishId: 'carnes', blendId: 'rooibos-equilibrio', affinity: 4, rule: 'Aveludado Terroso: notas amadeiradas do Rooibos casam com risotos e queijos curados.' },

  // Sobremesas
  { dishId: 'sobremesas', blendId: 'doce-amendoa', affinity: 5, rule: 'Harmonização por Semelhança: maçã, canela e amêndoas formam uma sobremesa líquida.' },
  { dishId: 'sobremesas', blendId: 'vermelho-intenso', affinity: 5, rule: 'Harmonização por Contraste: a acidez vívida do hibisco equilibra sobremesas muito doces.' },
  { dishId: 'sobremesas', blendId: 'earl-grey', affinity: 4, rule: 'Clássico com Chocolate: a bergamota eleva a profundidade do cacau 70%.' },

  // Brunch
  { dishId: 'brunch', blendId: 'cherry-rose', affinity: 5, rule: 'Elegância Matinal: perfume de rosas e chá verde abraçam queijo brie e croissants.' },
  { dishId: 'brunch', blendId: 'earl-grey', affinity: 5, rule: 'Café da Manhã Nobre: combina com pães na chapa, manteigas e ovos beneditinos.' },
  { dishId: 'brunch', blendId: 'rooibos-equilibrio', affinity: 4, rule: 'Sem Teína para Famílias: sabor aveludado para compor brunches prolongados.' },

  // Asiática
  { dishId: 'asiatica', blendId: 'gengibre-fresh', affinity: 5, rule: 'Potencialização Aromática: o capim-limão e gengibre dançam com o tempero asiático.' },
  { dishId: 'asiatica', blendId: 'cherry-rose', affinity: 4, rule: 'Neutralizador de Picância: chá verde fresco equilibra o calor do chilli e wasabi.' },

  // Saladas
  { dishId: 'saladas', blendId: 'cherry-rose', affinity: 5, rule: 'Harmonia Herbal: folhas jovens de Sencha casam com rúcula, brotos e queijo de cabra.' },
  { dishId: 'saladas', blendId: 'vermelho-intenso', affinity: 4, rule: 'Contraste de Cor & Acidez: substitui o vinho rosé com requinte e frescor antioxidante.' },

  // Digestivo
  { dishId: 'digestivo', blendId: 'gengibre-fresh', affinity: 5, rule: 'Digestivo Consagrado: gengibre e menta aceleram a sensação de leveza após refeições.' },
  { dishId: 'digestivo', blendId: 'doce-amendoa', affinity: 4, rule: 'Acalento Sem Cafeína: fechamento reconfortante de refeições em noites frias.' },
  { dishId: 'digestivo', blendId: 'rooibos-equilibrio', affinity: 4, rule: 'Equilíbrio e Sono: minerais naturais da África do Sul para o descanso pleno do cliente.' }
];

export function FlavorMap({
  onSelectBlendForCarta,
  onOpenLeadModal
}: {
  onSelectBlendForCarta?: (blendId: string) => void;
  onOpenLeadModal?: (interestType?: string, recommendedTeaName?: string) => void;
}) {
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [selectedBlendId, setSelectedBlendId] = useState<string | null>('cherry-rose');
  const [hoveredDishId, setHoveredDishId] = useState<string | null>(null);
  const [hoveredBlendId, setHoveredBlendId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'network' | 'radar'>('network');
  const [teaFilter, setTeaFilter] = useState<'all' | 'preto' | 'verde' | 'infusao' | 'rooibos'>('all');

  // Filtered lists
  const filteredBlends = useMemo(() => {
    return TEA_BLENDS.filter((blend) => {
      if (teaFilter !== 'all' && blend.categoryType !== teaFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = blend.name.toLowerCase().includes(q);
        const matchesTagline = blend.tagline.toLowerCase().includes(q);
        const matchesNotes = blend.keyNotes.some(k => k.toLowerCase().includes(q));
        const matchesPairing = blend.sommelierPairing.toLowerCase().includes(q);
        return matchesName || matchesTagline || matchesNotes || matchesPairing;
      }
      return true;
    });
  }, [teaFilter, searchQuery]);

  const filteredDishes = useMemo(() => {
    if (!searchQuery.trim()) return DISH_PROFILES;
    const q = searchQuery.toLowerCase();
    return DISH_PROFILES.filter((dish) => {
      const matchesName = dish.name.toLowerCase().includes(q);
      const matchesDishes = dish.dishes.some(d => d.toLowerCase().includes(q));
      return matchesName || matchesDishes;
    });
  }, [searchQuery]);

  // Active active connections
  const activeDish = hoveredDishId || selectedDishId;
  const activeBlend = hoveredBlendId || selectedBlendId;

  const connectedBlendIds = useMemo(() => {
    if (!activeDish) return new Set<string>();
    return new Set(
      FLAVOR_CONNECTIONS.filter(c => c.dishId === activeDish).map(c => c.blendId)
    );
  }, [activeDish]);

  const connectedDishIds = useMemo(() => {
    if (!activeBlend) return new Set<string>();
    return new Set(
      FLAVOR_CONNECTIONS.filter(c => c.blendId === activeBlend).map(c => c.dishId)
    );
  }, [activeBlend]);

  // Selected item details
  const activeBlendObj = useMemo(() => {
    return TEA_BLENDS.find(b => b.id === (selectedBlendId || 'cherry-rose')) || TEA_BLENDS[0];
  }, [selectedBlendId]);

  const activeDishObj = useMemo(() => {
    return DISH_PROFILES.find(d => d.id === selectedDishId) || null;
  }, [selectedDishId]);

  // Current pair connection rule
  const currentPairConnection = useMemo(() => {
    if (selectedDishId && selectedBlendId) {
      return FLAVOR_CONNECTIONS.find(c => c.dishId === selectedDishId && c.blendId === selectedBlendId);
    }
    return null;
  }, [selectedDishId, selectedBlendId]);

  // Layout positions for SVG curves (Desktop baseline 900x560)
  const svgWidth = 900;
  const svgHeight = 560;
  const leftX = 230;
  const rightX = 670;

  const dishYPositions = useMemo(() => {
    const total = DISH_PROFILES.length;
    const step = (svgHeight - 60) / (total - 1);
    const map: Record<string, number> = {};
    DISH_PROFILES.forEach((d, idx) => {
      map[d.id] = 30 + idx * step;
    });
    return map;
  }, []);

  const blendYPositions = useMemo(() => {
    const total = TEA_BLENDS.length;
    const step = (svgHeight - 60) / (total - 1);
    const map: Record<string, number> = {};
    TEA_BLENDS.forEach((b, idx) => {
      map[b.id] = 30 + idx * step;
    });
    return map;
  }, []);

  return (
    <div id="talcha-flavormap-scope" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 select-none">
      {/* ─────────────────────────────────────────────────────────────────────
          HEADER & CONTEXT
      ───────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#EAE3D6] dark:border-[#2C2721]">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8B2635] dark:text-[#E88E9B] mb-1.5">
            <Compass className="w-4 h-4" />
            <span>Guia Sommelier B2B · Inteligência Sensorial</span>
          </div>
          <h2 className="font-serif-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E1B18] dark:text-[#FAF8F5] tracking-tight">
            Mapa de Sabores & Harmonização
          </h2>
          <p className="text-sm sm:text-base text-[#6E675C] dark:text-[#B3A99B] mt-2 max-w-2xl leading-relaxed">
            Conecte perfis gastronômicos aos terroirs e blends da Talchá. Descubra como a acidez, corpo e taninos
            das folhas nobres transformam a experiência do cliente em salão.
          </p>
        </div>

        {/* Action Toggle: Network vs Radar */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 bg-[#F3ECE1]/80 dark:bg-[#1E1B17] p-1 rounded-2xl border border-[#DDD5C7] dark:border-[#383229]">
          <button
            type="button"
            onClick={() => setActiveTab('network')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'network'
                ? 'bg-white dark:bg-[#2C2620] text-[#1E1B18] dark:text-[#FAF8F5] shadow-xs'
                : 'text-[#6E675C] dark:text-[#9E9588] hover:text-[#1E1B18] dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#8B2635]" />
            <span>Rede de Conexões</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'radar'
                ? 'bg-white dark:bg-[#2C2620] text-[#1E1B18] dark:text-[#FAF8F5] shadow-xs'
                : 'text-[#6E675C] dark:text-[#9E9588] hover:text-[#1E1B18] dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C48021]" />
            <span>Radar Sensorial</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          FILTER CONTROLS & SEARCH BAR
      ───────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Tea Category Segmented Filter */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F5EFE6] dark:bg-[#1E1B17] rounded-xl border border-[#E0D7C8] dark:border-[#362F27]">
          {[
            { id: 'all', label: 'Todos os Blends' },
            { id: 'preto', label: 'Chás Pretos' },
            { id: 'verde', label: 'Chás Verdes' },
            { id: 'infusao', label: 'Infusões Sem Cafeína' },
            { id: 'rooibos', label: 'Rooibos' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTeaFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                teaFilter === tab.id
                  ? 'bg-white dark:bg-[#2B2520] text-[#1E1B18] dark:text-[#FAF8F5] shadow-xs font-semibold'
                  : 'text-[#6B6459] dark:text-[#A39B8F] hover:text-[#1E1B18] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-[#8A8175] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar prato, ingrediente ou blend..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#1C1815] border border-[#DDD5C7] dark:border-[#383229] rounded-xl text-[#1E1B18] dark:text-[#FAF8F5] placeholder-[#9E9588] focus:outline-none focus:ring-1 focus:ring-[#8B2635]"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 1: INTERACTIVE SVG NETWORK GRAPH (Desktop) + ADAPTIVE CARDS (Mobile)
      ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'network' && (
        <div className="relative">
          {/* Desktop SVG Canvas Viewport (>= 1024px) */}
          <div className="hidden lg:block relative bg-[#FAF7F2] dark:bg-[#14120F] rounded-3xl border border-[#E8DFCFC0] dark:border-[#2C2620] p-6 shadow-sm overflow-hidden">
            {/* Background Texture & Ambient Gradient */}
            <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-transparent pointer-events-none" />

            {/* Column Labels */}
            <div className="grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-[#736B5E] dark:text-[#A89E8F] mb-4 px-2">
              <div className="col-span-4 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-[#8B2635]" />
                <span>1. Perfil Gastronômico do Prato</span>
              </div>
              <div className="col-span-4 text-center">
                <span>2. Matriz de Afinidade & Regra Sommelier</span>
              </div>
              <div className="col-span-4 text-right flex items-center justify-end gap-1.5">
                <span>3. Blend Talchá Indicado</span>
                <Sparkles className="w-4 h-4 text-[#C48021]" />
              </div>
            </div>

            {/* Main Interactive Stage */}
            <div className="relative h-[560px] w-full">
              {/* SVG Layer for Dynamic Bezier Connection Curves */}
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  {/* Gradients for glowing links */}
                  <linearGradient id="grad-active" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B2635" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#C48021" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#2E6B34" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="grad-default" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8A8175" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8A8175" stopOpacity="0.25" />
                  </linearGradient>
                  <filter id="glow-link" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Render Curves */}
                {FLAVOR_CONNECTIONS.map((conn) => {
                  const y1 = dishYPositions[conn.dishId];
                  const y2 = blendYPositions[conn.blendId];
                  if (y1 === undefined || y2 === undefined) return null;

                  const isDishActive = activeDish === conn.dishId;
                  const isBlendActive = activeBlend === conn.blendId;
                  const isDirectPair = isDishActive && isBlendActive;
                  const isHighlighted = isDishActive || isBlendActive;

                  const cp1x = leftX + (rightX - leftX) * 0.45;
                  const cp2x = leftX + (rightX - leftX) * 0.55;
                  const pathData = `M ${leftX} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${rightX} ${y2}`;

                  return (
                    <g key={`${conn.dishId}-${conn.blendId}`}>
                      {/* Glow background on active */}
                      {isHighlighted && (
                        <path
                          d={pathData}
                          fill="none"
                          stroke={isDirectPair ? '#8B2635' : '#C48021'}
                          strokeWidth={isDirectPair ? 5 : 3.5}
                          strokeOpacity={0.4}
                          filter="url(#glow-link)"
                        />
                      )}
                      {/* Main Stroke */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={
                          isDirectPair
                            ? 'url(#grad-active)'
                            : isHighlighted
                            ? '#8B2635'
                            : 'url(#grad-default)'
                        }
                        strokeWidth={isDirectPair ? 3.5 : isHighlighted ? 2.5 : 1.2}
                        strokeDasharray={isHighlighted ? 'none' : '4 4'}
                        className="transition-all duration-300"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Left Column: Dish Profiles (Interactive HTML nodes) */}
              <div className="absolute left-0 top-0 bottom-0 w-[220px] flex flex-col justify-between z-10">
                {DISH_PROFILES.map((dish) => {
                  const isSelected = selectedDishId === dish.id;
                  const isConnected = connectedDishIds.has(dish.id);
                  const isHovered = hoveredDishId === dish.id;

                  return (
                    <button
                      key={dish.id}
                      type="button"
                      onClick={() => {
                        setSelectedDishId(isSelected ? null : dish.id);
                      }}
                      onMouseEnter={() => setHoveredDishId(dish.id)}
                      onMouseLeave={() => setHoveredDishId(null)}
                      className={`relative w-full text-left px-3.5 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isSelected || isHovered
                          ? 'border-[#8B2635] bg-white dark:bg-[#251E1A] shadow-md ring-2 ring-[#8B2635]/20 scale-102 z-20'
                          : isConnected
                          ? 'border-[#C48021]/60 bg-white/90 dark:bg-[#1E1916] shadow-xs'
                          : 'border-[#E5DDD0] dark:border-[#332C24] bg-white/70 dark:bg-[#1A1613] opacity-80 hover:opacity-100 hover:border-[#8B2635]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl shrink-0" role="img" aria-label={dish.name}>
                          {dish.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-[#1E1B18] dark:text-[#FAF8F5] truncate leading-tight">
                            {dish.name}
                          </h4>
                          <p className="text-[10px] text-[#787166] dark:text-[#A89E8F] truncate mt-0.5">
                            {dish.dishes[0]}, {dish.dishes[1]}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#8B2635] shrink-0 animate-pulse" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Center Column: Live Sommelier Pairing Rule Card */}
              <div className="absolute left-[245px] right-[245px] top-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-4 z-20 pointer-events-none">
                {currentPairConnection ? (
                  <div className="bg-white/95 dark:bg-[#201B17]/95 backdrop-blur-md rounded-2xl border-2 border-[#8B2635] shadow-xl p-4 max-w-sm text-center animate-in zoom-in-95 duration-200 pointer-events-auto">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8B2635]/10 text-[#8B2635] dark:text-[#E88E9B] text-[10px] font-bold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3 h-3" />
                      <span>Afinidade Sommelier {currentPairConnection.affinity * 20}%</span>
                    </div>
                    <p className="text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] leading-relaxed">
                      "{currentPairConnection.rule}"
                    </p>
                    <div className="mt-2 text-[10px] text-[#736B5E] dark:text-[#A89E8F]">
                      Clique no blend à direita para adicionar à sua carta B2B.
                    </div>
                  </div>
                ) : activeDish ? (
                  <div className="bg-white/90 dark:bg-[#201B17]/90 backdrop-blur-md rounded-2xl border border-[#DDD5C7] dark:border-[#383229] shadow-md p-3.5 max-w-xs text-center pointer-events-auto">
                    <div className="text-[11px] font-bold text-[#8B2635] dark:text-[#E88E9B] uppercase tracking-wider mb-1">
                      {activeDishObj?.name}
                    </div>
                    <p className="text-[11px] text-[#554E45] dark:text-[#C5BAAC] leading-snug">
                      {activeDishObj?.sensoryDesire}
                    </p>
                    <span className="block mt-1.5 text-[10px] text-[#8A8175]">
                      {connectedBlendIds.size} blends recomendados no catálogo
                    </span>
                  </div>
                ) : (
                  <div className="bg-white/80 dark:bg-[#1E1916]/80 backdrop-blur-sm rounded-2xl border border-[#E0D8CB] dark:border-[#332C24] p-3 text-center max-w-xs">
                    <Info className="w-4 h-4 text-[#8B2635] mx-auto mb-1" />
                    <p className="text-[11px] text-[#6E675C] dark:text-[#A89E8F] leading-snug">
                      Passe o cursor sobre um <strong>prato</strong> ou <strong>blend</strong> para iluminar a conexão sensorial direta.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Tea Blends (Interactive HTML nodes) */}
              <div className="absolute right-0 top-0 bottom-0 w-[220px] flex flex-col justify-between z-10">
                {TEA_BLENDS.map((blend) => {
                  const isSelected = selectedBlendId === blend.id;
                  const isConnected = connectedBlendIds.has(blend.id);
                  const isHovered = hoveredBlendId === blend.id;

                  return (
                    <button
                      key={blend.id}
                      type="button"
                      onClick={() => {
                        setSelectedBlendId(blend.id);
                      }}
                      onMouseEnter={() => setHoveredBlendId(blend.id)}
                      onMouseLeave={() => setHoveredBlendId(null)}
                      className={`relative w-full text-left px-3.5 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isSelected || isHovered
                          ? 'border-[#2E6B34] bg-white dark:bg-[#1A261D] shadow-md ring-2 ring-[#2E6B34]/20 scale-102 z-20'
                          : isConnected
                          ? 'border-[#8B2635]/60 bg-white/90 dark:bg-[#221B1A] shadow-xs'
                          : 'border-[#E5DDD0] dark:border-[#332C24] bg-white/70 dark:bg-[#1A1613] opacity-80 hover:opacity-100 hover:border-[#2E6B34]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={blend.imageUrl}
                          alt={blend.name}
                          className="w-8 h-8 rounded-xl object-cover shrink-0 border border-[#DDD5C7] dark:border-[#383229]"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-[#1E1B18] dark:text-[#FAF8F5] truncate leading-tight">
                            {blend.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#787166] dark:text-[#A89E8F] truncate mt-0.5">
                            <span className="font-semibold text-[#8B2635] dark:text-[#E88E9B]">
                              {blend.category}
                            </span>
                            <span>·</span>
                            <span>{blend.brewTemp}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#2E6B34] shrink-0 animate-pulse" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile View (< 1024px): Responsive Interactive Matrix */}
          <div className="lg:hidden space-y-4">
            <div className="bg-[#FAF7F2] dark:bg-[#181412] p-4 rounded-2xl border border-[#DDD5C7] dark:border-[#332C24]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#8B2635] mb-2 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                <span>1. Escolha o Perfil do seu Prato</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DISH_PROFILES.map((dish) => {
                  const isSelected = selectedDishId === dish.id;
                  return (
                    <button
                      key={dish.id}
                      type="button"
                      onClick={() => setSelectedDishId(isSelected ? null : dish.id)}
                      className={`p-2.5 rounded-xl text-left border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-[#8B2635] bg-white dark:bg-[#251E1A] font-bold shadow-xs'
                          : 'border-[#E0D7C8] dark:border-[#332C24] bg-white/70 dark:bg-[#1E1A16]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{dish.icon}</span>
                        <span className="truncate">{dish.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Matching Blends for Mobile */}
            <div className="bg-[#FAF7F2] dark:bg-[#181412] p-4 rounded-2xl border border-[#DDD5C7] dark:border-[#332C24]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2E6B34] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>2. Blends Harmonizados Recomendados</span>
              </div>
              <div className="space-y-2">
                {filteredBlends.map((blend) => {
                  const isSelected = selectedBlendId === blend.id;
                  const isMatched = selectedDishId ? connectedBlendIds.has(blend.id) : true;

                  if (!isMatched && selectedDishId) return null;

                  return (
                    <button
                      key={blend.id}
                      type="button"
                      onClick={() => setSelectedBlendId(blend.id)}
                      className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#2E6B34] bg-white dark:bg-[#1A261D] shadow-sm ring-1 ring-[#2E6B34]'
                          : 'border-[#E0D7C8] dark:border-[#332C24] bg-white/70 dark:bg-[#1E1A16]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={blend.imageUrl}
                          alt={blend.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div>
                          <div className="font-bold text-xs text-[#1E1B18] dark:text-[#FAF8F5]">
                            {blend.name}
                          </div>
                          <div className="text-[11px] text-[#736C60] dark:text-[#A89E8F]">
                            {blend.category} · {blend.brewTemp}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#2E6B34]' : 'text-[#8A8175]'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 2: RADAR SENSORIAL COMPARATIVO (SVG Polygon 5 Axes)
      ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'radar' && (
        <div className="bg-[#FAF7F2] dark:bg-[#14120F] rounded-3xl border border-[#E8DFCFC0] dark:border-[#2C2620] p-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* SVG Radar Chart (col-span-7) */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#736B5E] dark:text-[#A89E8F] mb-4">
                Pentágono Sensorial: {activeBlendObj.name}
              </h3>

              <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]">
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  {/* Grid Polygons (Levels 1 to 5) */}
                  {[1, 2, 3, 4, 5].map((level) => {
                    const r = (level / 5) * 140;
                    const center = 200;
                    const points = [0, 1, 2, 3, 4].map((i) => {
                      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                    }).join(' ');

                    return (
                      <polygon
                        key={level}
                        points={points}
                        fill="none"
                        stroke="#DDD4C5"
                        strokeWidth={level === 5 ? '1.5' : '1'}
                        strokeDasharray={level < 5 ? '3 3' : 'none'}
                        className="dark:stroke-[#383128]"
                      />
                    );
                  })}

                  {/* 5 Axis Radial Lines */}
                  {[0, 1, 2, 3, 4].map((i) => {
                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                    const x2 = 200 + 140 * Math.cos(angle);
                    const y2 = 200 + 140 * Math.sin(angle);
                    return (
                      <line
                        key={i}
                        x1="200"
                        y1="200"
                        x2={x2}
                        y2={y2}
                        stroke="#DDD4C5"
                        strokeWidth="1"
                        className="dark:stroke-[#383128]"
                      />
                    );
                  })}

                  {/* Blend Profile Polygon Data */}
                  {(() => {
                    const center = 200;
                    const maxR = 140;
                    const s = activeBlendObj.sensory;
                    const values = [
                      s.intensity / 5,
                      s.acidity / 5,
                      s.sweetness / 5,
                      s.freshness / 5,
                      s.body / 5
                    ];

                    const pts = values.map((val, i) => {
                      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                      const r = val * maxR;
                      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                    }).join(' ');

                    return (
                      <g>
                        <polygon
                          points={pts}
                          fill="#8B2635"
                          fillOpacity="0.25"
                          stroke="#8B2635"
                          strokeWidth="2.5"
                          className="animate-in fade-in duration-300"
                        />
                        {values.map((val, i) => {
                          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                          const r = val * maxR;
                          const cx = center + r * Math.cos(angle);
                          const cy = center + r * Math.sin(angle);
                          return (
                            <circle
                              key={i}
                              cx={cx}
                              cy={cy}
                              r="4.5"
                              fill="#FAF8F5"
                              stroke="#8B2635"
                              strokeWidth="2"
                            />
                          );
                        })}
                      </g>
                    );
                  })()}

                  {/* Axis Text Labels */}
                  {[
                    { label: 'Intensidade', x: 200, y: 35, anchor: 'middle' },
                    { label: 'Acidez', x: 355, y: 150, anchor: 'start' },
                    { label: 'Doçura', x: 295, y: 360, anchor: 'middle' },
                    { label: 'Frescor', x: 105, y: 360, anchor: 'middle' },
                    { label: 'Corpo', x: 45, y: 150, anchor: 'end' }
                  ].map((axis, i) => (
                    <text
                      key={i}
                      x={axis.x}
                      y={axis.y}
                      textAnchor={axis.anchor as any}
                      className="text-[11px] font-bold fill-[#554E44] dark:fill-[#C2B7A8]"
                    >
                      {axis.label}
                    </text>
                  ))}
                </svg>
              </div>
            </div>

            {/* Blend Selector & Sensory Metrics Breakdown (col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#736B5E] dark:text-[#A89E8F]">
                Selecione o Blend para Analisar
              </div>

              <div className="grid grid-cols-2 gap-2">
                {TEA_BLENDS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBlendId(b.id)}
                    className={`p-2.5 rounded-xl text-left border text-xs transition-all ${
                      selectedBlendId === b.id
                        ? 'border-[#8B2635] bg-white dark:bg-[#251E1A] font-bold text-[#8B2635] dark:text-[#FAF8F5] shadow-xs'
                        : 'border-[#E0D7C8] dark:border-[#332C24] bg-white/70 dark:bg-[#1E1A16] text-[#554E44] dark:text-[#C5BAAC]'
                    }`}
                  >
                    <div className="truncate">{b.name}</div>
                    <div className="text-[10px] text-[#8A8175] truncate mt-0.5">{b.category}</div>
                  </button>
                ))}
              </div>

              {/* Progress Bars for Sensory Dimensions */}
              <div className="bg-white/80 dark:bg-[#1C1815]/90 rounded-2xl border border-[#E0D8CB] dark:border-[#332C24] p-4 space-y-2.5">
                {[
                  { key: 'intensity', label: 'Intensidade Aromática', val: activeBlendObj.sensory.intensity, hex: '#B91C1C' },
                  { key: 'acidity', label: 'Acidez & Vivacidade', val: activeBlendObj.sensory.acidity, hex: '#D97706' },
                  { key: 'sweetness', label: 'Doçura Natural', val: activeBlendObj.sensory.sweetness, hex: '#059669' },
                  { key: 'freshness', label: 'Frescor & Notas Herbais', val: activeBlendObj.sensory.freshness, hex: '#0D9488' },
                  { key: 'body', label: 'Corpo & Estrutura Tânica', val: activeBlendObj.sensory.body, hex: '#78350F' }
                ].map((item) => (
                  <div key={item.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#554E44] dark:text-[#C2B7A8] font-medium">{item.label}</span>
                      <span className="font-bold text-[#1E1B18] dark:text-[#FAF8F5]">{item.val} / 5</span>
                    </div>
                    <div className="w-full bg-[#EFE9DF] dark:bg-[#2B2520] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(item.val / 5) * 100}%`, backgroundColor: item.hex }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          DETAIL CARD: ACTIVE SELECTED BLEND & SOMMELIER RECOMMENDATION
      ───────────────────────────────────────────────────────────────────── */}
      <div className="mt-8 bg-gradient-to-br from-white via-[#FCFAF7] to-[#F7EFE6] dark:from-[#1E1916] dark:via-[#1A1613] dark:to-[#161310] rounded-3xl border border-[#DDD3C2] dark:border-[#382E25] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          {/* Blend Info Left */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={activeBlendObj.imageUrl}
              alt={activeBlendObj.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-sm border border-[#DDD3C2] dark:border-[#382E25] shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#706B62] dark:text-[#A89E8F] mb-1">
                <span className="font-bold text-[#8B2635] dark:text-[#E88E9B] uppercase tracking-wider">
                  {activeBlendObj.category}
                </span>
                <span>·</span>
                <span>{activeBlendObj.caffeine}</span>
                <span>·</span>
                <span>{activeBlendObj.brewTemp} por {activeBlendObj.brewTime}</span>
              </div>
              <h3 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#1E1B18] dark:text-[#FAF8F5]">
                {activeBlendObj.name}
              </h3>
              <p className="text-xs sm:text-sm text-[#5C5549] dark:text-[#C5BAAB] mt-1 max-w-xl">
                {activeBlendObj.tagline}. {activeBlendObj.sommelierPairing}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {activeBlendObj.keyNotes.map((note, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-md bg-[#EFE7DC] dark:bg-[#2B231D] text-[#554C40] dark:text-[#DDD1C3] text-[11px] font-medium"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons Right */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 self-stretch sm:self-auto justify-center">
            <button
              type="button"
              onClick={() => {
                onSelectBlendForCarta?.(activeBlendObj.id);
                // Also store in pending carta for instant sync
                try {
                  const stored = localStorage.getItem('talchapidia_pending_carta') || '[]';
                  const arr = JSON.parse(stored);
                  if (!arr.includes(activeBlendObj.id)) {
                    arr.push(activeBlendObj.id);
                    localStorage.setItem('talchapidia_pending_carta', JSON.stringify(arr));
                  }
                } catch (e) {}
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar à Carta B2B</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenLeadModal?.('amostra', activeBlendObj.name);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#DDD3C2] dark:border-[#382E25] bg-white dark:bg-[#251E1A] text-[#1E1B18] dark:text-[#FAF8F5] hover:bg-black/5 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Solicitar Amostra Olfativa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlavorMap;
