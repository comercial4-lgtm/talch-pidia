import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  Clock,
  Coffee,
  Gift,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Store,
} from 'lucide-react';

export interface TalchaBrandContextSectionProps {
  onNavigate?: (mode: string) => void;
  onOpenLeadModal?: (interestType?: string, recommendedTeaName?: string) => void;
}

type BrandContextTab = 'modalidades' | 'processo' | 'historia';

export default function TalchaBrandContextSection({
  onNavigate,
  onOpenLeadModal,
}: TalchaBrandContextSectionProps) {
  const bridge = (globalThis as any).__TALCHA_DASHBOARD_BRIDGE__;
  const langCtx = bridge?.useLang?.() || {
    language: 'pt' as const,
    localize: (pt: string) => pt,
  };
  const localize: (pt: string, en?: string, es?: string) => string =
    langCtx.localize || ((pt: string) => pt);

  const sectionRef = useRef<HTMLElement | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [activeTab, setActiveTab] = useState<BrandContextTab>('modalidades');

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

  const modalities = [
    {
      index: '01',
      id: 'servir',
      audience: localize(
        'Hotéis, Restaurantes & Cafeterias',
        'Hotels, Restaurants & Cafés',
        'Hoteles, Restaurantes y Cafeterías'
      ),
      title: localize('Servir no Salão', 'On-Premise Service', 'Servir en Salón'),
      subtitle: localize(
        'Chá a granel — SKU líder no canal HORECA — com padrão de infusão Talchá, utensílios dedicados e pós-venda ativo.',
        'Loose-leaf teas — our leading HORECA format — with calibrated steeping hardware, staff training, and active follow-up.',
        'Té a granel — SKU líder en canal HORECA — con estándar de infusión Talchá, utensilios dedicados y posventa activa.'
      ),
      bullets: [
        localize(
          'Padrão de tempo, temperatura e dosagem por folha',
          'Exact time, temperature, and dosing protocol per origin',
          'Control exacto de tiempo, temperatura y dosis por origen'
        ),
        localize(
          'Capacitação contínua e reciclagem da brigada e baristas',
          'Ongoing staff and barista brewing certification',
          'Capacitación continua de camareros y baristas'
        ),
        localize(
          'Curadoria sob medida para o conceito gastronômico',
          'Custom tea menu designed around your culinary profile',
          'Curaduría de carta alineada con tu concepto gastronómico'
        ),
      ],
      ctaLabel: localize('Estruturar Carta Servir', 'Build Menu for Service', 'Estructurar Carta'),
      action: () => onOpenLeadModal?.('carta', 'Modalidade Servir — Canal HORECA'),
      secondaryLabel: localize('Abrir Construtor', 'Open Builder', 'Abrir Constructor'),
      secondaryAction: () => {
        onNavigate?.('carta');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      icon: Coffee,
    },
    {
      index: '02',
      id: 'revender',
      audience: localize(
        'Cafeterias & Mercearias de Curadoria',
        'Curated Cafés & Specialty Grocers',
        'Cafeterías y Tiendas Gourmet'
      ),
      title: localize('Revender na Prateleira', 'Retail Shelving', 'Revender en Tienda'),
      subtitle: localize(
        'Do Golden Pu-Ehr reserva ao Rooibos da África do Sul — produto, embalagem em lata ou a granel e carta de sabores à altura do seu público.',
        'From aged Golden Pu-Ehr to South African Rooibos — tins and loose-leaf SKUs curated for high retail turnover.',
        'Del Golden Pu-Ehr reserva al Rooibos de Sudáfrica — portafolio en lata y a granel para rotación en tienda.'
      ),
      bullets: [
        localize(
          'Portfólio autoral em lata hermética e a granel',
          'Signature blends in airtight UV-shielded tins and bulk',
          'Portafolio de autor en latas herméticas y a granel'
        ),
        localize(
          'Sistema padronizado de material de PDV e sinalização',
          'Standardized point-of-sale display and merchandising',
          'Material estandarizado de PDV y exhibición en tienda'
        ),
        localize(
          'Reposição programada e acompanhamento de giro',
          'Scheduled replenishment and sell-through tracking',
          'Reposición programada y seguimiento de rotación'
        ),
      ],
      ctaLabel: localize('Cotar para Revenda', 'Request Retail Proposal', 'Cotizar Reventa'),
      action: () => onOpenLeadModal?.('parceria', 'Modalidade Revender — Portfólio em Lata & Granel'),
      icon: Store,
    },
    {
      index: '03',
      id: 'presentes',
      audience: localize(
        'Datas, Campanhas & Relacionamento',
        'Corporate Gifting & Campaigns',
        'Regalos Corporativos y Campañas'
      ),
      title: localize('Presentes Corporativos', 'Corporate Gifting', 'Regalos Corporativos'),
      subtitle: localize(
        'Latas e caixas selecionadas com curadoria Talchá, opção de aplicação da sua marca e logística nacional rastreada para uma ou milhares de pessoas.',
        'Selected tins and gift boxes with optional co-branding on cards/sleeves and nationwide tracked fulfillment.',
        'Latas y cajas seleccionadas con personalización de marca, logística nacional rastreada e informe poscampaña.'
      ),
      bullets: [
        localize(
          'Personalização em cartões e embalagens selecionadas',
          'Custom brand application on cards and gift packaging',
          'Aplicación de marca en tarjetas y estuches dedicados'
        ),
        localize(
          'Logística nacional estruturada com gestão centralizada',
          'Structured nationwide shipping with centralized tracking',
          'Logística nacional estructurada con envío rastreado'
        ),
        localize(
          'Relatório pós-campanha com consolidação de entregas',
          'Post-campaign delivery report and consolidated metrics',
          'Informe poscampaña con consolidación de entregas'
        ),
      ],
      ctaLabel: localize('Planejar Presentes', 'Plan Corporate Gifts', 'Cotizar Regalos'),
      action: () => onOpenLeadModal?.('evento', 'Presentes Corporativos Talchá'),
      icon: Gift,
    },
  ];

  const commitments = [
    {
      num: '01',
      title: localize('Qualidade máxima na xícara', 'Peak cup quality', 'Máxima calidad en taza'),
      desc: localize(
        'Folhas inteiras de origem única, extração calibrada e equipe treinada em cada preparo.',
        'Whole single-origin leaves, calibrated steeping, and trained staff on every pour.',
        'Hojas enteras de origen único, extracción calibrada y equipo capacitado.'
      ),
    },
    {
      num: '02',
      title: localize('Posicionamento no PDV', 'Consistent POS presence', 'Presencia de marca en PDV'),
      desc: localize(
        'Material de trade padronizado para comunicar o universo Talchá em todos os pontos de contato.',
        'Standardized trade displays reinforcing Talchá craftsmanship across guest touchpoints.',
        'Material de exhibición estandarizado para destacar Talchá en cada punto de contacto.'
      ),
    },
    {
      num: '03',
      title: localize('Pós-venda ativo', 'Proactive after-sales', 'Posventa activa'),
      desc: localize(
        'Visitas programadas ao ponto de venda, reciclagem contínua e monitoramento de giro.',
        'Scheduled venue visits, refresher team sessions, and ongoing sales review.',
        'Visitas programadas al PDV, actualización continua y análisis de ventas.'
      ),
    },
    {
      num: '04',
      title: localize('Consultoria de cardápio', 'Tailored menu curation', 'Consultoría de carta'),
      desc: localize(
        'Desenho do mix ideal do portfólio a granel às infusões sazonais da sua operação.',
        'Menu architecture from core loose-leaf signatures to seasonal botanical highlights.',
        'Diseño del mix ideal desde granel clásico hasta infusiones de temporada.'
      ),
    },
  ];

  const processSteps = [
    {
      step: '01',
      title: localize('Briefing', 'Briefing', 'Briefing'),
      desc: localize(
        'Você conta o perfil da casa, o público e o padrão de serviço desejado.',
        'Share your concept, guest profile, and service standard.',
        'Nos cuentas tu operación, público y estándar deseado.'
      ),
    },
    {
      step: '02',
      title: localize('Proposta · até 2 dias úteis', 'Proposal · 2 business days', 'Propuesta · hasta 2 días hábiles'),
      desc: localize(
        'Curadoria do mix, estimativa de rentabilidade e cronograma detalhado.',
        'Custom blend mix, margin forecast, and rollout timeline.',
        'Curaduría del mix, estimación financiera y cronograma.'
      ),
    },
    {
      step: '03',
      title: localize('Amostras', 'Tasting Samples', 'Muestras'),
      desc: localize(
        'Envio de amostras do portfólio para prova sensorial da equipe antes da aprovação.',
        'Pre-approval portfolio samples shipped for chef and manager tasting.',
        'Envío de muestras para degustación del equipo antes de aprobar.'
      ),
    },
    {
      step: '04',
      title: localize('Implantação', 'Launch & Training', 'Implantación'),
      desc: localize(
        'Entrega do primeiro pedido, utensílios calibrados e treinamento prático.',
        'First order delivery, calibrated brewers, and hands-on team training.',
        'Entrega inicial, utensilios calibrados y capacitación de baristas.'
      ),
    },
    {
      step: '05',
      title: localize('Visitas ao PDV', 'On-Site Visits', 'Visitas al PDV'),
      desc: localize(
        'Consultor dedicado acompanha o estabelecimento com frequência programada.',
        'Dedicated consultant visits on a scheduled cadence focused on results.',
        'Consultor dedicado visita el local con frecuencia programada.'
      ),
    },
    {
      step: '06',
      title: localize('Pós-venda', 'Ongoing Evolution', 'Posventa'),
      desc: localize(
        'Reciclagem contínua da brigada, análise de giro e evolução sazonal da carta.',
        'Continuous team refreshers, sell-through review, and seasonal updates.',
        'Actualización continua de equipo, análisis de rotación y evolución de carta.'
      ),
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="talcha-brand-context-scope"
      data-print-hide="true"
      aria-labelledby="talcha-context-heading"
      className="no-print border-t border-[#E5DACB] dark:border-[#2C241E] bg-[#FAF7F2] dark:bg-[#111A15] py-12 sm:py-16 transition-colors duration-200"
    >
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
          hasEntered ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : 'opacity-0'
        }`}
      >
        {/* Editorial Section Header + Interactive Tab Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8B2635] dark:text-[#E88E9B]">
              <span>talcha.com.br</span>
              <span aria-hidden="true" className="text-[#C68A36]">·</span>
              <span>
                {localize(
                  'Divisão B2B & Origem da Marca',
                  'B2B Division & Brand Heritage',
                  'División B2B e Historia de Marca'
                )}
              </span>
            </div>
            <h2
              id="talcha-context-heading"
              className="font-serif-editorial text-2xl sm:text-4xl font-bold text-[#1E1B18] dark:text-[#FAF7F2] tracking-tight leading-tight text-balance"
            >
              {localize(
                'O chá como ritual, da folha selecionada à xícara servida',
                'Tea as a craft ritual, from single-origin leaf to tableside service',
                'El té como ritual, de la hoja seleccionada a la taza servida'
              )}
            </h2>
            <p className="text-sm sm:text-[15px] text-[#5C564D] dark:text-[#C2B8AA] leading-relaxed">
              {localize(
                'Chás gourmet e mais de 40 origens únicas para hotéis, restaurantes, cafeterias e ações corporativas — do raro Golden Pu-Ehr envelhecido 5 anos na China ao Rooibos da África do Sul.',
                'Specialty single-origin teas across 40+ origins for hospitality, specialty grocers, and corporate gifting — from 5-year aged Golden Pu-Ehr to South African Rooibos.',
                'Tés especiales de más de 40 orígenes únicos para hoteles, restaurantes, cafeterías y empresas — del Golden Pu-Ehr reserva al Rooibos de Sudáfrica.'
              )}
            </p>
          </div>

          <div
            role="tablist"
            aria-label={localize('Seções institucionais Talchá', 'Talchá institutional sections', 'Secciones institucionales Talchá')}
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#181512] border border-[#E5DACB] dark:border-[#332C24] self-start lg:self-end shrink-0"
          >
            {(
              [
                {
                  id: 'modalidades' as const,
                  label: localize('01. Modalidades B2B', '01. B2B Programs', '01. Modalidades B2B'),
                },
                {
                  id: 'processo' as const,
                  label: localize('02. Compromissos & Processo', '02. Commitments & Process', '02. Proceso B2B'),
                },
                {
                  id: 'historia' as const,
                  label: localize('03. História & Lojas SP', '03. Heritage & Boutiques', '03. Historia y Tiendas'),
                },
              ]
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[38px] ${
                    active
                      ? 'bg-[#8B2635] text-white'
                      : 'text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-[#FAF7F2]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: 3 Official Modalities (Servir · Revender · Presentes Corporativos) */}
        {activeTab === 'modalidades' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
            {modalities.map((mod) => {
              const Icon = mod.icon;
              return (
                <article
                  key={mod.id}
                  className="bg-white dark:bg-[#181512] rounded-2xl border border-[#DFD2BF] dark:border-[#332C24] p-6 flex flex-col justify-between gap-6 transition-colors hover:border-[#C68A36]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EFE7DA] dark:border-[#2A231C]">
                      <div className="flex items-center gap-2 text-xs font-medium text-[#696256] dark:text-[#A8A095] min-w-0">
                        <span className="font-bold text-[#8B2635] dark:text-[#F3D78E] tabular-nums shrink-0">
                          {mod.index}
                        </span>
                        <span aria-hidden="true">/</span>
                        <span className="truncate">{mod.audience}</span>
                      </div>
                      <Icon className="w-4 h-4 text-[#C68A36] shrink-0" aria-hidden="true" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-serif-editorial text-2xl font-bold text-[#1E1B18] dark:text-[#FAF7F2]">
                        {mod.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5C564D] dark:text-[#C2B8AA] leading-relaxed">
                        {mod.subtitle}
                      </p>
                    </div>

                    <ul className="space-y-2 pt-1 text-xs text-[#3F3A34] dark:text-[#D5CEC3]">
                      {mod.bullets.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#C68A36] font-bold shrink-0" aria-hidden="true">
                            ·
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-[#EFE7DA] dark:border-[#2A231C] flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={mod.action}
                      className="px-4 py-2.5 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>{mod.ctaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {mod.secondaryAction && mod.secondaryLabel && (
                      <button
                        type="button"
                        onClick={mod.secondaryAction}
                        className="px-3.5 py-2.5 rounded-xl border border-[#DFD2BF] dark:border-[#3C332B] hover:border-[#8B2635] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF7F2] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {mod.secondaryLabel}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* TAB 2: Four Commitments + 6-Step Process */}
        {activeTab === 'processo' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {commitments.map((item) => (
                <div
                  key={item.num}
                  className="bg-white dark:bg-[#181512] rounded-2xl border border-[#DFD2BF] dark:border-[#332C24] p-5 space-y-2"
                >
                  <div className="text-xs font-bold text-[#8B2635] dark:text-[#F3D78E] tabular-nums">
                    {item.num} · {localize('Compromisso Talchá', 'Talchá Commitment', 'Compromiso Talchá')}
                  </div>
                  <h3 className="font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF7F2]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#5C564D] dark:text-[#C2B8AA] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-[#181512] rounded-2xl border border-[#DFD2BF] dark:border-[#332C24] p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#EFE7DA] dark:border-[#2A231C]">
                <div>
                  <h3 className="font-serif-editorial text-xl font-bold text-[#1E1B18] dark:text-[#FAF7F2]">
                    {localize(
                      'Do briefing à xícara, em 6 etapas sem ruído',
                      'From briefing to cup service in 6 clear stages',
                      'Del briefing a la taza en 6 etapas claras'
                    )}
                  </h3>
                  <p className="text-xs text-[#5C564D] dark:text-[#C2B8AA] mt-0.5">
                    {localize(
                      'Atendimento por consultor dedicado com retorno inicial em até 2 dias úteis.',
                      'Dedicated B2B specialist response within 2 business days.',
                      'Atención por consultor dedicado con respuesta en hasta 2 días hábiles.'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenLeadModal?.('amostras', 'Kit de Amostras B2B — Etapa 03')}
                  className="px-4 py-2.5 rounded-xl bg-[#173322] hover:bg-[#1F452E] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
                >
                  <PackageCheck className="w-3.5 h-3.5 text-[#F3D78E]" />
                  <span>{localize('Iniciar pelo Briefing & Amostras', 'Start with Briefing & Samples', 'Solicitar Muestras B2B')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {processSteps.map((st) => (
                  <div
                    key={st.step}
                    className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1914] border border-[#EDE5D8] dark:border-[#2E2720] space-y-1.5"
                  >
                    <div className="text-xs font-bold text-[#8B2635] dark:text-[#E88E9B] tabular-nums">
                      {st.step}. {st.title}
                    </div>
                    <p className="text-xs text-[#4F4940] dark:text-[#D0C8BC] leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Heritage (2008 / 2010 Monica & Mariana) & 2 São Paulo Boutiques */}
        {activeTab === 'historia' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-300">
            <div className="lg:col-span-7 bg-white dark:bg-[#181512] rounded-2xl border border-[#DFD2BF] dark:border-[#332C24] p-6 space-y-5">
              <div className="space-y-1.5 pb-4 border-b border-[#EFE7DA] dark:border-[#2A231C]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#E88E9B]">
                  {localize('Quem Somos · História da Marca', 'About Us · Brand Story', 'Quiénes Somos · Historia')}
                </div>
                <h3 className="font-serif-editorial text-2xl font-bold text-[#1E1B18] dark:text-[#FAF7F2]">
                  {localize(
                    'Da paixão familiar à referência em chás gourmet no Brasil',
                    'From family ritual to Brazil’s leading specialty tea house',
                    'De ritual familiar a referente en tés gourmet en Brasil'
                  )}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1914] border border-[#EDE5D8] dark:border-[#2E2720] space-y-1.5">
                  <div className="font-serif-editorial text-2xl font-bold text-[#8B2635] dark:text-[#F3D78E] tabular-nums">
                    2008 · Paris
                  </div>
                  <p className="text-xs text-[#4F4940] dark:text-[#D0C8BC] leading-relaxed">
                    {localize(
                      'Durante uma viagem a Paris, Monica encantou-se pelas tradicionais casas de chá francesas e decidiu trazer esse universo contemporâneo aos consumidores brasileiros.',
                      'Inspired by Parisian tea salons during a 2008 trip, founder Monica envisioned bringing contemporary loose-leaf tea culture to Brazil.',
                      'En 2008 en París, Monica se inspiró en las casas de té francesas para traer esta experiencia al consumidor brasileño.'
                    )}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1914] border border-[#EDE5D8] dark:border-[#2E2720] space-y-1.5">
                  <div className="font-serif-editorial text-2xl font-bold text-[#173322] dark:text-[#86DA94] tabular-nums">
                    2010 · São Paulo
                  </div>
                  <p className="text-xs text-[#4F4940] dark:text-[#D0C8BC] leading-relaxed">
                    {localize(
                      'Monica e Mariana (mãe e filha) lançam oficialmente a Talchá após a monografia de Economia “A Demanda de Chá no Brasil”, estreando o e-commerce, o canal HORECA e a primeira loja física.',
                      'Monica and daughter Mariana launched Talchá online and in HORECA following Mariana’s economics thesis on Brazilian tea demand, opening the first São Paulo boutique that year.',
                      'Monica y Mariana lanzaron oficialmente Talchá con e-commerce, canal HORECA y su primera tienda en São Paulo.'
                    )}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#5C564D] dark:text-[#C2B8AA] leading-relaxed">
                {localize(
                  'Hoje o menu reúne de raridades como o Golden Pu-Ehr reserva (envelhecido 5 anos em caves na China) e o Purple Tea do Quênia a infusões de Rooibos da África do Sul e a Linha Longevidade — sempre transformando a percepção sobre a segunda bebida mais consumida no mundo.',
                  'Today our curation spans from 5-year cellar-aged Golden Pu-Ehr and Kenyan Purple Tea to South African Rooibos and functional Longevity infusions — redefining the world’s second most consumed beverage.',
                  'Hoy la carta abarca desde el raro Golden Pu-Ehr reserva de 5 años en China hasta Rooibos de Sudáfrica y la Línea Longevidad.'
                )}
              </p>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-[#181512] rounded-2xl border border-[#DFD2BF] dark:border-[#332C24] p-6 flex flex-col justify-between gap-5">
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#EFE7DA] dark:border-[#2A231C]">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#E88E9B]">
                    {localize('2 Lojas Físicas em São Paulo', '2 Boutiques in São Paulo', '2 Tiendas en São Paulo')}
                  </div>
                  <h3 className="font-serif-editorial text-xl font-bold text-[#1E1B18] dark:text-[#FAF7F2] mt-1">
                    {localize('Experiência sensorial presencial & E-commerce nacional', 'In-store sensory displays & nationwide shipping', 'Experiencia presencial y envío nacional')}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1914] border border-[#EDE5D8] dark:border-[#2E2720] space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1E1B18] dark:text-[#FAF7F2]">
                      <MapPin className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B] shrink-0" />
                      <span>Shopping Pátio Higienópolis · Piso Pacaembu</span>
                    </div>
                    <div className="text-xs text-[#5C564D] dark:text-[#C2B8AA] pl-5.5">
                      Av. Higienópolis, 618 · Higienópolis, São Paulo - SP
                    </div>
                    <div className="text-[11px] font-medium text-[#696256] dark:text-[#A8A095] pl-5.5 tabular-nums">
                      (11) 99548-1902 · (11) 3823-3744
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1914] border border-[#EDE5D8] dark:border-[#2E2720] space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1E1B18] dark:text-[#FAF7F2]">
                      <MapPin className="w-3.5 h-3.5 text-[#C68A36] shrink-0" />
                      <span>Shopping JK Iguatemi · São Paulo</span>
                    </div>
                    <div className="text-xs text-[#5C564D] dark:text-[#C2B8AA] pl-5.5">
                      Av. Juscelino Kubitschek, 2041 · Vila Olímpia, São Paulo - SP
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFE7DA] dark:border-[#2A231C] flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.('mapa_flagship');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{localize('Explorar no Mapa', 'Explore on Map', 'Ver en el Mapa')}</span>
                </button>
                <a
                  href="https://talcha.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl border border-[#DFD2BF] dark:border-[#3C332B] hover:border-[#8B2635] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF7F2] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>talcha.com.br</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C68A36]" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Official Direct Channels & Margin Simulator Bar */}
        <div className="mt-6 rounded-2xl bg-white dark:bg-[#181512] border border-[#DFD2BF] dark:border-[#332C24] px-5 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#5C564D] dark:text-[#C2B8AA]">
            <div className="inline-flex items-center gap-1.5 font-semibold text-[#1E1B18] dark:text-[#FAF7F2]">
              <Building2 className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B] shrink-0" />
              <span>{localize('Comercial B2B Talchá:', 'Talchá B2B Desk:', 'Comercial B2B:')}</span>
            </div>
            <a
              href="https://wa.me/5511942286914"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#8B2635] dark:hover:text-[#F3D78E] font-medium tabular-nums transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#2E6B34] dark:text-[#6FD47B] shrink-0" />
              <span>+55 11 94228-6914</span>
            </a>
            <a
              href="mailto:comercial@talcha.com.br"
              className="inline-flex items-center gap-1.5 hover:text-[#8B2635] dark:hover:text-[#F3D78E] font-medium transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#C68A36] shrink-0" />
              <span>comercial@talcha.com.br</span>
            </a>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#94621C] dark:text-[#C68A36] shrink-0" />
              <span>
                {localize(
                  'Seg a sex · 8h às 18h · Resposta em até 2 dias úteis',
                  'Mon–Fri · 8am–6pm · 2 business-day reply',
                  'Lun a vie · 8h–18h · Respuesta en 2 días hábiles'
                )}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                onNavigate?.('simulador');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3C332B] hover:border-[#8B2635] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF7F2] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Award className="w-3.5 h-3.5 text-[#C68A36]" />
              <span>{localize('Simular Margem HORECA', 'Simulate HORECA Margin', 'Simular Margen HORECA')}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
