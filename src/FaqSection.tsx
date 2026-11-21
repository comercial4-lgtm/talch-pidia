import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  CreditCard,
  HelpCircle,
  MessageCircle,
  Sparkles,
  Truck,
} from 'lucide-react';

type FaqCategory = 'all' | 'consultoria' | 'logistica' | 'pagamento';

interface FaqItemData {
  id: string;
  category: Exclude<FaqCategory, 'all'>;
  question: { pt: string; en: string; es: string };
  answer: { pt: string; en: string; es: string };
  highlight?: { pt: string; en: string; es: string };
}

export interface FaqSectionProps {
  onOpenLeadModal?: (
    interestType?: 'amostras' | 'carta' | 'evento' | 'contato' | 'catalogo' | 'parceria',
    recommendedTeaName?: string
  ) => void;
}

const FAQ_ITEMS: FaqItemData[] = [
  {
    id: 'faq-consultoria-carta',
    category: 'consultoria',
    question: {
      pt: 'Como funciona a consultoria e montagem da carta de chás para o meu estabelecimento?',
      en: 'How does the custom tea menu consultancy work for hospitality venues?',
      es: '¿Cómo funciona la consultoría y diseño de la carta de tés para mi establecimiento?',
    },
    answer: {
      pt: 'Nossa equipe analisa o perfil gastronômico do seu salão, horários de serviço (café da manhã, almoço, chá da tarde ou jantar) e pratos principais para desenhar uma carta sob medida. Você já pode estruturar sua seleção na aba Carta B2B, gerar o PDF oficial com a sua marca e ajustar junto ao nosso Sommelier Corporativo para alcançar margem bruta superior a 700% (custo médio de ~R$ 1,45 por dose de 2g contra venda sugerida de R$ 14 a R$ 20).',
      en: 'Our specialists evaluate your dining concept, service dayparts, and signature dishes to curate a bespoke tea program. You can draft your menu in the B2B Carta builder, export a co-branded PDF dossier, and fine-tune it with our Corporate Sommelier to capture +700% gross margin (~R$ 1.45 cost per 2g serving).',
      es: 'Nuestro equipo analiza el perfil gastronómico de tu salón y los momentos de servicio para diseñar una carta a medida. Puedes estructurar tu selección en la pestaña Carta B2B, exportar el PDF con tu logotipo y optimizar márgenes superiores al 700%.',
    },
    highlight: {
      pt: 'Custo médio ~R$ 1,45/dose · Margem bruta acima de 700%',
      en: 'Avg. cost ~R$ 1.45/cup · Over 700% gross margin',
      es: 'Costo promedio ~R$ 1,45/taza · Margen superior al 700%',
    },
  },
  {
    id: 'faq-comodato-vapt-vupt',
    category: 'consultoria',
    question: {
      pt: 'Os infusores Vapt Vupt e tubos olfativos estão disponíveis em comodato?',
      en: 'Are Vapt Vupt gravity brewers and aroma vials available on free loan?',
      es: '¿Los infusores Vapt Vupt y tubos olfativos se ofrecen en comodato?',
    },
    answer: {
      pt: 'Sim. Fornecemos o Preparador Vapt Vupt patenteado (Tritan BPA-free de 500 ml com válvula que filtra por gravidade sem pingar) e displays com tubos olfativos de vidro em regime de comodato conforme o volume mensal de compra, além de copos de vidro duplo borossilicato para valorizar o ritual à mesa.',
      en: 'Yes. Patented Vapt Vupt gravity brewers (500 ml BPA-free Tritan) and glass dry-leaf aroma display vials are supplied on free loan based on monthly volume, paired with double-wall borosilicate glassware for memorable tableside service.',
      es: 'Sí. Ofrecemos infusores patentados Vapt Vupt (Tritan 500 ml libre de BPA) y displays con tubos olfativos en comodato según volumen mensual, además de vasos de vidrio doble de borosilicato.',
    },
  },
  {
    id: 'faq-modalidades-b2b',
    category: 'consultoria',
    question: {
      pt: 'Quais são as modalidades B2B da Talchá (Servir, Revender e Presentes Corporativos)?',
      en: 'What are Talchá’s B2B partnership models (Serve, Retail & Corporate Gifting)?',
      es: '¿Cuáles son las modalidades B2B de Talchá (Servir, Revender y Regalos Corporativos)?',
    },
    answer: {
      pt: 'Atuamos em três frentes sob medida: (01) Servir — chá a granel para hotéis, restaurantes e cafeterias com padrão de infusão, utensílios dedicados, treinamento e pós-venda ativo; (02) Revender — portfólio autoral em latas e a granel com material de PDV para cafeterias e mercearias de curadoria; (03) Presentes Corporativos — kits em latas e caixas selecionadas com personalização de marca e logística nacional rastreada. Após o briefing, entregamos sua proposta e cronograma em até 2 dias úteis.',
      en: 'We operate across three tailored tracks: (01) On-Premise Service — bulk loose-leaf teas for hotels, restaurants, and cafés with calibrated equipment and training; (02) Retail — signature tins and bulk with standardized POS display; (03) Corporate Gifting — custom co-branded gift boxes with tracked nationwide delivery. Custom proposals are delivered within 2 business days of briefing.',
      es: 'Operamos en tres modalidades: (01) Servir en canal HORECA con capacitación y posventa activa; (02) Revender en latas y a granel con material de PDV; (03) Regalos Corporativos con aplicación de marca y envío nacional. Entregamos propuestas en hasta 2 días hábiles.',
    },
    highlight: {
      pt: 'Servir (HORECA) · Revender (PDV) · Presentes Corporativos · Proposta em até 2 dias úteis',
      en: 'Serve (HORECA) · Retail (POS) · Corporate Gifting · 2-business-day proposal',
      es: 'Servir · Revender · Regalos Corporativos · Propuesta en 2 días hábiles',
    },
  },
  {
    id: 'faq-treinamento-amostras',
    category: 'consultoria',
    question: {
      pt: 'Vocês oferecem treinamento para a brigada, visitas programadas ao PDV e kit de amostras?',
      en: 'Do you provide staff training, scheduled venue visits, and tasting sample kits?',
      es: '¿Ofrecen capacitación para el equipo, visitas programadas al PDV y muestras?',
    },
    answer: {
      pt: 'Sim. Seguimos um processo estruturado em 6 etapas: Briefing, Proposta em até 2 dias úteis, Envio de Amostras para prova da equipe, Implantação com entrega de utensílios calibrados e treinamento de baristas e garçons, Visitas programadas ao PDV com consultor dedicado e Pós-venda com reciclagem contínua e evolução da carta. Também é possível conhecer nossas linhas presencialmente nas duas lojas de São Paulo (Shopping Pátio Higienópolis e JK Iguatemi).',
      en: 'Yes. We follow a structured 6-stage flow: Briefing, 2-business-day Proposal, Tasting Samples, Launch with calibrated brewers and barista/server training, Scheduled POS visits with a dedicated consultant, and continuous After-Sales evolution. You can also experience our collection at our two São Paulo boutiques (Pátio Higienópolis & JK Iguatemi).',
      es: 'Sí. Seguimos un proceso de 6 etapas: Briefing, Propuesta en 2 días hábiles, Muestras de degustación, Implantación con capacitación, Visitas programadas al PDV y Posventa continua. También atendemos en nuestras 2 tiendas de São Paulo (Pátio Higienópolis y JK Iguatemi).',
    },
  },
  {
    id: 'faq-logistica-prazos',
    category: 'logistica',
    question: {
      pt: 'Quais são os prazos de despacho e entrega logística dos chás para todo o Brasil?',
      en: 'What are the dispatch and delivery lead times across Brazil?',
      es: '¿Cuáles son los plazos de despacho y entrega logística en Brasil?',
    },
    answer: {
      pt: 'Todos os lotes são despachados em 24h a 48h úteis após confirmação do pedido. São Paulo Capital e Grande SP recebem em 24h a 48h úteis (com opção de entrega expressa); capitais do Sudeste e Sul em 48h a 72h úteis; Centro-Oeste e Nordeste em 3 a 5 dias úteis; e cidades do Interior e Região Norte em 4 a 7 dias úteis via transportadora parceira com rastreamento eletrônico.',
      en: 'Orders ship within 24–48 business hours. São Paulo metro receives delivery in 24–48 business hours; Southeast & South capitals in 48–72 business hours; Midwest & Northeast in 3–5 business days; and Interior & North regions in 4–7 business days with full tracking.',
      es: 'Despachamos en 24h a 48h hábiles tras la confirmación. São Paulo Capital recibe en 24h–48h; capitales del Sudeste y Sur en 48h–72h; Centro-Oeste y Nordeste en 3 a 5 días hábiles; e Interior/Norte en 4 a 7 días hábiles con seguimiento.',
    },
    highlight: {
      pt: 'SP Capital: 24h–48h · SE/Sul: 48h–72h · CO/NE: 3–5 dias úteis',
      en: 'SP Metro: 24–48h · SE/South: 48–72h · MW/NE: 3–5 business days',
      es: 'SP Capital: 24h–48h · SE/Sur: 48h–72h · CO/NE: 3–5 días hábiles',
    },
  },
  {
    id: 'faq-pedido-minimo-embalagens',
    category: 'logistica',
    question: {
      pt: 'Qual é o pedido mínimo (MOQ) e o formato das embalagens para operação B2B?',
      en: 'What is the minimum order quantity (MOQ) and wholesale packaging format?',
      es: '¿Cuál es el pedido mínimo (MOQ) y el formato de envase B2B?',
    },
    answer: {
      pt: 'Trabalhamos com pedido mínimo acessível a partir de 4 latas em mix livre entre os blends selecionados na sua carta. As embalagens gastronômicas contam com refis e latas de 250g e 500g (cada lata padrão rende cerca de 60 doses individuais de 2g no serviço Vapt Vupt), evitando imobilização excessiva de capital no estoque.',
      en: 'We offer a flexible MOQ starting at just 4 tins with free blend mix-and-match across your menu. Foodservice formats come in 250g and 500g tins/refills (around 60 x 2g servings per standard tin) so you keep inventory lean.',
      es: 'Contamos con un MOQ flexible desde 4 latas con combinación libre de blends, en formatos gastronómicos de 250g y 500g (aprox. 60 dosis de 2g por lata estándar) para evitar exceso de inventario.',
    },
  },
  {
    id: 'faq-validade-conservacao',
    category: 'logistica',
    question: {
      pt: 'Qual a validade dos chás e como devem ser armazenados no salão ou estoque?',
      en: 'What is the shelf life and how should the teas be stored in our kitchen or bar?',
      es: '¿Cuál es la vida útil y cómo conservar los tés en barra o depósito?',
    },
    answer: {
      pt: 'Os blends Talchá possuem validade de 24 meses e chegam acondicionados em latas metálicas com vedação hermética e bloqueio total de luz UV. Basta mantê-las em local seco, arejado e longe de fontes diretas de calor ou odores fortes — sem necessidade de refrigeração.',
      en: 'Talchá blends carry a 24-month shelf life in airtight metallic tins with complete UV protection. Simply store in a cool, dry cabinet away from direct heat or strong kitchen odors—no refrigeration required.',
      es: 'Los blends tienen una vida útil de 24 meses en latas herméticas con bloqueo total de luz UV. Solo requieren almacenamiento en lugar fresco y seco, sin refrigeración.',
    },
  },
  {
    id: 'faq-formas-pagamento',
    category: 'pagamento',
    question: {
      pt: 'Quais são as formas de pagamento aceitas para estabelecimentos parceiros?',
      en: 'Which payment methods are accepted for B2B partner accounts?',
      es: '¿Qué formas de pago se aceptan para socios B2B?',
    },
    answer: {
      pt: 'Oferecemos Pix Corporativo com liberação imediata de despacho, Boleto Bancário faturado diretamente para o CNPJ (mediante aprovação cadastral rápida), Cartão de Crédito Empresarial e Link de Pagamento seguro para pedidos iniciais ou reposições emergenciais.',
      en: 'We accept Corporate Pix with immediate dispatch release, invoiced Boleto Bancário for registered CNPJ companies upon fast credit check, Corporate Credit Card, and secure payment links.',
      es: 'Aceptamos Pix Corporativo con despacho inmediato, Boleto Bancario a plazo para empresas con CNPJ tras validación rápida, Tarjeta Corporativa y enlace de pago seguro.',
    },
    highlight: {
      pt: 'Boleto faturado para CNPJ · Pix Corporativo · Cartão Empresarial',
      en: 'CNPJ Net-Terms Invoice · Corporate Pix · Business Card',
      es: 'Factura a plazo para CNPJ · Pix Corporativo · Tarjeta Empresarial',
    },
  },
  {
    id: 'faq-nfe-condicoes-recorrentes',
    category: 'pagamento',
    question: {
      pt: 'A Talchá emite Nota Fiscal Eletrônica (NF-e) e oferece condições para reposição recorrente?',
      en: 'Do you issue electronic tax invoices (NF-e) and offer recurring replenishment terms?',
      es: '¿Emiten Factura Electrónica (NF-e) y condiciones para reposición periódica?',
    },
    answer: {
      pt: 'Sim. Todos os pedidos B2B acompanham Nota Fiscal Eletrônica (NF-e) vinculada ao CNPJ do restaurante, hotel ou cafeteria. Clientes com reposição recorrente contam com faturamento programado, prazos diferenciados após o primeiro pedido e alertas inteligentes de reposição no Dashboard do Estabelecimento.',
      en: 'Yes. Every order ships with full Brazilian NF-e corporate invoicing. Recurring partner accounts unlock net-term billing after the initial order and proactive restock planning inside the Establishment Dashboard.',
      es: 'Sí. Todos los pedidos incluyen Factura Electrónica (NF-e) al CNPJ del establecimiento, con condiciones a plazo para cuentas recurrentes y control de reposición en el Panel del Establecimiento.',
    },
  },
  {
    id: 'faq-redes-hoteis-grupos',
    category: 'pagamento',
    question: {
      pt: 'Grupos gastronômicos e redes hoteleiras contam com tabela progressiva e faturamento por unidade?',
      en: 'Do restaurant groups and hotel chains receive tiered pricing and multi-unit billing?',
      es: '¿Los grupos gastronómicos y cadenas hoteleras tienen tarifa escalonada?',
    },
    answer: {
      pt: 'Sim. Atendemos hotéis cinco estrelas e redes multicidade com tabela atacado progressiva por volume consolidado, atendimento comercial dedicado e flexibilidade para faturamento centralizado na matriz ou descentralizado por filial.',
      en: 'Yes. Luxury hotel chains and multi-unit dining groups receive progressive volume-tier wholesale pricing, a dedicated account manager, and either centralized HQ or per-branch billing.',
      es: 'Sí. Cadenas hoteleras y grupos de restaurantes cuentan con tarifa mayorista progresiva por volumen, ejecutivo dedicado y facturación centralizada o por sucursal.',
    },
  },
];

export default function FaqSection({ onOpenLeadModal }: FaqSectionProps) {
  const bridge = (globalThis as any).__TALCHA_DASHBOARD_BRIDGE__;
  const langCtx = bridge?.useLang?.() || {
    language: 'pt' as const,
    localize: (pt: string) => pt,
  };
  const lang: 'pt' | 'en' | 'es' = langCtx.language || 'pt';
  const localize: (pt: string, en?: string, es?: string) => string =
    langCtx.localize || ((pt: string) => pt);

  const sectionRef = useRef<HTMLElement | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('all');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'faq-consultoria-carta': true,
  });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setHasEntered(true);
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.96) {
      setHasEntered(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasEntered(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return FAQ_ITEMS;
    return FAQ_ITEMS.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categoryMeta: Record<
    Exclude<FaqCategory, 'all'>,
    { label: string; icon: React.ReactNode }
  > = {
    consultoria: {
      label: localize('Consultoria B2B', 'B2B Consultancy', 'Consultoría B2B'),
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    logistica: {
      label: localize('Logística & Entrega', 'Logistics & Delivery', 'Logística y Entrega'),
      icon: <Truck className="w-3.5 h-3.5" />,
    },
    pagamento: {
      label: localize('Pagamento & Faturamento', 'Payment & Billing', 'Pagos y Facturación'),
      icon: <CreditCard className="w-3.5 h-3.5" />,
    },
  };

  const handleCategoryChange = (cat: FaqCategory) => {
    setActiveCategory(cat);
    const firstInCat = cat === 'all' ? FAQ_ITEMS[0] : FAQ_ITEMS.find((i) => i.category === cat);
    if (firstInCat) {
      setOpenIds((prev) => ({ ...prev, [firstInCat.id]: true }));
    }
  };

  return (
    <section
      ref={sectionRef}
      id="talcha-faq-scope"
      data-print-hide="true"
      aria-labelledby="talcha-faq-heading"
      className="no-print"
    >
      <div className="border-t border-[#E5DACB] dark:border-[#2C241E] bg-[#FAF7F2] dark:bg-[#111A15] py-14 sm:py-20 transition-colors duration-200">
        <div
          className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${
            hasEntered ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : 'opacity-0'
          }`}
        >
        {/* Editorial Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="max-w-2xl space-y-2.5">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8B2635] dark:text-[#E88E9B]">
              <HelpCircle className="w-3.5 h-3.5 text-[#C68A36]" />
              <span>
                {localize(
                  'Perguntas Frequentes · Parceiros B2B',
                  'Frequently Asked Questions · B2B Partners',
                  'Preguntas Frecuentes · Socios B2B'
                )}
              </span>
            </div>
            <h2
              id="talcha-faq-heading"
              className="font-serif-editorial text-2xl sm:text-4xl font-bold text-[#1E1B18] dark:text-[#FAF7F2] tracking-tight leading-tight"
            >
              {localize(
                'Tudo sobre consultoria, logística e faturamento',
                'Everything about curation, logistics, and billing',
                'Todo sobre consultoría, logística y facturación'
              )}
            </h2>
            <p className="text-sm sm:text-[15px] text-[#5C564D] dark:text-[#C2B8AA] leading-relaxed">
              {localize(
                'Respostas diretas para proprietários, sommeliers, chefs e compradores de restaurantes, hotéis e cafeterias.',
                'Clear answers for venue owners, sommeliers, chefs, and hospitality procurement teams.',
                'Respuestas directas para propietarios, sommeliers, chefs y compradores del sector gastronómico.'
              )}
            </p>
          </div>

          {/* Category Filter Segmented Control */}
          <div
            role="tablist"
            aria-label={localize('Filtrar perguntas por categoria', 'Filter FAQ by topic', 'Filtrar preguntas')}
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#181512] border border-[#E5DACB] dark:border-[#332C24] shadow-2xs self-start md:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'all'}
              onClick={() => handleCategoryChange('all')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-[#8B2635] text-white'
                  : 'text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-[#FAF7F2]'
              }`}
            >
              {localize('Todas', 'All', 'Todas')}
            </button>
            {(['consultoria', 'logistica', 'pagamento'] as const).map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#8B2635] text-white'
                      : 'text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-[#FAF7F2]'
                  }`}
                >
                  {categoryMeta[cat].icon}
                  <span>{categoryMeta[cat].label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion Container */}
        <div className="bg-white dark:bg-[#181512] rounded-2xl border border-[#DFD2BF] dark:border-[#332C24] divide-y divide-[#EDE5D8] dark:divide-[#2A231C] shadow-xs overflow-hidden">
          {filteredItems.map((item, index) => {
            const isExpanded = Boolean(openIds[item.id]);
            const buttonId = `${item.id}-btn`;
            const panelId = `${item.id}-panel`;
            const meta = categoryMeta[item.category];
            const numeral = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

            return (
              <div key={item.id} className="transition-colors">
                <h3 className="m-0">
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full text-left px-5 sm:px-7 py-5 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                      isExpanded
                        ? 'bg-[#FAF7F2]/75 dark:bg-[#201B16]'
                        : 'hover:bg-[#FAF7F2]/50 dark:hover:bg-[#1E1914]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                      <span
                        className={`text-xs font-bold tabular-nums pt-1 shrink-0 ${
                          isExpanded
                            ? 'text-[#8B2635] dark:text-[#F3D78E]'
                            : 'text-[#9A9083] dark:text-[#787066]'
                        }`}
                      >
                        {numeral}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#94621C] dark:text-[#C68A36]">
                          {meta.icon}
                          <span>{meta.label}</span>
                        </div>
                        <div className="text-[15px] sm:text-[17px] font-semibold text-[#1E1B18] dark:text-[#FAF7F2] leading-snug">
                          {item.question[lang] || item.question.pt}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all duration-200 ${
                        isExpanded
                          ? 'bg-[#8B2635] border-[#8B2635] text-white rotate-180'
                          : 'bg-[#FAF7F2] dark:bg-[#231E19] border-[#E5DACB] dark:border-[#3A3229] text-[#5C564D] dark:text-[#C2B8AA]'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isExpanded}
                  className={isExpanded ? 'block animate-in fade-in slide-in-from-top-2 duration-200' : 'hidden'}
                >
                  <div className="px-5 sm:px-7 pb-6 pt-1 pl-[3.15rem] sm:pl-[3.65rem] bg-[#FAF7F2]/75 dark:bg-[#201B16] space-y-3">
                    <p className="text-sm text-[#423D37] dark:text-[#D5CEC3] leading-relaxed">
                      {item.answer[lang] || item.answer.pt}
                    </p>
                    {item.highlight && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#173322]/60 border border-[#DFD2BF] dark:border-[#2E6B34]/40 text-xs font-semibold text-[#173322] dark:text-[#9BE3A5]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E6B34] dark:bg-[#6FD47B] shrink-0" />
                        <span>{item.highlight[lang] || item.highlight.pt}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Direct Specialist Strip */}
        <div className="mt-6 rounded-2xl bg-white dark:bg-[#181512] border border-[#DFD2BF] dark:border-[#332C24] px-5 sm:px-7 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm sm:text-base font-bold text-[#1E1B18] dark:text-[#FAF7F2]">
              {localize(
                'Precisa de proposta comercial, tabela atacado ou kit de amostras?',
                'Need custom wholesale pricing or a sensory tasting kit?',
                '¿Necesitas cotización mayorista o un kit de degustación?'
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#5C564D] dark:text-[#C2B8AA]">
              {localize(
                'Comercial B2B: (11) 94228-6914 · comercial@talcha.com.br (Seg–Sex 8h–18h · retorno em até 2 dias úteis) · E-commerce: (11) 94234-8210.',
                'B2B Commercial Desk: +55 (11) 94228-6914 · comercial@talcha.com.br (Mon–Fri 8am–6pm) · Online Support: (11) 94234-8210.',
                'Comercial B2B: +55 (11) 94228-6914 · comercial@talcha.com.br (Lun–Vie 8h–18h) · Atención Tienda: (11) 94234-8210.'
              )}
            </p>
          </div>
          <button
            type="button"
            id="btn-faq-falar-especialista"
            onClick={() => onOpenLeadModal?.('carta', 'FAQ B2B Talchá')}
            className="px-5 py-3 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4 text-[#F3D78E]" />
            <span>
              {localize(
                'Falar com Especialista B2B',
                'Speak with a B2B Specialist',
                'Hablar con Especialista B2B'
              )}
            </span>
          </button>
        </div>
      </div>
      </div>
    </section>
  );
}
