import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface CartaBlendItem {
  blend: {
    id: string;
    name: string;
    category?: string;
    caffeine?: string;
    keyIngredient?: string;
    profileHeadline?: string;
    foodPairings?: string[];
    brewGuide?: {
      tempC?: string;
      infusionTime?: string;
      servingNote?: string;
    };
  };
  roleInMenu?: string;
  serviceTip?: string;
}

export interface CartaPdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishmentName?: string;
  businessType?: string;
  audienceProfile?: string;
  operatingHours?: string;
  menuHighlights?: string;
  serviceFormat?: string;
  cartaTitle?: string;
  cartaSubtitle?: string;
  strategicRationale?: string;
  language?: 'pt' | 'en' | 'es';
  items: CartaBlendItem[];
  initialMode?: 'executive' | 'customer';
  initialTheme?: 'editorial' | 'clean_print';
  onDownloadPdf?: (opts: {
    mode: 'executive' | 'customer';
    theme: 'editorial' | 'clean_print';
    language: 'pt' | 'en' | 'es';
  }) => Promise<void> | void;
  isDownloading?: boolean;
  hasDownloaded?: boolean;
  showPrintFallbackWhenClosed?: boolean;
}

const TRANSLATIONS = {
  pt: {
    previewHeaderTitle: 'Prévia Editorial A4 da Carta de Chás',
    previewHeaderSub: 'Fiel à diagramação oficial em PDF · 210 × 297 mm',
    modeExecutive: 'Dossiê B2B',
    modeCustomer: 'Cardápio Salão',
    themeEditorial: 'Marfim Editorial',
    themeCleanPrint: 'Impressão Econômica',
    zoomFit: 'Ajustar',
    printBtn: 'Imprimir A4',
    downloadBtn: 'Baixar PDF',
    downloadingBtn: 'Gerando PDF...',
    downloadedBtn: 'PDF Baixado',
    closeLabel: 'Fechar prévia',
    brandSub: 'CHÁS ESPECIAIS & ALTA GASTRONOMIA',
    brandSubLine: 'www.talcha.com.br · Alta Gastronomia & Hotelaria',
    officialBadge: 'DOCUMENTO OFICIAL B2B',
    customerMenuBadge: 'CARTA DE CHÁS ESPECIAIS',
    issuedOn: 'Emissão',
    curationTag: 'Curadoria Sensorial & Arquitetura de Salão',
    partnerVenue: 'Estabelecimento Parceiro',
    defaultEstablishment: 'Estabelecimento Parceiro',
    segment: 'Segmento',
    audience: 'Perfil do Salão',
    operationalParams: 'Parâmetros de Serviço',
    peakHours: 'Operação',
    defaultPeak: 'Almoço & Jantar',
    baseMenu: 'Destaques',
    defaultBase: 'Folhas Inteiras & Infusões',
    vaptVuptDesc: 'Serviço no Infusor Vapt Vupt com amostra olfativa à mesa',
    strategicRationale: 'Conceito Gastronômico da Carta',
    selectedBlends: 'Seleção de Blends Nobres',
    itemsCount: 'chás selecionados',
    continuationSuffix: '(Continuação)',
    extractionAndService: 'Ritual de Infusão',
    pairings: 'Harmoniza com',
    page: 'Página',
    of: 'de',
    footerContact: 'Talchá Chás Especiais · www.talcha.com.br · comercial@talcha.com.br · (11) 92596-3961',
    page2Header: 'Manual de Serviço de Salão & Rentabilidade B2B',
    sec1Title: '1. Engenharia Financeira & Lucratividade no Salão',
    sec1Desc:
      'Os blends de folhas inteiras Talchá entregam a maior margem bruta entre as bebidas quentes e infusões de salão, com dosagem controlada e elevado valor percebido.',
    costPerCup: 'Custo por Dose',
    costPerCupSub: 'Lata Gourmet B2B (60 doses de 2g)',
    suggestedPrice: 'Preço Sugerido em Carta',
    suggestedPriceSub: 'Ticket médio alta gastronomia',
    profitability: 'Rentabilidade Bruta',
    profitabilityVal: '+89% · 720% ROI',
    profitabilitySub: 'Multiplicador médio 9.6x sobre o insumo',
    teaMargin: 'Chá Talchá: ~89%',
    espressoMargin: 'Café Espresso: ~65%',
    wineMargin: 'Vinho em Taça: ~55%',
    beerMargin: 'Cerveja Artesanal: ~50%',
    sec2Title: '2. Protocolo de Serviço à Mesa: Ritual Vapt Vupt',
    ritual1Title: 'Amostra Olfativa',
    ritual1Desc: 'Apresentação dos tubos olfativos para o cliente sentir o aroma seco das folhas.',
    ritual2Title: 'Dosagem 2g',
    ritual2Desc: '1 colher dosadora (2g) de folhas inteiras depositada no infusor cristalino.',
    ritual3Title: 'Extração Precisa',
    ritual3Desc: 'Água na temperatura ideal permitindo expansão livre sem amargor.',
    ritual4Title: 'Serviço por Gravidade',
    ritual4Desc: 'Ao apoiar sobre a xícara, o chá filtra instantaneamente por gravidade.',
    sec3Title: '3. Diferenciais da Parceria Talchá B2B',
    comodatoTitle: 'Infusores em Comodato',
    comodatoDesc: 'Equipamentos Vapt Vupt e tubos olfativos fornecidos conforme volume mensal.',
    trainingTitle: 'Treinamento da Brigada',
    trainingDesc: 'Capacitação presencial ou online de garçons, maîtres e baristas do salão.',
    certificationTitle: 'Origem & Certificações',
    certificationDesc: 'Colheitas de alta altitude, lotes frescos e parcerias Rainforest & Fairtrade.',
    partnersTitle: 'Presente nos Maiores Nomes da Alta Gastronomia e Hotelaria',
    supportTitle: 'Atendimento Comercial B2B Dedicada',
    supportTitleExact: 'Atendimento Comercial B2B Dedicado',
    supportSub: 'Consultoria de Contas · Kit de Amostras & Tabela Corporativa',
    supportDesc: 'Solicite prova sensorial sem compromisso, condições para rede e enxoval personalizado.',
  },
  en: {
    previewHeaderTitle: 'A4 Editorial Tea Menu Preview',
    previewHeaderSub: '1:1 parity with exported PDF output · 210 × 297 mm',
    modeExecutive: 'B2B Dossier',
    modeCustomer: 'Guest Menu',
    themeEditorial: 'Editorial Ivory',
    themeCleanPrint: 'Clean Print',
    zoomFit: 'Fit Width',
    printBtn: 'Print A4',
    downloadBtn: 'Download PDF',
    downloadingBtn: 'Generating PDF...',
    downloadedBtn: 'Downloaded',
    closeLabel: 'Close preview',
    brandSub: 'SPECIALTY TEAS & FINE HOSPITALITY',
    brandSubLine: 'www.talcha.com.br · Fine Dining & Hospitality',
    officialBadge: 'OFFICIAL B2B DOSSIER',
    customerMenuBadge: 'SPECIALTY TEA MENU',
    issuedOn: 'Issued',
    curationTag: 'Sensory Curation & Dining Room Architecture',
    partnerVenue: 'Partner Establishment',
    defaultEstablishment: 'Partner Establishment',
    segment: 'Segment',
    audience: 'Guest Profile',
    operationalParams: 'Service Parameters',
    peakHours: 'Service Hours',
    defaultPeak: 'Lunch & Dinner',
    baseMenu: 'Highlights',
    defaultBase: 'Whole Leaves & Infusions',
    vaptVuptDesc: 'Tableside Vapt Vupt Gravity Brewer with dry-leaf aroma display',
    strategicRationale: 'Gastronomic Curation Concept',
    selectedBlends: 'Curated Noble Blends',
    itemsCount: 'selected teas',
    continuationSuffix: '(Continuation)',
    extractionAndService: 'Steeping Ritual',
    pairings: 'Pairs with',
    page: 'Page',
    of: 'of',
    footerContact: 'Talchá Specialty Teas · www.talcha.com.br · comercial@talcha.com.br · (11) 92596-3961',
    page2Header: 'Service Operations Manual & B2B Profitability',
    sec1Title: '1. Financial Engineering & Dining Room Profitability',
    sec1Desc:
      'Whole-leaf Talchá blends deliver the highest gross margin across dining room hot beverages with exact portion control.',
    costPerCup: 'Cost per Cup',
    costPerCupSub: 'Gourmet B2B Tin (60 x 2g servings)',
    suggestedPrice: 'Suggested Menu Price',
    suggestedPriceSub: 'Fine dining average ticket',
    profitability: 'Gross Profit Margin',
    profitabilityVal: '+89% · 720% ROI',
    profitabilitySub: '9.6x multiplier over ingredient cost',
    teaMargin: 'Talchá Tea: ~89%',
    espressoMargin: 'Espresso: ~65%',
    wineMargin: 'Wine by Glass: ~55%',
    beerMargin: 'Craft Beer: ~50%',
    sec2Title: '2. Tableside Protocol: The Vapt Vupt Gravity Ritual',
    ritual1Title: 'Aroma Display',
    ritual1Desc: 'Dry-leaf aroma vials presented tableside for sensory discovery.',
    ritual2Title: 'Precision 2g Scoop',
    ritual2Desc: '1 calibrated scoop (2g) placed inside the clear gravity steeping chamber.',
    ritual3Title: 'Calibrated Steep',
    ritual3Desc: 'Temperature-calibrated water lets whole leaves unfurl without bitterness.',
    ritual4Title: 'Gravity Pour',
    ritual4Desc: 'Resting the brewer on the cup triggers clean gravity filtration tableside.',
    sec3Title: '3. Included B2B Partnership Benefits',
    comodatoTitle: 'Brewers on Free Loan',
    comodatoDesc: 'Vapt Vupt brewers & aroma vials supplied matching monthly volume.',
    trainingTitle: 'Staff Masterclass',
    trainingDesc: 'Full training for captains, servers, and baristas to lift average check.',
    certificationTitle: 'Single-Estate Sourcing',
    certificationDesc: 'High-altitude harvests crafted with certified noble botanicals.',
    partnersTitle: 'Trusted by Premier Fine Dining & Luxury Hospitality Brands',
    supportTitle: 'Dedicated B2B Account Management',
    supportTitleExact: 'Dedicated B2B Account Management',
    supportSub: 'Commercial Specialist · Tasting Kit & Wholesale Tiers',
    supportDesc: 'Complimentary tasting samples, group pricing, and branded menu support.',
  },
  es: {
    previewHeaderTitle: 'Vista Previa Editorial A4 de la Carta',
    previewHeaderSub: 'Fiel a la maquetación oficial en PDF · 210 × 297 mm',
    modeExecutive: 'Dossier B2B',
    modeCustomer: 'Carta Sala',
    themeEditorial: 'Marfil Editorial',
    themeCleanPrint: 'Impresión Limpia',
    zoomFit: 'Ajustar',
    printBtn: 'Imprimir A4',
    downloadBtn: 'Descargar PDF',
    downloadingBtn: 'Generando PDF...',
    downloadedBtn: 'PDF Descargado',
    closeLabel: 'Cerrar vista previa',
    brandSub: 'TÉS ESPECIALES & ALTA GASTRONOMÍA',
    brandSubLine: 'www.talcha.com.br · Alta Gastronomía & Hotelería',
    officialBadge: 'DOSSIER OFICIAL B2B',
    customerMenuBadge: 'CARTA DE TÉS ESPECIALES',
    issuedOn: 'Emisión',
    curationTag: 'Curaduría Sensorial & Arquitectura de Sala',
    partnerVenue: 'Establecimiento Asociado',
    defaultEstablishment: 'Establecimiento Asociado',
    segment: 'Segmento',
    audience: 'Perfil de Sala',
    operationalParams: 'Parámetros de Servicio',
    peakHours: 'Operación',
    defaultPeak: 'Almuerzo & Cena',
    baseMenu: 'Destacados',
    defaultBase: 'Hebras Enteras & Infusiones',
    vaptVuptDesc: 'Servicio en Infusor Vapt Vupt con muestra olfativa en mesa',
    strategicRationale: 'Concepto Gastronómico de la Carta',
    selectedBlends: 'Selección de Blends Nobles',
    itemsCount: 'tés seleccionados',
    continuationSuffix: '(Continuación)',
    extractionAndService: 'Ritual de Infusión',
    pairings: 'Marida con',
    page: 'Página',
    of: 'de',
    footerContact: 'Talchá Tés Especiales · www.talcha.com.br · comercial@talcha.com.br · (11) 92596-3961',
    page2Header: 'Manual de Servicio de Sala & Rentabilidad B2B',
    sec1Title: '1. Ingeniería Financiera & Rentabilidad en Sala',
    sec1Desc:
      'Las hebras enteras Talchá logran el mayor margen bruto entre las bebidas de sala, con dosificación exacta y alto valor percibido.',
    costPerCup: 'Costo por Taza',
    costPerCupSub: 'Lata Gourmet B2B (60 dosis de 2g)',
    suggestedPrice: 'Precio Sugerido en Carta',
    suggestedPriceSub: 'Ticket promedio alta gastronomía',
    profitability: 'Rentabilidad Bruta',
    profitabilityVal: '+89% · 720% ROI',
    profitabilitySub: 'Multiplicador 9.6x sobre el insumo',
    teaMargin: 'Té Talchá: ~89%',
    espressoMargin: 'Café Espresso: ~65%',
    wineMargin: 'Vino por Copa: ~55%',
    beerMargin: 'Cerveza Artesanal: ~50%',
    sec2Title: '2. Protocolo de Servicio: El Ritual Vapt Vupt',
    ritual1Title: 'Muestra Olfativa',
    ritual1Desc: 'Tubos aromáticos para que el comensal aprecie el perfume de las hojas.',
    ritual2Title: 'Dosificación 2g',
    ritual2Desc: '1 cuchara dosificadora (2g) de hebras enteras en el infusor transparente.',
    ritual3Title: 'Extracción Exacta',
    ritual3Desc: 'Agua a temperatura calibrada para liberar aceites sin astringencia.',
    ritual4Title: 'Vertido por Gravedad',
    ritual4Desc: 'Al apoyar sobre la taza, la infusión se filtra con total elegancia.',
    sec3Title: '3. Beneficios de la Alianza Comercial Talchá',
    comodatoTitle: 'Infusores en Comodato',
    comodatoDesc: 'Infusores Vapt Vupt y muestrarios incluidos según consumo mensual.',
    trainingTitle: 'Capacitación de Equipo',
    trainingDesc: 'Formación integral para camareros, sommeliers y baristas de sala.',
    certificationTitle: 'Origen & Certificaciones',
    certificationDesc: 'Cosechas de altura, lotes frescos y botánicos seleccionados.',
    partnersTitle: 'Presente en los Mayores Nombres de la Gastronomía y Hotelería',
    supportTitle: 'Atención Comercial B2B Dedicada',
    supportTitleExact: 'Atención Comercial B2B Dedicada',
    supportSub: 'Asesor Comercial · Kit de Cata & Lista Corporativa',
    supportDesc: 'Envío de muestras de cata, tarifas por volumen y carta personalizada.',
  },
} as const;

function getCategoryAccentHex(category?: string): string {
  const raw = (category || '').toLowerCase();
  if (
    raw.includes('verde') ||
    raw.includes('green') ||
    raw.includes('branco') ||
    raw.includes('white') ||
    raw.includes('oolong')
  ) {
    return '#2E6B34';
  }
  if (
    raw.includes('hibisc') ||
    raw.includes('misto') ||
    raw.includes('matcha') ||
    raw.includes('preto') ||
    raw.includes('black') ||
    raw.includes('negro')
  ) {
    return '#8B2635';
  }
  if (raw.includes('rooibos') || raw.includes('infus') || raw.includes('herbal')) {
    return '#A05C2C';
  }
  return '#94621C';
}

function GreenCheckCircle() {
  return (
    <span
      className="inline-flex items-center justify-center w-[13px] h-[13px] rounded-full bg-[#2E6B34] text-white shrink-0"
      aria-hidden="true"
    >
      <svg viewBox="0 0 12 12" fill="none" className="w-[8px] h-[8px]" stroke="currentColor" strokeWidth="2">
        <polyline points="2.5 6.3 5 8.8 9.5 3.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function CartaPdfPreviewModal({
  isOpen,
  onClose,
  establishmentName,
  businessType = 'Restaurante',
  audienceProfile,
  operatingHours,
  menuHighlights,
  cartaTitle,
  cartaSubtitle,
  strategicRationale,
  language = 'pt',
  items = [],
  initialMode = 'executive',
  initialTheme = 'editorial',
  onDownloadPdf,
  isDownloading = false,
  hasDownloaded = false,
  showPrintFallbackWhenClosed = false,
}: CartaPdfPreviewModalProps) {
  const [docMode, setDocMode] = useState<'executive' | 'customer'>(initialMode);
  const [paperTheme, setPaperTheme] = useState<'editorial' | 'clean_print'>(initialTheme);
  const [previewLang, setPreviewLang] = useState<'pt' | 'en' | 'es'>(language);
  const [zoomMode, setZoomMode] = useState<'fit' | 1 | 1.25>('fit');
  const [fitScale, setFitScale] = useState<number>(0.85);
  const [clientLogo, setClientLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('talcha_carta_client_logo') || null;
    } catch {
      return null;
    }
  });
  const [localDownloading, setLocalDownloading] = useState<boolean>(false);

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPreviewLang(language);
  }, [language]);

  useEffect(() => {
    const syncLogo = (ev?: any) => {
      if (ev?.detail !== undefined) {
        setClientLogo(ev.detail);
      } else {
        try {
          setClientLogo(localStorage.getItem('talcha_carta_client_logo') || null);
        } catch {}
      }
    };
    window.addEventListener('talcha_logo_updated', syncLogo as EventListener);
    return () => window.removeEventListener('talcha_logo_updated', syncLogo as EventListener);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !scrollerRef.current) return;
    const el = scrollerRef.current;
    const updateScale = () => {
      const availW = Math.max(300, el.clientWidth - 40);
      const next = Math.min(1, Math.max(0.36, availW / 794));
      setFitScale(next);
    };
    updateScale();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateScale);
      ro.observe(el);
    } else {
      window.addEventListener('resize', updateScale);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', updateScale);
    };
  }, [isOpen]);

  const m = TRANSLATIONS[previewLang] || TRANSLATIONS.pt;
  const isCleanPrint = paperTheme === 'clean_print';
  const paperBgHex = isCleanPrint ? '#FFFFFF' : '#FAF7F2';
  const borderHex = isCleanPrint ? '#D7D4CE' : '#E5DACB';
  const softFillHex = isCleanPrint ? '#F8F8F8' : '#F5EFE4';

  const venueName = (establishmentName || '').trim() || m.defaultEstablishment;
  const localeStr = previewLang === 'en' ? 'en-US' : previewLang === 'es' ? 'es-ES' : 'pt-BR';
  const issuedDate = useMemo(() => {
    try {
      return new Date().toLocaleDateString(localeStr, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '2026';
    }
  }, [localeStr]);

  const bridgeCatalog = (globalThis as any).__TALCHA_DASHBOARD_BRIDGE__?.catalog;
  const localizedItems = useMemo(() => {
    return (Array.isArray(items) ? items : []).map((entry) => {
      const localizedBlend = bridgeCatalog?.localizeProduct
        ? bridgeCatalog.localizeProduct(entry.blend, previewLang)
        : entry.blend;
      const localizedCat = bridgeCatalog?.localizeCategory
        ? bridgeCatalog.localizeCategory(localizedBlend.category, previewLang)
        : localizedBlend.category || '';
      return {
        ...entry,
        localizedBlend,
        localizedCat: String(localizedCat || '').toUpperCase(),
      };
    });
  }, [items, previewLang, bridgeCatalog]);

  // Paginate items so each A4 page maintains exact breathing room before its footer
  const blendPages = useMemo(() => {
    const firstPageCapacity = strategicRationale ? 5 : 6;
    const contPageCapacity = 7;
    if (localizedItems.length <= firstPageCapacity) {
      return [localizedItems];
    }
    const pages = [localizedItems.slice(0, firstPageCapacity)];
    let cursor = firstPageCapacity;
    while (cursor < localizedItems.length) {
      pages.push(localizedItems.slice(cursor, cursor + contPageCapacity));
      cursor += contPageCapacity;
    }
    return pages;
  }, [localizedItems, strategicRationale]);

  const totalPages = blendPages.length + (docMode === 'executive' ? 1 : 0);

  const activeScale = zoomMode === 'fit' ? fitScale : zoomMode;
  const pageHeightPx = 1123;
  const pageGapPx = 28;
  const rawTotalHeight = totalPages * pageHeightPx + Math.max(0, totalPages - 1) * pageGapPx;

  const handlePrintA4 = () => {
    window.print();
  };

  const handleDownloadClick = async () => {
    if (isDownloading || localDownloading) return;
    if (onDownloadPdf) {
      await onDownloadPdf({ mode: docMode, theme: paperTheme, language: previewLang });
      return;
    }
    const fallbackPdf = (globalThis as any).__TALCHA_DASHBOARD_BRIDGE__?.pdf;
    if (fallbackPdf?.downloadCartaPdf) {
      setLocalDownloading(true);
      try {
        await fallbackPdf.downloadCartaPdf({
          establishmentName: (establishmentName || '').trim() || undefined,
          businessType,
          audienceProfile,
          operatingHours,
          menuHighlights,
          cartaTitle,
          cartaSubtitle,
          strategicRationale,
          language: previewLang,
          theme: paperTheme,
          mode: docMode,
          items,
          clientLogoDataUrl: clientLogo,
        });
      } finally {
        setLocalDownloading(false);
      }
    }
  };

  const segLabel =
    previewLang === 'en'
      ? businessType === 'Restaurante'
        ? 'Restaurant / Bistro'
        : businessType === 'Cafeteria'
          ? 'Coffee Shop & Bakery'
          : businessType === 'Hotel'
            ? 'Hotel & Hospitality'
            : businessType === 'Spa'
              ? 'Spa & Wellness'
              : businessType === 'Empório'
                ? 'Gourmet Retail'
                : businessType || 'Hospitality'
      : previewLang === 'es'
        ? businessType === 'Cafeteria'
          ? 'Cafetería & Panadería'
          : businessType === 'Empório'
            ? 'Tienda Gourmet'
            : businessType || 'Gastronomía'
        : businessType || 'Hospitalidade';

  const renderEditorialMasthead = () => {
    if (isCleanPrint) {
      return (
        <div className="bg-white px-[53px] pt-[18px] pb-[14px] border-b border-[#8B2635] shrink-0">
          <div className="h-[6px] bg-[#8B2635] -mx-[53px] -mt-[18px] mb-[14px]" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <img
                src="/assets/logo_talcha_preto.png"
                alt="Talchá"
                className="h-[48px] w-auto object-contain shrink-0"
              />
              <div className="w-[1px] h-[44px] bg-[#D2CAC0] shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold tracking-[0.06em] text-[#8B2635] uppercase">
                  {m.brandSub}
                </div>
                <div className="text-[10.5px] text-[#696256] truncate mt-0.5">
                  {venueName} · www.talcha.com.br
                </div>
              </div>
            </div>
            {clientLogo ? (
              <div className="bg-white border border-[#C68A36] rounded-[6px] px-3 py-1.5 shrink-0">
                <img src={clientLogo} alt={venueName} className="h-[40px] max-w-[130px] object-contain" />
              </div>
            ) : (
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold tracking-[0.05em] text-[#8B2635] uppercase">
                  {docMode === 'executive' ? m.officialBadge : m.customerMenuBadge}
                </div>
                <div className="text-[10px] text-[#696256] mt-0.5">
                  {m.issuedOn}: {issuedDate}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="shrink-0">
        <div className="h-[13px] bg-[#8B2635]" />
        <div className="h-[3px] bg-[#C68A36]" />
        <div
          className="bg-white px-[53px] py-[14px] flex items-center justify-between gap-4 border-b"
          style={{ borderColor: borderHex }}
        >
          <div className="flex items-center gap-4 min-w-0">
            <img
              src="/assets/logo_talcha_preto.png"
              alt="Talchá"
              className="h-[54px] w-auto object-contain shrink-0"
            />
            <div className="w-[1px] h-[48px] bg-[#C68A36] shrink-0" />
            <div className="min-w-0">
              <div className="text-[11.5px] font-bold tracking-[0.06em] text-[#8B2635] uppercase leading-tight">
                {m.brandSub}
              </div>
              <div className="text-[10.5px] text-[#696256] truncate mt-0.5">
                {venueName} · www.talcha.com.br
              </div>
              <div className="text-[10px] text-[#94621C] mt-0.5">{m.brandSubLine}</div>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            {clientLogo ? (
              <>
                <div className="bg-white border border-[#C68A36] rounded-[7px] px-3 py-1.5 shadow-2xs">
                  <img
                    src={clientLogo}
                    alt={venueName}
                    className="h-[42px] max-w-[138px] object-contain"
                  />
                </div>
                <div className="text-[9px] font-bold text-[#94621C] tracking-[0.05em] uppercase mt-1">
                  CO-BRANDING OFICIAL · {issuedDate}
                </div>
              </>
            ) : (
              <>
                <div className="px-3.5 py-1.5 rounded-[5px] bg-[#8B2635] border border-[#C68A36] text-white text-[10px] font-bold uppercase tracking-[0.06em]">
                  {docMode === 'executive' ? m.officialBadge : m.customerMenuBadge}
                </div>
                <div className="text-[10px] text-[#696256] font-medium mt-1.5">
                  {m.issuedOn}: {issuedDate}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContinuationHeader = (subtitleText: string) => {
    if (isCleanPrint) {
      return (
        <div className="bg-white px-[53px] pt-[12px] pb-[10px] border-b border-[#D7D4CE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img src="/assets/logo_talcha_preto.png" alt="Talchá" className="h-[32px] w-auto object-contain" />
            <span className="text-[11px] font-bold text-[#8B2635]">· {subtitleText}</span>
          </div>
          {clientLogo ? (
            <div className="bg-white border border-[#C68A36] rounded-[5px] px-2 py-1">
              <img src={clientLogo} alt={venueName} className="h-[26px] max-w-[90px] object-contain" />
            </div>
          ) : (
            <div className="text-[11px] font-bold text-[#1E1B18] uppercase">{venueName}</div>
          )}
        </div>
      );
    }

    return (
      <div className="shrink-0">
        <div className="h-[8px] bg-[#8B2635]" />
        <div className="h-[2px] bg-[#C68A36]" />
        <div
          className="bg-white px-[53px] h-[52px] flex items-center justify-between border-b"
          style={{ borderColor: borderHex }}
        >
          <div className="flex items-center gap-3">
            <img src="/assets/logo_talcha_preto.png" alt="Talchá" className="h-[34px] w-auto object-contain" />
            <span className="text-[11px] font-bold text-[#8B2635]">· {subtitleText}</span>
          </div>
          {clientLogo ? (
            <div className="bg-white border border-[#C68A36] rounded-[6px] px-2.5 py-1">
              <img src={clientLogo} alt={venueName} className="h-[28px] max-w-[96px] object-contain" />
            </div>
          ) : (
            <div className="text-[11px] font-bold text-[#696256] uppercase">{venueName}</div>
          )}
        </div>
      </div>
    );
  };

  const renderPageFooter = (pageNum: number) => (
    <div className="px-[53px] pb-[20px] pt-[8px] shrink-0">
      <div
        className="pt-[8px] border-t flex items-center justify-between text-[10.5px]"
        style={{ borderColor: borderHex }}
      >
        <span className="text-[#696256]">{m.footerContact}</span>
        <span className="font-bold text-[#8B2635] tabular-nums">
          {m.page} {pageNum} {m.of} {totalPages}
        </span>
      </div>
    </div>
  );

  const renderBlendCard = (entry: (typeof localizedItems)[number], globalIndex: number) => {
    const b = entry.localizedBlend || entry.blend;
    const accentHex = getCategoryAccentHex(b.category);
    const numStr = globalIndex < 9 ? `0${globalIndex + 1}` : `${globalIndex + 1}`;
    const pairingsList =
      Array.isArray(b.foodPairings) && b.foodPairings.length > 0
        ? ` · ${m.pairings}: ${b.foodPairings.slice(0, 2).join(', ')}`
        : '';

    return (
      <div
        key={`${b.id}_${globalIndex}`}
        className="rounded-[6px] bg-white border relative overflow-hidden flex items-stretch justify-between gap-3 px-3.5 py-2.5"
        style={{ borderColor: borderHex }}
      >
        {/* Left category accent bar matching PDF rect */}
        <div
          className="absolute left-0 top-[5px] bottom-[5px] w-[5px] rounded-r-[1px]"
          style={{ backgroundColor: accentHex }}
        />

        {/* Left Info */}
        <div className="flex items-start gap-2.5 flex-1 min-w-0 pl-1.5">
          <div className="w-[23px] h-[23px] rounded-full bg-[#8B2635] text-white text-[10.5px] font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
            {numStr}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-serif-editorial text-[15px] font-bold text-[#1E1B18] leading-tight">
                {b.name}
              </span>
              {entry.localizedCat && (
                <span
                  className="text-[8.5px] font-bold uppercase px-1.5 py-[2px] rounded-[4px] border leading-none"
                  style={{
                    backgroundColor: softFillHex,
                    borderColor: accentHex,
                    color: accentHex,
                  }}
                >
                  {entry.localizedCat}
                </span>
              )}
            </div>
            <div
              className="text-[10.5px] font-bold mt-1 leading-snug"
              style={{ color: accentHex }}
            >
              {[entry.roleInMenu, b.caffeine, b.keyIngredient].filter(Boolean).join(' · ')}
            </div>
            <div className="font-serif-editorial italic text-[11.5px] text-[#2A2521] mt-0.5 leading-snug">
              {b.profileHeadline || ''}
              {pairingsList}
            </div>
          </div>
        </div>

        {/* Right Brewing Box matching PDF boxX 147..193.5 */}
        <div
          className="w-[176px] shrink-0 rounded-[5px] border px-2.5 py-2 flex flex-col justify-center"
          style={{ backgroundColor: softFillHex, borderColor: borderHex }}
        >
          <div className="text-[8.5px] font-bold uppercase tracking-wider text-[#8B2635] leading-none">
            {m.extractionAndService}
          </div>
          <div className="text-[11px] font-bold text-[#1E1B18] mt-1 leading-tight tabular-nums">
            {b.brewGuide?.tempC || '90°C'} · {b.brewGuide?.infusionTime || '3 min'}
          </div>
          {entry.serviceTip && (
            <div className="text-[9px] text-[#696256] mt-1 leading-snug line-clamp-2">
              {entry.serviceTip}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPrintableSheets = () => {
    let runningItemIndex = 0;

    return (
      <div
        id="talcha-carta-print-sheet"
        className="flex flex-col items-center gap-[28px]"
        style={{ width: '794px' }}
      >
        {blendPages.map((pageItems, pageIdx) => {
          const isFirstPage = pageIdx === 0;
          const startIdx = runningItemIndex;
          runningItemIndex += pageItems.length;

          return (
            <article
              key={`carta_page_${pageIdx + 1}`}
              id={isFirstPage ? 'carta-pdf-page-1' : `carta-pdf-page-cont-${pageIdx + 1}`}
              className="talcha-a4-page w-[794px] h-[1123px] flex flex-col justify-between overflow-hidden box-border relative shadow-2xl border border-black/15"
              style={{ backgroundColor: paperBgHex }}
            >
              <div className="flex-1 flex flex-col min-h-0">
                {isFirstPage
                  ? renderEditorialMasthead()
                  : renderContinuationHeader(`${m.selectedBlends} ${m.continuationSuffix}`)}

                <div className="px-[53px] pt-[14px] flex-1 flex flex-col">
                  {isFirstPage && (
                    <>
                      {/* Title block */}
                      <div className="mb-3">
                        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#8B2635]">
                          {m.curationTag}
                        </div>
                        <h1 className="font-serif-editorial text-[24px] font-bold text-[#1E1B18] leading-tight mt-0.5">
                          {cartaTitle || `${m.customerMenuBadge} — ${venueName}`}
                        </h1>
                        {cartaSubtitle && (
                          <p className="text-[12px] text-[#696256] mt-0.5 leading-snug">
                            {cartaSubtitle}
                          </p>
                        )}
                      </div>

                      {/* Partner Venue & Service Card */}
                      <div
                        className="rounded-[8px] bg-white border relative overflow-hidden px-4 py-3 mb-3 grid grid-cols-2 gap-5"
                        style={{ borderColor: borderHex }}
                      >
                        <div className="absolute left-0 top-[7px] bottom-[7px] w-[5px] bg-[#8B2635] rounded-r-[1px]" />
                        <div className="pl-1.5 border-r pr-4" style={{ borderColor: borderHex }}>
                          <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#8B2635]">
                            {m.partnerVenue}
                          </div>
                          <div className="font-serif-editorial text-[16px] font-bold text-[#1E1B18] mt-0.5 leading-tight truncate">
                            {venueName}
                          </div>
                          <div className="text-[10.5px] text-[#696256] mt-1 leading-snug">
                            {m.segment}: {segLabel} · {m.audience}: {audienceProfile || '-'}
                          </div>
                        </div>
                        <div className="flex flex-col justify-between">
                          <div>
                            <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#8B2635]">
                              {m.operationalParams}
                            </div>
                            <div className="text-[10.5px] text-[#2A2521] mt-0.5 truncate">
                              {m.peakHours}: {operatingHours || m.defaultPeak}
                            </div>
                            <div className="text-[10.5px] text-[#696256] truncate">
                              {m.baseMenu}: {menuHighlights || m.defaultBase}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-[#173322]">
                            <GreenCheckCircle />
                            <span className="leading-tight">{m.vaptVuptDesc}</span>
                          </div>
                        </div>
                      </div>

                      {/* Strategic Rationale Box */}
                      {strategicRationale && (
                        <div
                          className="rounded-[6px] border relative overflow-hidden px-4 py-2.5 mb-3.5"
                          style={{ backgroundColor: softFillHex, borderColor: borderHex }}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#C68A36]" />
                          <div className="pl-1.5">
                            <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#94621C]">
                              {m.strategicRationale}:
                            </div>
                            <div className="font-serif-editorial italic text-[11.5px] text-[#2A2521] mt-0.5 leading-snug">
                              {strategicRationale}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section Title */}
                      <div className="mb-2.5">
                        <div className="flex items-baseline gap-2 pb-1 border-b border-[#8B2635]">
                          <h2 className="font-serif-editorial text-[15px] font-bold text-[#8B2635]">
                            {m.selectedBlends}
                          </h2>
                          <span className="text-[10.5px] text-[#696256]">
                            ({localizedItems.length} {m.itemsCount})
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Blended Tea List */}
                  <div className="space-y-[10px]">
                    {pageItems.map((entry, localIdx) =>
                      renderBlendCard(entry, startIdx + localIdx)
                    )}
                  </div>
                </div>
              </div>

              {renderPageFooter(pageIdx + 1)}
            </article>
          );
        })}

        {docMode === 'executive' && (
          <article
            id="carta-pdf-page-2"
            className="talcha-a4-page w-[794px] h-[1123px] flex flex-col justify-between overflow-hidden box-border relative shadow-2xl border border-black/15"
            style={{ backgroundColor: paperBgHex }}
          >
            <div className="flex-1 flex flex-col min-h-0">
              {renderContinuationHeader(m.page2Header)}

              <div className="px-[53px] pt-[18px] space-y-[18px]">
                {/* Section 1: Financial Engineering & ROI */}
                <div>
                  <h2 className="font-serif-editorial text-[17px] font-bold text-[#1E1B18]">
                    {m.sec1Title}
                  </h2>
                  <p className="text-[11px] text-[#696256] mt-1 leading-relaxed">{m.sec1Desc}</p>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div
                      className="bg-white border rounded-[7px] py-3 px-2 text-center"
                      style={{ borderColor: borderHex }}
                    >
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#696256]">
                        {m.costPerCup}
                      </div>
                      <div className="font-serif-editorial text-[21px] font-bold text-[#8B2635] mt-1 tabular-nums">
                        R$ 1,45
                      </div>
                      <div className="text-[9.5px] text-[#696256] mt-0.5">{m.costPerCupSub}</div>
                    </div>

                    <div
                      className="bg-white border rounded-[7px] py-3 px-2 text-center"
                      style={{ borderColor: borderHex }}
                    >
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#696256]">
                        {m.suggestedPrice}
                      </div>
                      <div className="font-serif-editorial text-[21px] font-bold text-[#8B2635] mt-1 tabular-nums">
                        R$ 14 a R$ 18
                      </div>
                      <div className="text-[9.5px] text-[#696256] mt-0.5">
                        {m.suggestedPriceSub}
                      </div>
                    </div>

                    <div className="bg-[#173322] rounded-[7px] py-3 px-2 text-center text-white">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#DEB976]">
                        {m.profitability}
                      </div>
                      <div className="font-serif-editorial text-[20px] font-bold text-white mt-1 tabular-nums">
                        {m.profitabilityVal}
                      </div>
                      <div className="text-[9.5px] text-[#DAE8DC] mt-0.5">
                        {m.profitabilitySub}
                      </div>
                    </div>
                  </div>

                  {/* Margin Comparison Bar */}
                  <div
                    className="bg-white border rounded-[6px] p-2 mt-3 grid grid-cols-4 gap-2 text-center text-[10.5px]"
                    style={{ borderColor: borderHex }}
                  >
                    <div className="py-1.5 px-2 rounded-[4px] bg-[#8B2635] text-white font-bold">
                      {m.teaMargin}
                    </div>
                    <div
                      className="py-1.5 px-2 rounded-[4px] text-[#2A2521]"
                      style={{ backgroundColor: softFillHex }}
                    >
                      {m.espressoMargin}
                    </div>
                    <div
                      className="py-1.5 px-2 rounded-[4px] text-[#2A2521]"
                      style={{ backgroundColor: softFillHex }}
                    >
                      {m.wineMargin}
                    </div>
                    <div
                      className="py-1.5 px-2 rounded-[4px] text-[#2A2521]"
                      style={{ backgroundColor: softFillHex }}
                    >
                      {m.beerMargin}
                    </div>
                  </div>
                </div>

                {/* Section 2: Vapt Vupt Ritual */}
                <div>
                  <h2 className="font-serif-editorial text-[17px] font-bold text-[#1E1B18]">
                    {m.sec2Title}
                  </h2>
                  <div className="grid grid-cols-4 gap-3 mt-2.5">
                    {[
                      { num: '1', title: m.ritual1Title, desc: m.ritual1Desc, isFinal: false },
                      { num: '2', title: m.ritual2Title, desc: m.ritual2Desc, isFinal: false },
                      { num: '3', title: m.ritual3Title, desc: m.ritual3Desc, isFinal: false },
                      { num: '4', title: m.ritual4Title, desc: m.ritual4Desc, isFinal: true },
                    ].map((step) => (
                      <div
                        key={step.num}
                        className="bg-white border rounded-[6px] p-3"
                        style={{ borderColor: borderHex }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="w-[18px] h-[18px] rounded-full text-white text-[9.5px] font-bold flex items-center justify-center shrink-0"
                            style={{ backgroundColor: step.isFinal ? '#2E6B34' : '#8B2635' }}
                          >
                            {step.num}
                          </span>
                          <span className="text-[10.5px] font-bold text-[#1E1B18] leading-tight">
                            {step.title}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-[#696256] leading-snug">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: B2B Partnership Benefits */}
                <div>
                  <h2 className="font-serif-editorial text-[17px] font-bold text-[#1E1B18]">
                    {m.sec3Title}
                  </h2>
                  <div className="grid grid-cols-3 gap-3 mt-2.5">
                    {[
                      { title: m.comodatoTitle, desc: m.comodatoDesc },
                      { title: m.trainingTitle, desc: m.trainingDesc },
                      { title: m.certificationTitle, desc: m.certificationDesc },
                    ].map((ben) => (
                      <div
                        key={ben.title}
                        className="bg-white border rounded-[6px] p-3"
                        style={{ borderColor: borderHex }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <GreenCheckCircle />
                          <span className="text-[10.5px] font-bold text-[#1E1B18] leading-tight">
                            {ben.title}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-[#696256] leading-snug">{ben.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Partner Showcase Strip */}
                <div
                  className="border rounded-[6px] py-3 px-4 text-center"
                  style={{ backgroundColor: softFillHex, borderColor: borderHex }}
                >
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#8B2635]">
                    {m.partnersTitle}
                  </div>
                  <div className="font-serif-editorial text-[13px] font-bold text-[#1E1B18] mt-1">
                    Fasano · A Casa do Porco · D.O.M. · Palácio Tangará · Hotel Emiliano · Rosewood
                  </div>
                </div>

                {/* Burgundy Commercial Contact Banner */}
                <div className="rounded-[8px] bg-[#8B2635] border border-[#C68A36] px-5 py-4 flex items-center justify-between gap-4 text-white">
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src="/assets/logo_talcha_branco.png"
                      alt="Talchá"
                      className="h-[46px] w-auto object-contain shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold text-[#FAF7F2]">
                        {m.supportTitleExact}
                      </div>
                      <div className="text-[10.5px] font-bold text-[#F6E8CC] mt-0.5">
                        {m.supportSub}
                      </div>
                      <div className="text-[10px] text-[#F5EEEA] mt-0.5 leading-snug">
                        {m.supportDesc}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11.5px] font-bold text-white">(11) 92596-3961</div>
                    <div className="text-[10px] text-[#F6E8CC] mt-0.5">comercial@talcha.com.br</div>
                  </div>
                </div>
              </div>
            </div>

            {renderPageFooter(totalPages)}
          </article>
        )}
      </div>
    );
  };

  const activeBusy = isDownloading || localDownloading;

  const modalPortal =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            id="talcha-pdf-preview-backdrop"
            className="fixed inset-0 z-[9999] bg-[#1E1B18]/95 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label={m.previewHeaderTitle}
          >
            <div id="talcha-pdf-preview-scope" className="flex flex-col w-full h-full">
              {/* Top Interactive Controls Bar (Hidden when printing to A4) */}
              <div
                data-print-hide="true"
                className="no-print bg-[#FFFFFF] dark:bg-[#1A1613] border-b border-[#E5DACB] dark:border-[#352C23] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0"
              >
                {/* Brand & Format Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#8B2635] text-white flex items-center justify-center shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      className="w-5 h-5 text-[#F3D78E]"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif-editorial text-sm sm:text-base font-bold text-[#1E1B18] dark:text-[#FAF7F2] truncate">
                      {m.previewHeaderTitle}
                    </h3>
                    <p className="text-[11px] text-[#696256] dark:text-[#A8A095] truncate">
                      {m.previewHeaderSub} · {totalPages} {totalPages === 1 ? 'página A4' : 'páginas A4'}
                    </p>
                  </div>
                </div>

                {/* Format / Paper / Zoom Segmented Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Document Mode */}
                  <div className="inline-flex items-center p-1 rounded-lg bg-[#F3ECE1] dark:bg-[#241E19] border border-[#E5DACB] dark:border-[#352C23]">
                    <button
                      type="button"
                      onClick={() => setDocMode('executive')}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        docMode === 'executive'
                          ? 'bg-[#8B2635] text-white'
                          : 'text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-white'
                      }`}
                    >
                      {m.modeExecutive}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocMode('customer')}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        docMode === 'customer'
                          ? 'bg-[#8B2635] text-white'
                          : 'text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-white'
                      }`}
                    >
                      {m.modeCustomer}
                    </button>
                  </div>

                  {/* Paper Style */}
                  <div className="inline-flex items-center p-1 rounded-lg bg-[#F3ECE1] dark:bg-[#241E19] border border-[#E5DACB] dark:border-[#352C23]">
                    <button
                      type="button"
                      onClick={() => setPaperTheme('editorial')}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        paperTheme === 'editorial'
                          ? 'bg-white dark:bg-[#352C23] text-[#1E1B18] dark:text-white shadow-2xs'
                          : 'text-[#5C564D] dark:text-[#C2B8AA]'
                      }`}
                    >
                      {m.themeEditorial}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperTheme('clean_print')}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        paperTheme === 'clean_print'
                          ? 'bg-white dark:bg-[#352C23] text-[#1E1B18] dark:text-white shadow-2xs'
                          : 'text-[#5C564D] dark:text-[#C2B8AA]'
                      }`}
                    >
                      {m.themeCleanPrint}
                    </button>
                  </div>

                  {/* Zoom Selector */}
                  <div className="hidden md:inline-flex items-center p-1 rounded-lg bg-[#F3ECE1] dark:bg-[#241E19] border border-[#E5DACB] dark:border-[#352C23]">
                    {(['fit', 1, 1.25] as const).map((z) => (
                      <button
                        key={String(z)}
                        type="button"
                        onClick={() => setZoomMode(z)}
                        className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                          zoomMode === z
                            ? 'bg-[#1E1B18] dark:bg-[#FAF7F2] text-white dark:text-[#1E1B18]'
                            : 'text-[#5C564D] dark:text-[#C2B8AA]'
                        }`}
                      >
                        {z === 'fit' ? m.zoomFit : `${Math.round(z * 100)}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    id="btn-carta-preview-print"
                    onClick={handlePrintA4}
                    className="px-3.5 py-2 rounded-lg border border-[#C68A36] bg-[#FAF7F2] dark:bg-[#241E19] hover:bg-[#F3ECE1] text-[#8B2635] dark:text-[#F3D78E] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-3.5 h-3.5"
                    >
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    <span>{m.printBtn}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-carta-preview-download"
                    onClick={handleDownloadClick}
                    disabled={activeBusy}
                    className="px-4 py-2 rounded-lg bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {activeBusy ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{m.downloadingBtn}</span>
                      </>
                    ) : hasDownloaded ? (
                      <span>{m.downloadedBtn}</span>
                    ) : (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-3.5 h-3.5"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>{m.downloadBtn}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    id="btn-carta-preview-close"
                    onClick={onClose}
                    aria-label={m.closeLabel}
                    className="p-2 rounded-lg text-[#696256] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-5 h-5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scrollable Full-Page A4 Inspection Canvas */}
              <div
                id="talcha-pdf-preview-scroller"
                ref={scrollerRef}
                onClick={(ev) => {
                  if (ev.target === ev.currentTarget) onClose();
                }}
                className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-[#231F1B]"
              >
                <div
                  id="talcha-pdf-preview-scale-wrap"
                  style={{
                    width: `${794 * activeScale}px`,
                    height: `${rawTotalHeight * activeScale}px`,
                  }}
                >
                  <div
                    style={{
                      width: '794px',
                      transform: `scale(${activeScale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    {renderPrintableSheets()}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {modalPortal}
      {!isOpen && showPrintFallbackWhenClosed && (
        <div id="talcha-pdf-preview-scope" className="talcha-print-fallback" aria-hidden="true">
          {renderPrintableSheets()}
        </div>
      )}
    </>
  );
}
