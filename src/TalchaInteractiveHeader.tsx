import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  Bell,
  BookOpen,
  Box,
  Calculator,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  FileText,
  Flame,
  Globe,
  MapPin,
  Menu,
  MessageCircle,
  Monitor,
  Moon,
  Network,
  Palette,
  Search,
  Share2,
  Sun,
  User,
  Utensils,
  X,
} from 'lucide-react';

export interface TalchaInteractiveHeaderProps {
  currentMode: string;
  onSelectMode: (mode: string) => void;
  onOpenLeadModal: (interestType?: string, recommendedTeaName?: string) => void;
  onOpenPartnershipModal: () => void;
  onOpenPushModal?: () => void;
  onOpenShareModal?: () => void;
}

interface NavEntry {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  category: 'primary' | 'b2b' | 'lab';
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

interface TeaProduct {
  id: string;
  name: string;
  category: string;
  caffeine?: string;
  profileHeadline?: string;
  keyIngredient?: string;
  foodPairings?: string[];
  brewGuide?: {
    tempC?: string;
    infusionTime?: string;
  };
}

function getBridge(): any {
  return (globalThis as any).__TALCHA_DASHBOARD_BRIDGE__ || {};
}

export default function TalchaInteractiveHeader({
  currentMode,
  onSelectMode,
  onOpenLeadModal,
  onOpenPartnershipModal,
  onOpenPushModal,
  onOpenShareModal,
}: TalchaInteractiveHeaderProps) {
  const bridge = getBridge();
  const langCtx = bridge.useLang ? bridge.useLang() : { t: (k: string) => k, language: 'pt', localize: (pt: string) => pt, setLanguage: () => {}, openLanguageModal: () => {} };
  const themeCtx = bridge.useTheme ? bridge.useTheme() : { mode: 'system', isDark: false, isDayTime: true, setThemeMode: () => {} };
  const authCtx = bridge.useAuth ? bridge.useAuth() : { user: null, setIsAuthModalOpen: () => {} };

  const { t, language, localize, setLanguage, openLanguageModal } = langCtx;
  const { mode: themeMode, isDark, isDayTime, setThemeMode } = themeCtx;
  const { user, setIsAuthModalOpen } = authCtx;

  const tierSvc = bridge.tier;
  const notifSvc = bridge.notifications;
  const audioSvc = bridge.audio;
  const hapticsSvc = bridge.haptics;
  const commercialContact = bridge.storage?.commercialContact || {
    phone: '(11) 92596-3961',
    cleanPhone: '5511925963961',
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'nocaf' | 'preto' | 'verde' | 'infusao'>('all');
  const [hoveredPreviewId, setHoveredPreviewId] = useState<string>('simulador');
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [tier, setTier] = useState(() => (tierSvc?.getCurrentTier ? tierSvc.getCurrentTier() : { name: 'Curador', title: 'Parceiro Talchá' }));
  const [unreadCount, setUnreadCount] = useState(() => (notifSvc?.getUnreadCount ? notifSvc.getUnreadCount() : 0));

  const megaRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const playFeedback = () => {
    try {
      audioSvc?.playClickTone?.();
      hapticsSvc?.light?.();
    } catch {
      // ignore audio/haptic errors
    }
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      setScrolled(y > 20);
      const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollProgress(Math.min(1, Math.max(0, y / docHeight)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        playFeedback();
        setSearchOpen((prev) => !prev);
        setMegaOpen(false);
        setLangOpen(false);
      } else if (e.key === 'Escape') {
        setMegaOpen(false);
        setLangOpen(false);
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (megaOpen && megaRef.current && !megaRef.current.contains(target)) {
        setMegaOpen(false);
      }
      if (langOpen && langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [megaOpen, langOpen]);

  useEffect(() => {
    const unsubTier = tierSvc?.subscribe ? tierSvc.subscribe(() => setTier(tierSvc.getCurrentTier())) : undefined;
    const unsubNotif = notifSvc?.subscribe ? notifSvc.subscribe(() => setUnreadCount(notifSvc.getUnreadCount())) : undefined;
    return () => {
      unsubTier?.();
      unsubNotif?.();
    };
  }, [tierSvc, notifSvc]);

  const navItems: NavEntry[] = useMemo(
    () => [
      {
        id: 'curador',
        label: t('nav.curator') || 'Curador Sensorial',
        shortLabel: t('nav.short.curator') || 'Curador',
        description: t('nav.desc.curator') || 'Descubra o blend ideal por ocasião e gastronomia',
        category: 'primary',
        icon: Compass,
        iconColor: 'text-[#8B2635] dark:text-[#E27D8C]',
      },
      {
        id: 'carta',
        label: t('nav.carta') || 'Carta B2B',
        shortLabel: t('nav.short.carta') || 'Carta B2B',
        description: t('nav.desc.carta') || 'Monte sua carta personalizada e exporte PDF A4',
        category: 'primary',
        icon: FileText,
        iconColor: 'text-[#5B6B46] dark:text-[#88A668]',
      },
      {
        id: 'infusao',
        label: localize('Guia de Infusão & Timers', 'Infusion Guide & Timers', 'Guía de Infusión y Timers'),
        shortLabel: localize('Infusão', 'Infusion', 'Infusión'),
        description: localize('Tempos, temperaturas ideais e temporizadores nativos', 'Ideal steeping times, temperatures & native timers', 'Tiempos, temperaturas ideales y temporizadores'),
        category: 'primary',
        icon: Clock,
        iconColor: 'text-[#B87333] dark:text-[#E5A967]',
      },
      {
        id: 'catalogo',
        label: t('nav.catalog') || 'Catálogo',
        shortLabel: localize('Catálogo', 'Catalog', 'Catálogo'),
        description: localize('Terroirs nobres, fichas técnicas e embalagens B2B', 'Noble terroirs, spec sheets & B2B formats', 'Terroirs nobles, fichas técnicas y envases B2B'),
        category: 'primary',
        icon: BookOpen,
        iconColor: 'text-[#706B63] dark:text-[#C4BCB1]',
      },
      {
        id: 'dashboard',
        label: localize('Dashboard do Estabelecimento', 'Establishment Dashboard', 'Panel del Establecimiento'),
        shortLabel: t('nav.short.dashboard') || 'Dashboard',
        description: localize(
          'Histórico detalhado de cartas de chá criadas e propostas comerciais pendentes',
          'Detailed tea menu history and pending commercial proposals',
          'Historial detallado de cartas de té y propuestas comerciales pendientes'
        ),
        category: 'primary',
        icon: Award,
        iconColor: 'text-[#C48021] dark:text-[#F3BA68]',
      },
      {
        id: 'simulador',
        label: t('nav.simulator') || 'Simulador de Margem',
        shortLabel: t('nav.short.simulator') || 'Margem',
        description: t('nav.desc.simulator') || 'Calcule rentabilidade por xícara acima de 700%',
        category: 'b2b',
        badge: '+700% ROI',
        icon: Calculator,
        iconColor: 'text-[#2E6B34] dark:text-[#6FD47B]',
      },
      {
        id: 'evento',
        label: t('nav.event') || 'Eventos & Corporativo',
        shortLabel: t('nav.short.event') || 'Eventos',
        description: t('nav.desc.event') || 'Estações de chá e ativações sob medida',
        category: 'b2b',
        icon: Flame,
        iconColor: 'text-[#A05C2C] dark:text-[#E08A52]',
      },
      {
        id: 'cardapio',
        label: t('nav.pairing') || 'Harmonização & Cardápio',
        shortLabel: t('nav.short.pairing') || 'Harmonização',
        description: t('nav.desc.pairing') || 'Combine blends autorais com pratos do seu menu',
        category: 'b2b',
        icon: Utensils,
        iconColor: 'text-[#4D6575] dark:text-[#7BA3BE]',
      },
      {
        id: 'ritual_3d',
        label: localize('Mesa Ritual 3D · Vapt Vupt', '3D Tea Ritual · Vapt Vupt', 'Mesa Ritual 3D · Vapt Vupt'),
        shortLabel: localize('Ritual 3D', '3D Ritual', 'Ritual 3D'),
        description: localize('Explore o infusor Vapt Vupt, copo duplo e extração em 360°', 'Inspect the Vapt Vupt brewer and thermal steep in 360°', 'Inspecciona el infusor Vapt Vupt en 360°'),
        category: 'lab',
        badge: '3D WebGL',
        icon: Box,
        iconColor: 'text-[#8B2635] dark:text-[#E88E9B]',
      },
      {
        id: 'mapa_flagship',
        label: localize('Mapa Flagship & Terroirs', 'Flagship & Terroirs Map', 'Mapa Flagship & Terroirs'),
        shortLabel: localize('Mapa B2B', 'B2B Map', 'Mapa B2B'),
        description: localize('Flagship Higienópolis, rotas de entrega e parceiros ao vivo', 'Flagship Higienópolis, B2B routing & live hospitality venues', 'Flagship Higienópolis y rutas B2B'),
        category: 'lab',
        badge: 'Google Maps',
        icon: MapPin,
        iconColor: 'text-[#2E6B34] dark:text-[#6FD47B]',
      },
      {
        id: 'atelie_ia',
        label: localize('Ateliê Sensorial IA', 'Talchá AI Studio', 'Atelier Sensorial IA'),
        shortLabel: localize('Ateliê IA', 'AI Studio', 'Atelier IA'),
        description: localize('Crie visuais editoriais, trilhas para salão e pesquisas B2B', 'Compose editorial visuals, ambient soundtracks & hospitality research', 'Crea visuales, música de salón e investigación'),
        category: 'lab',
        badge: 'Studio IA',
        icon: Palette,
        iconColor: 'text-[#C68A36] dark:text-[#F3D78E]',
      },
      {
        id: 'mapa_sabores',
        label: localize('Mapa de Sabores & Blends', 'Flavor & Blend Map', 'Mapa de Sabores'),
        shortLabel: localize('Sabores', 'Flavors', 'Sabores'),
        description: localize('Grafo interativo de notas aromáticas e harmonizações', 'Interactive graph of aromatic notes and food pairings', 'Grafo interactivo de notas aromáticas y maridajes'),
        category: 'lab',
        badge: 'Grafo',
        icon: Network,
        iconColor: 'text-[#8B2635] dark:text-[#E88E9B]',
      },
    ],
    [t, localize]
  );

  const primaryItems = useMemo(() => navItems.filter((n) => n.category === 'primary'), [navItems]);
  const b2bItems = useMemo(() => navItems.filter((n) => n.category === 'b2b'), [navItems]);
  const labItems = useMemo(() => navItems.filter((n) => n.category === 'lab'), [navItems]);
  const megaItems = useMemo(() => [...b2bItems, ...labItems], [b2bItems, labItems]);

  const activeHoveredItem = useMemo(
    () => megaItems.find((item) => item.id === hoveredPreviewId) || megaItems[0],
    [megaItems, hoveredPreviewId]
  );

  const catalogProducts: TeaProduct[] = useMemo(() => {
    const raw: TeaProduct[] = bridge.catalog?.products || [];
    const locFn = bridge.catalog?.localizeProduct;
    if (!locFn) return raw;
    return raw.map((p) => {
      try {
        return locFn(p, language) || p;
      } catch {
        return p;
      }
    });
  }, [bridge.catalog, language]);

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return navItems.slice(0, 6);
    return navItems.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.shortLabel.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q)
    );
  }, [navItems, searchQuery]);

  const filteredBlends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalogProducts
      .filter((p) => {
        const cat = (p.category || '').toLowerCase();
        const caf = (p.caffeine || '').toLowerCase();
        if (searchFilter === 'nocaf' && !caf.includes('sem')) return false;
        if (searchFilter === 'preto' && !cat.includes('preto')) return false;
        if (searchFilter === 'verde' && !cat.includes('verde') && !cat.includes('matcha')) return false;
        if (searchFilter === 'infusao' && !cat.includes('infus') && !cat.includes('fruta')) return false;
        if (!q) return true;
        const haystack = [
          p.name,
          p.category,
          p.profileHeadline,
          p.keyIngredient,
          ...(p.foodPairings || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 6);
  }, [catalogProducts, searchQuery, searchFilter]);

  const handleNavigate = (modeId: string) => {
    playFeedback();
    onSelectMode(modeId);
    setMobileMenuOpen(false);
    setMegaOpen(false);
    setSearchOpen(false);
  };

  const isMoreActive = megaItems.some((item) => item.id === currentMode);

  return (
    <div id="talcha-interactive-header-scope" className="sticky top-0 z-40 w-full">
      <header
        className={`relative w-full transition-all duration-200 pt-[env(safe-area-inset-top,0px)] border-b ${
          scrolled
            ? 'bg-[#FAF7F2]/95 dark:bg-[#111A15]/95 backdrop-blur-xl border-[#DDD0BC] dark:border-[#2C3E31] shadow-[0_6px_24px_rgba(30,27,24,0.06)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.35)]'
            : 'bg-[#FAF7F2]/90 dark:bg-[#111A15]/90 backdrop-blur-md border-[#EBE4D8] dark:border-[#243328]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
          <div
            className={`flex items-center justify-between gap-3 transition-all duration-200 ${
              scrolled ? 'h-14 sm:h-[64px]' : 'h-15 sm:h-[74px]'
            }`}
          >
            {/* ZONE 1: Brand Mark (Single-Line Wordmark + Interactive Animated Emblem) */}
            <button
              type="button"
              onClick={() => handleNavigate('curador')}
              className="flex items-center gap-2.5 cursor-pointer group shrink-0 min-h-[44px] py-1 select-none text-left whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2635] rounded-lg"
              id="brand-home-link"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1E1B18] dark:bg-[#FAF8F5] text-white dark:text-[#1E1B18] flex items-center justify-center p-1.5 sm:p-2 shadow-xs transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#8B2635] dark:group-hover:bg-[#F3D78E] shrink-0">
                <svg
                  viewBox="0 0 100 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 stroke-white dark:stroke-[#1E1B18] stroke-[5]"
                >
                  <path
                    d="M 12 18 L 88 18 C 84 55, 66 70, 50 70 C 34 70, 16 55, 12 18 Z"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 50 64 C 40 50, 42 34, 52 26 C 62 38, 58 56, 50 64 Z"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="font-serif-editorial text-xl sm:text-2xl font-bold tracking-tight text-[#1E1B18] dark:text-[#FAF8F5] leading-none whitespace-nowrap">
                Talchápidia
              </span>
            </button>

            {/* ZONE 2: Interactive Editorial Navigation Bar + Mega Menu */}
            <nav
              aria-label={localize('Navegação principal', 'Primary navigation', 'Navegación principal')}
              className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0"
            >
              {primaryItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                const active = currentMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    id={`nav-${item.id}`}
                    className={`relative px-2.5 xl:px-3 py-2 text-xs font-medium transition-colors min-h-[40px] flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2635] ${
                      active
                        ? 'text-[#8B2635] dark:text-[#F3D78E] font-semibold bg-[#8B2635]/[0.06] dark:bg-[#F3D78E]/10'
                        : 'text-[#4F4840] dark:text-[#C4BCB1] hover:text-[#1E1B18] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${item.iconColor}`} />
                    <span className="whitespace-nowrap">{item.shortLabel}</span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0.5 left-2.5 right-2.5 h-[2px] rounded-full bg-[#8B2635] dark:bg-[#F3D78E]"
                      />
                    )}
                  </button>
                );
              })}

              {primaryItems.slice(4, 5).map((item) => {
                const Icon = item.icon;
                const active = currentMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    id={`nav-${item.id}`}
                    title={item.label}
                    className={`flex relative px-2.5 xl:px-3 py-2 text-xs font-medium transition-colors min-h-[40px] items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2635] ${
                      active
                        ? 'text-[#8B2635] dark:text-[#F3D78E] font-semibold bg-[#8B2635]/[0.06] dark:bg-[#F3D78E]/10'
                        : 'text-[#4F4840] dark:text-[#C4BCB1] hover:text-[#1E1B18] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${item.iconColor}`} />
                    <span className="whitespace-nowrap">{item.shortLabel}</span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0.5 left-2.5 right-2.5 h-[2px] rounded-full bg-[#8B2635] dark:bg-[#F3D78E]"
                      />
                    )}
                  </button>
                );
              })}

              {/* Interactive Mega-Menu Trigger */}
              <div className="relative" ref={megaRef}>
                <button
                  type="button"
                  id="nav-mega-trigger"
                  onClick={() => {
                    playFeedback();
                    setMegaOpen((prev) => !prev);
                    setLangOpen(false);
                  }}
                  aria-expanded={megaOpen}
                  className={`relative px-2.5 xl:px-3 py-2 text-xs font-medium transition-colors min-h-[40px] flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2635] ${
                    isMoreActive || megaOpen
                      ? 'text-[#8B2635] dark:text-[#F3D78E] font-semibold bg-[#8B2635]/[0.06] dark:bg-[#F3D78E]/10'
                      : 'text-[#4F4840] dark:text-[#C4BCB1] hover:text-[#1E1B18] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="whitespace-nowrap">
                    {localize('Explorar', 'Explore', 'Explorar')}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      megaOpen ? 'rotate-180' : ''
                    }`}
                  />
                  {isMoreActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0.5 left-2.5 right-2.5 h-[2px] rounded-full bg-[#8B2635] dark:bg-[#F3D78E]"
                    />
                  )}
                </button>

                {megaOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[640px] max-w-[92vw] rounded-2xl bg-[#FAF8F5] dark:bg-[#171411] border border-[#DFD2BF] dark:border-[#383028] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="grid grid-cols-12 gap-4">
                      {/* Left 7 cols: B2B + Lab tools */}
                      <div className="col-span-7 space-y-3">
                        <div>
                          <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#706B63] dark:text-[#A8A095]">
                            {localize('Consultoria & Salão B2B', 'B2B Hospitality Suite', 'Consultoría B2B')}
                          </div>
                          <div className="space-y-1">
                            {primaryItems.slice(4, 5).map((item) => {
                              const Icon = item.icon;
                              const active = currentMode === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onMouseEnter={() => setHoveredPreviewId(item.id)}
                                  onClick={() => handleNavigate(item.id)}
                                  className={`xl:hidden w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                                    active
                                      ? 'bg-[#8B2635] text-white font-semibold'
                                      : 'text-[#1E1B18] dark:text-[#FAF8F5] hover:bg-[#EFE7DA] dark:hover:bg-[#25201B]'
                                  }`}
                                >
                                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : item.iconColor}`} />
                                  <span className="truncate flex-1">{item.label}</span>
                                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                                </button>
                              );
                            })}
                            {b2bItems.map((item) => {
                              const Icon = item.icon;
                              const active = currentMode === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onMouseEnter={() => setHoveredPreviewId(item.id)}
                                  onClick={() => handleNavigate(item.id)}
                                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                                    active
                                      ? 'bg-[#8B2635] text-white font-semibold'
                                      : 'text-[#1E1B18] dark:text-[#FAF8F5] hover:bg-[#EFE7DA] dark:hover:bg-[#25201B]'
                                  }`}
                                >
                                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : item.iconColor}`} />
                                  <span className="truncate flex-1">{item.label}</span>
                                  {item.badge && (
                                    <span className={`text-[10px] font-semibold ${active ? 'text-white/90' : 'text-[#2E6B34] dark:text-[#6FD47B]'}`}>
                                      {item.badge}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="border-t border-[#E6DBC9] dark:border-[#2E2720] pt-2.5">
                          <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#706B63] dark:text-[#A8A095]">
                            {localize('Laboratório Experiencial', 'Experiential Lab', 'Laboratorio Experiencial')}
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {labItems.map((item) => {
                              const Icon = item.icon;
                              const active = currentMode === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onMouseEnter={() => setHoveredPreviewId(item.id)}
                                  onClick={() => handleNavigate(item.id)}
                                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                                    active
                                      ? 'bg-[#8B2635] text-white font-semibold'
                                      : 'text-[#1E1B18] dark:text-[#FAF8F5] hover:bg-[#EFE7DA] dark:hover:bg-[#25201B]'
                                  }`}
                                >
                                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : item.iconColor}`} />
                                  <span className="truncate">{item.shortLabel}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right 5 cols: Interactive Live Preview + Quick Actions */}
                      <div className="col-span-5 rounded-xl bg-white dark:bg-[#1F1B17] border border-[#E5DACB] dark:border-[#332B24] p-3.5 flex flex-col justify-between">
                        {activeHoveredItem && (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B2635] dark:text-[#F3D78E]">
                                {activeHoveredItem.badge || localize('Módulo Talchá', 'Talchá Module', 'Módulo Talchá')}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-[#C68A36]" />
                            </div>
                            <h4 className="font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF8F5] leading-snug">
                              {activeHoveredItem.label}
                            </h4>
                            <p className="text-xs text-[#5C564D] dark:text-[#C2B8AA] leading-relaxed">
                              {activeHoveredItem.description}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleNavigate(activeHoveredItem.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B2635] dark:text-[#F3D78E] hover:underline pt-1 cursor-pointer"
                            >
                              <span>{localize('Abrir agora', 'Open now', 'Abrir ahora')}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="border-t border-[#E6DBC9] dark:border-[#2E2720] pt-2.5 mt-3 space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setMegaOpen(false);
                              onOpenPartnershipModal();
                            }}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-[#7A5B2E] dark:text-[#E0BC75] hover:bg-[#FAF5EB] dark:hover:bg-[#2A231B] cursor-pointer"
                          >
                            <span>{localize(`Nível ${tier.name}`, `Tier ${tier.name}`, `Nivel ${tier.name}`)}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMegaOpen(false);
                              onOpenShareModal?.();
                            }}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-[#5C564D] dark:text-[#A8A095] hover:bg-[#FAF5EB] dark:hover:bg-[#2A231B] cursor-pointer"
                          >
                            <span>{localize('Enviar ao Chefe / Diretoria', 'Share with Management', 'Compartir con Dirección')}</span>
                            <Share2 className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B]" />
                          </button>
                          <a
                            href={`https://wa.me/${commercialContact.cleanPhone}?text=Ol%C3%A1!%20Vim%20atrav%C3%A9s%20da%20Talch%C3%A1pidia%20e%20gostaria%20de%20atendimento%20B2B.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMegaOpen(false)}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium text-[#2E6B34] dark:text-[#6FD47B] hover:bg-[#EAF3EA] dark:hover:bg-[#1A2D1C] cursor-pointer"
                          >
                            <span>WhatsApp B2B</span>
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* ZONE 3: Interactive Quick Search, Controls & Primary CTA */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Interactive Quick Search Button (⌘K) */}
              <button
                type="button"
                id="header-search-btn"
                onClick={() => {
                  playFeedback();
                  setSearchOpen(true);
                  setMegaOpen(false);
                }}
                className="flex items-center gap-2 min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#DDD5C7] dark:border-[#38322A] bg-white/85 dark:bg-[#1F1C18] text-xs text-[#5C564D] dark:text-[#C4BCB1] hover:text-[#1E1B18] dark:hover:text-white hover:border-[#C68A36] transition-all cursor-pointer shrink-0 whitespace-nowrap"
                title={localize('Buscar blends e ferramentas (Ctrl+K)', 'Search blends & tools (Ctrl+K)', 'Buscar blends y herramientas (Ctrl+K)')}
                aria-label={localize('Buscar blends e ferramentas', 'Search blends and tools', 'Buscar blends y herramientas')}
              >
                <Search className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#F3D78E] shrink-0" />
                <span className="hidden md:inline font-medium">
                  {localize('Buscar blends...', 'Search blends...', 'Buscar blends...')}
                </span>
                <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-[#F3ECE1] dark:bg-[#2B2620] text-[#706B63] dark:text-[#A8A095] rounded">
                  ⌘K
                </kbd>
              </button>

              {/* Auth Account Button (Desktop XL) */}
              <button
                type="button"
                onClick={() => {
                  playFeedback();
                  setIsAuthModalOpen(true);
                }}
                id="header-auth-btn"
                className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all shrink-0 text-xs font-medium min-h-[38px] cursor-pointer whitespace-nowrap ${
                  user
                    ? 'border-[#2E6B34]/40 bg-[#EAF3EA] dark:bg-[#1A2D1C] text-[#2E6B34] dark:text-[#6FD47B]'
                    : 'border-[#DDD5C7] dark:border-[#38322A] bg-white/85 dark:bg-[#1F1C18] text-[#5C564D] dark:text-[#C4BCB1] hover:text-[#1E1B18] dark:hover:text-white'
                }`}
                title={user ? `${user.email}` : localize('Entrar (Google / Apple)', 'Sign In (Google / Apple)', 'Entrar (Google / Apple)')}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="max-w-[78px] truncate">
                  {user ? user.displayName.split(' ')[0] : localize('Entrar', 'Sign In', 'Entrar')}
                </span>
              </button>

              {/* Interactive Language Switcher */}
              <div className="relative" ref={langRef}>
                <button
                  type="button"
                  id="header-lang-btn"
                  onClick={() => {
                    playFeedback();
                    setLangOpen((prev) => !prev);
                    setMegaOpen(false);
                  }}
                  aria-expanded={langOpen}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#DDD5C7] dark:border-[#38322A] bg-white/85 dark:bg-[#1F1C18] text-xs font-semibold text-[#4A453E] dark:text-[#D4CCC0] hover:border-[#C68A36] min-h-[38px] cursor-pointer"
                  title={localize('Idioma', 'Language', 'Idioma')}
                >
                  <Globe className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B]" />
                  <span className="uppercase text-[11px] font-bold">{language}</span>
                </button>
                {langOpen && (
                  <div className="absolute right-0 mt-1.5 w-32 rounded-xl bg-white dark:bg-[#1E1B18] border border-[#DDD5C7] dark:border-[#383229] shadow-xl p-1 z-50 text-xs">
                    {(['pt', 'en', 'es'] as const).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          playFeedback();
                          setLanguage?.(code);
                          setLangOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                          language === code
                            ? 'bg-[#8B2635] text-white font-semibold'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#1E1B18] dark:text-[#FAF8F5]'
                        }`}
                      >
                        {code === 'pt' ? 'Português' : code === 'en' ? 'English' : 'Español'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications Bell */}
              <button
                type="button"
                onClick={() => {
                  playFeedback();
                  onOpenPushModal?.();
                }}
                className="hidden sm:flex relative min-w-[38px] min-h-[38px] p-2 rounded-lg border border-[#DDD5C7] dark:border-[#38322A] bg-white/85 dark:bg-[#1F1C18] text-[#4A453E] dark:text-[#D4CCC0] hover:border-[#C68A36] transition-all shrink-0 items-center justify-center cursor-pointer"
                aria-label={localize('Alertas de Estoque', 'Stock Alerts', 'Alertas de Stock')}
                title={localize('Alertas de Estoque & Lançamentos', 'Stock & Launch Alerts', 'Alertas de Stock y Lanzamientos')}
                id="header-notification-btn"
              >
                <Bell className="w-4 h-4 text-[#8B2635] dark:text-[#E88E9B]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8B2635] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#12110F] tabular-nums">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Theme Toggle (Compact Cycle on Tablet, 3-Option on XL) */}
              <div
                className="hidden xl:inline-flex items-center shrink-0 rounded-lg bg-[#FAF8F5] dark:bg-[#201D19] border border-[#DDD5C7] dark:border-[#383229] p-0.5 select-none"
                role="group"
                aria-label={localize('Tema', 'Theme', 'Tema')}
              >
                <button
                  type="button"
                  onClick={() => {
                    playFeedback();
                    setThemeMode('system');
                  }}
                  className={`px-1.5 py-1 rounded-md text-xs transition-all flex items-center justify-center cursor-pointer min-h-[30px] ${
                    themeMode === 'system'
                      ? 'bg-[#1E1B18] dark:bg-[#FAF8F5] text-white dark:text-[#1E1B18]'
                      : 'text-[#6E675C] dark:text-[#A8A095] hover:text-[#1E1B18] dark:hover:text-white'
                  }`}
                  title={localize('Tema Automático (Sistema)', 'System Auto Theme', 'Tema Sistema')}
                  aria-pressed={themeMode === 'system'}
                  id="theme-mode-system-btn"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playFeedback();
                    setThemeMode('light');
                  }}
                  className={`px-1.5 py-1 rounded-md text-xs transition-all flex items-center justify-center cursor-pointer min-h-[30px] ${
                    themeMode === 'light'
                      ? 'bg-[#C68A36] text-white'
                      : 'text-[#6E675C] dark:text-[#A8A095] hover:text-[#1E1B18] dark:hover:text-white'
                  }`}
                  title={localize('Modo Claro', 'Light Mode', 'Modo Claro')}
                  aria-pressed={themeMode === 'light'}
                  id="theme-mode-light-btn"
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playFeedback();
                    setThemeMode('dark');
                  }}
                  className={`px-1.5 py-1 rounded-md text-xs transition-all flex items-center justify-center cursor-pointer min-h-[30px] ${
                    themeMode === 'dark'
                      ? 'bg-[#8B2635] text-white'
                      : 'text-[#6E675C] dark:text-[#A8A095] hover:text-[#1E1B18] dark:hover:text-white'
                  }`}
                  title={localize('Modo Escuro', 'Dark Mode', 'Modo Oscuro')}
                  aria-pressed={themeMode === 'dark'}
                  id="theme-mode-dark-btn"
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  playFeedback();
                  setThemeMode(isDark ? 'light' : 'dark');
                }}
                className="xl:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-white/85 dark:bg-[#1F1C18] border border-[#DDD5C7] dark:border-[#383229] text-[#6E675C] dark:text-[#A8A095] shrink-0 cursor-pointer"
                title={localize('Alternar tema', 'Toggle theme', 'Cambiar tema')}
                aria-label={localize('Alternar tema', 'Toggle theme', 'Cambiar tema')}
              >
                {isDark ? <Sun className="w-4 h-4 text-[#F3D78E]" /> : <Moon className="w-4 h-4 text-[#8B2635]" />}
              </button>

              {/* Primary CTA */}
              <button
                type="button"
                onClick={() => {
                  playFeedback();
                  setMobileMenuOpen(false);
                  onOpenLeadModal('especialista');
                }}
                id="header-cta-proposta"
                className="hidden lg:inline-flex items-center px-4 py-2 text-xs font-semibold tracking-wide text-white bg-[#8B2635] hover:bg-[#701D2A] rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0 min-h-[38px] cursor-pointer active:scale-[0.98]"
              >
                <span>{localize('Receber Proposta', 'Get Proposal', 'Recibir Propuesta')}</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => {
                  playFeedback();
                  setMobileMenuOpen((prev) => !prev);
                }}
                className="lg:hidden min-w-[44px] min-h-[44px] p-2 rounded-lg border border-[#DDD5C7] dark:border-[#38322A] bg-white dark:bg-[#221E1A] text-[#1E1B18] dark:text-[#FAF8F5] hover:bg-[#F3ECE1] dark:hover:bg-[#2C2722] transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                aria-label={mobileMenuOpen ? localize('Fechar menu', 'Close menu', 'Cerrar menú') : localize('Abrir menu', 'Open menu', 'Abrir menú')}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Progress Hairline */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8B2635] dark:bg-[#C68A36] origin-left transition-transform duration-150 pointer-events-none"
          style={{ transform: `scaleX(${scrollProgress})` }}
        />

        {/* Interactive Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E8E2D8] dark:border-[#2C2620] bg-[#FAF8F5]/98 dark:bg-[#161311]/98 backdrop-blur-xl animate-in fade-in duration-200 shadow-2xl max-h-[82vh] overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              {/* Mobile Quick Search Bar */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-white dark:bg-[#1F1C18] border border-[#DDD0BC] dark:border-[#383229] text-xs text-[#5C564D] dark:text-[#A8A095] cursor-pointer min-h-[44px]"
              >
                <Search className="w-4 h-4 text-[#8B2635] dark:text-[#F3D78E]" />
                <span>{localize('Buscar blends Talchá, notas ou ferramentas...', 'Search Talchá blends, notes or tools...', 'Buscar blends o herramientas...')}</span>
              </button>

              {/* Mobile Primary & B2B Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = currentMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer min-h-[52px] ${
                        active
                          ? 'bg-[#8B2635] text-white shadow-xs'
                          : 'bg-white dark:bg-[#1F1C18] border border-[#E8E1D5] dark:border-[#332D26] text-[#1E1B18] dark:text-[#FAF8F5]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-white' : item.iconColor}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold truncate">{item.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        </div>
                        <p className={`text-[11px] mt-0.5 line-clamp-1 ${active ? 'text-white/80' : 'text-[#706B63] dark:text-[#A8A095]'}`}>
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Controls (Language, Theme, Actions) */}
              <div className="p-3 rounded-xl bg-white dark:bg-[#1F1C18] border border-[#E8E1D5] dark:border-[#332D26] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5]">
                    {localize('Tema de Exibição', 'Display Theme', 'Tema de Visualización')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openLanguageModal?.();
                    }}
                    className="text-xs font-semibold text-[#8B2635] dark:text-[#F3D78E] underline cursor-pointer"
                  >
                    {localize('Idioma', 'Language', 'Idioma')}: {language.toUpperCase()}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['system', 'light', 'dark'] as const).map((tm) => (
                    <button
                      key={tm}
                      type="button"
                      onClick={() => {
                        playFeedback();
                        setThemeMode(tm);
                      }}
                      className={`py-2 rounded-lg text-xs font-semibold cursor-pointer min-h-[40px] ${
                        themeMode === tm
                          ? 'bg-[#8B2635] text-white'
                          : 'bg-[#FAF5EE] dark:bg-[#2A241E] text-[#5C564D] dark:text-[#C4BCB1]'
                      }`}
                    >
                      {tm === 'system'
                        ? isDayTime
                          ? localize('Sistema (Dia)', 'System (Day)', 'Sistema')
                          : localize('Sistema (Noite)', 'System (Night)', 'Sistema')
                        : tm === 'light'
                        ? localize('Claro', 'Light', 'Claro')
                        : localize('Escuro', 'Dark', 'Oscuro')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLeadModal('especialista');
                  }}
                  className="w-full py-3 rounded-xl bg-[#8B2635] text-white text-xs font-semibold text-center cursor-pointer min-h-[44px]"
                >
                  {localize('Receber Proposta B2B', 'Get B2B Proposal', 'Recibir Propuesta B2B')}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenPushModal?.();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-[#1F1C18] border border-[#DDD0BC] dark:border-[#383229] text-[#8B2635] dark:text-[#E88E9B] cursor-pointer min-h-[44px]"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{localize(`Alertas (${unreadCount})`, `Alerts (${unreadCount})`, `Alertas (${unreadCount})`)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-[#1F1C18] border border-[#DDD0BC] dark:border-[#383229] text-[#1E1B18] dark:text-[#FAF8F5] cursor-pointer min-h-[44px]"
                  >
                    <User className="w-3.5 h-3.5 text-[#2E6B34] dark:text-[#6FD47B]" />
                    <span>{user ? user.displayName.split(' ')[0] : localize('Entrar', 'Sign In', 'Entrar')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Interactive Quick Search / Command Palette Modal (⌘K) */}
      {searchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={localize('Busca Rápida Talchápidia', 'Talchápidia Quick Search', 'Búsqueda Rápida Talchápidia')}
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#0D1410]/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-[#FAF7F2] dark:bg-[#161311] border border-[#DFD2BF] dark:border-[#383028] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Search Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E6DBC9] dark:border-[#2C251F] bg-white dark:bg-[#1C1814]">
              <Search className="w-4 h-4 text-[#8B2635] dark:text-[#F3D78E] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={localize(
                  'Buscar blends (Earl Grey, Matcha, Bergamota...), pratos ou ferramentas...',
                  'Search blends (Earl Grey, Matcha...), dishes or tools...',
                  'Buscar blends, platos o herramientas...'
                )}
                className="flex-1 bg-transparent text-sm text-[#1E1B18] dark:text-[#FAF8F5] placeholder:text-[#8E867B] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#706B63] hover:text-[#1E1B18] dark:hover:text-white px-2 py-1 cursor-pointer"
                >
                  {localize('Limpar', 'Clear', 'Limpiar')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1.5 rounded-lg text-[#706B63] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                aria-label={localize('Fechar busca', 'Close search', 'Cerrar búsqueda')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Category Filter Bar */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#E6DBC9] dark:border-[#2C251F] overflow-x-auto scrollbar-none">
              {(
                [
                  ['all', localize('Todos os Blends', 'All Blends', 'Todos')],
                  ['nocaf', localize('Sem Cafeína', 'Caffeine-Free', 'Sin Cafeína')],
                  ['preto', localize('Chá Preto', 'Black Tea', 'Té Negro')],
                  ['verde', localize('Verde & Matcha', 'Green & Matcha', 'Verde & Matcha')],
                  ['infusao', localize('Infusões & Frutas', 'Herbal & Fruit', 'Infusiones')],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSearchFilter(key)}
                  className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    searchFilter === key
                      ? 'bg-[#8B2635] text-white'
                      : 'bg-white dark:bg-[#221D18] text-[#5C564D] dark:text-[#C4BCB1] border border-[#E5DACB] dark:border-[#332B24] hover:border-[#C68A36]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search Results Body */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
              {/* Matching Blends */}
              {filteredBlends.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#706B63] dark:text-[#A8A095]">
                    {localize('Blends Talchá', 'Talchá Blends', 'Blends Talchá')}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredBlends.map((blend) => (
                      <button
                        key={blend.id}
                        type="button"
                        onClick={() => handleNavigate('catalogo')}
                        className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#1E1A16] border border-[#E6DBC9] dark:border-[#332B24] hover:border-[#8B2635] dark:hover:border-[#C68A36] text-left transition-colors cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] group-hover:text-[#8B2635] dark:group-hover:text-[#F3D78E] truncate">
                            <span>{blend.name}</span>
                          </div>
                          <div className="text-[11px] text-[#706B63] dark:text-[#A8A095] mt-0.5 truncate">
                            {blend.category}
                            {blend.brewGuide?.tempC ? ` · ${blend.brewGuide.tempC}` : ''}
                            {blend.brewGuide?.infusionTime ? ` · ${blend.brewGuide.infusionTime}` : ''}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#C68A36] shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Tools & Experiences */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#706B63] dark:text-[#A8A095]">
                  {localize('Navegação & Ferramentas', 'Navigation & Tools', 'Navegación y Herramientas')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleNavigate(tool.id)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-[#1E1A16] border border-[#E6DBC9] dark:border-[#332B24] hover:border-[#8B2635] text-left transition-colors cursor-pointer"
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${tool.iconColor}`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] truncate">
                            {tool.label}
                          </div>
                          <div className="text-[11px] text-[#706B63] dark:text-[#A8A095] truncate">
                            {tool.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
