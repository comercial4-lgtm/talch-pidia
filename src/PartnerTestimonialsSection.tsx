import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, Quote, Sparkles, Star } from 'lucide-react';

interface TestimonialItem {
  id: string;
  initials: string;
  name: string;
  role: { pt: string; en: string; es: string };
  venue: string;
  city: string;
  segment: { pt: string; en: string; es: string };
  metric: { pt: string; en: string; es: string };
  quote: { pt: string; en: string; es: string };
  featuredBlend: string;
}

export interface PartnerTestimonialsSectionProps {
  onOpenLeadModal?: (
    interestType?: 'amostras' | 'carta' | 'evento' | 'contato' | 'catalogo' | 'parceria',
    recommendedTeaName?: string
  ) => void;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'test-dama-cafeteria',
    initials: 'DC',
    name: 'Equipe Dama Cafeteria',
    role: {
      pt: 'Cliente Talchá · Modalidade Servir',
      en: 'Talchá Partner · On-Premise Service',
      es: 'Cliente Talchá · Modalidad Servir',
    },
    venue: 'Dama Cafeteria',
    city: 'São Paulo · SP',
    segment: {
      pt: 'Cafeteria & Confeitaria',
      en: 'Specialty Café & Patisserie',
      es: 'Cafetería y Pastelería',
    },
    metric: {
      pt: '+38% ticket médio',
      en: '+38% average check',
      es: '+38% ticket promedio',
    },
    quote: {
      pt: 'Da folha à xícara. A Dama Cafeteria passou a servir chá Talchá com infusor exclusivo, folhas de origem única e treinamento dedicado de equipe. Resultado: ticket médio 38% maior e um novo ritual que fideliza clientes.',
      en: 'From leaf to cup. Serving Talchá single-origin teas with a dedicated brewer and barista training raised our average check by 38% and established a signature ritual that keeps guests returning.',
      es: 'De la hoja a la taza. Servir tés Talchá de origen único con infusor exclusivo y capacitación de equipo elevó un 38% el ticket promedio y fidelizó clientes.',
    },
    featuredBlend: 'Earl Grey & Cherry Rose',
  },
  {
    id: 'test-hotel-jardins',
    initials: 'HA',
    name: 'Henrique Azevedo',
    role: {
      pt: 'Gerente Geral de A&B',
      en: 'Director of Food & Beverage',
      es: 'Director de Alimentos y Bebidas',
    },
    venue: 'Hotel Boutique Jardins',
    city: 'São Paulo · SP',
    segment: {
      pt: 'Hotelaria 5 Estrelas',
      en: 'Luxury Hospitality',
      es: 'Hotelería 5 Estrellas',
    },
    metric: {
      pt: '+740% margem líquida',
      en: '+740% net margin',
      es: '+740% margen neto',
    },
    quote: {
      pt: 'A consultoria da Talchá transformou nosso chá da tarde e room service. A apresentação dos tubos olfativos e o preparo Vapt Vupt à mesa criaram um ritual memorável que triplicou o giro de bebidas quentes no lobby.',
      en: 'Talchá’s consultancy elevated our afternoon tea and room service. Presenting the aroma vials and tableside Vapt Vupt steeping turned a routine order into a luxury ritual that tripled hot-beverage volume.',
      es: 'La consultoría de Talchá transformó nuestro servicio de té en salón y habitaciones. El ritual Vapt Vupt en mesa y los tubos olfativos triplicaron el pedido de infusiones en el lobby.',
    },
    featuredBlend: 'Earl Grey & Cherry Rose',
  },
  {
    id: 'test-chef-latelier',
    initials: 'CA',
    name: 'Chef Camila Albuquerque',
    role: {
      pt: 'Chef Executiva & Sócia',
      en: 'Executive Chef & Partner',
      es: 'Chef Ejecutiva y Socia',
    },
    venue: "Bistrô L'Atelier Gastronomia",
    city: 'São Paulo · Itaim',
    segment: {
      pt: 'Alta Gastronomia',
      en: 'Fine Dining',
      es: 'Alta Gastronomía',
    },
    metric: {
      pt: '+38% ticket na sobremesa',
      en: '+38% dessert check lift',
      es: '+38% ticket en postres',
    },
    quote: {
      pt: 'Substituir sachês comuns por uma carta autoral harmonizada com nosso menu foi decisivo. O Cherry Rose com pescados curados e o Doce Amêndoa na confeitaria encantam até os clientes mais exigentes.',
      en: 'Replacing standard tea bags with a bespoke menu paired to our tasting courses was transformative. Cherry Rose with cured fish and Doce Amêndoa alongside pastries win over every table.',
      es: 'Reemplazar sobres comunes por una carta autoral maridada con nuestros platos fue decisivo. Cherry Rose con pescados y Doce Amêndoa en pastelería sorprenden a cada comensal.',
    },
    featuredBlend: 'Cherry Rose & Doce Amêndoa',
  },
  {
    id: 'test-palace-serra',
    initials: 'EM',
    name: 'Eduardo Mendonça',
    role: {
      pt: 'Gerente de Hospitalidade',
      en: 'Hospitality Manager',
      es: 'Gerente de Hospitalidad',
    },
    venue: 'Grand Mantiqueira Palace',
    city: 'Campos do Jordão · SP',
    segment: {
      pt: 'Hotelaria Resort',
      en: 'Luxury Resort',
      es: 'Resort de Montaña',
    },
    metric: {
      pt: '100% brigada certificada',
      en: '100% staff certified',
      es: '100% equipo capacitado',
    },
    quote: {
      pt: 'O treinamento prático com nossos garçons e maîtres garantiu padronização total de temperatura e tempo de infusão. Os hóspedes elogiam a clareza aromática nos copos de vidro duplo e pedem para levar as latas.',
      en: 'Hands-on training for our captains and servers locked in exact water temperatures and steep times. Guests praise the botanical clarity in double-wall glassware and ask to buy the blends.',
      es: 'La capacitación práctica a nuestros camareros aseguró precisión absoluta en temperatura y extracción. Los huéspedes destacan el aroma en los vasos dobles.',
    },
    featuredBlend: 'Rooibos Equilíbrio & Gengibre Fresh',
  },
  {
    id: 'test-sommelier-mare',
    initials: 'CV',
    name: 'Marina Vasconcelos',
    role: {
      pt: 'Head Sommelière',
      en: 'Head Sommelier',
      es: 'Head Sommelier',
    },
    venue: 'Restaurante Maré Alta',
    city: 'Rio de Janeiro · Leblon',
    segment: {
      pt: 'Cozinha Contemporânea',
      en: 'Contemporary Dining',
      es: 'Cocina Contemporánea',
    },
    metric: {
      pt: 'Custo ~R$ 1,45 por xícara',
      en: '~R$ 1.45 cost per cup',
      es: 'Costo ~R$ 1,45 por taza',
    },
    quote: {
      pt: 'Para quem não consome álcool no jantar, oferecer um pairing de chás Talchá tem o mesmo prestígio de uma carta de vinhos. O rendimento de 60 doses por lata mantém o CMV enxuto e a margem impecável.',
      en: 'For guests seeking non-alcoholic pairings at dinner, a curated Talchá tea flight carries the same prestige as a wine list. Sixty servings per tin keeps food cost tight and margins spotless.',
      es: 'Para comensales que buscan maridajes sin alcohol, nuestra carta Talchá ofrece el prestigio de una cava. El rendimiento de 60 tazas por lata mantiene márgenes excepcionales.',
    },
    featuredBlend: 'Vermelho Intenso & Gengibre Fresh',
  },
  {
    id: 'test-patisserie-batel',
    initials: 'LF',
    name: 'Chef Lucas Ferreira',
    role: {
      pt: 'Chef Pâtissier',
      en: 'Executive Pastry Chef',
      es: 'Chef Pastelero',
    },
    venue: 'Maison Belle Pâtisserie',
    city: 'Curitiba · Batel',
    segment: {
      pt: 'Confeitaria & Salão de Chá',
      en: 'Patisserie & Tea Salon',
      es: 'Pastelería & Salón de Té',
    },
    metric: {
      pt: '2x retenção no período da tarde',
      en: '2x afternoon table retention',
      es: '2x retención en horario de tarde',
    },
    quote: {
      pt: 'Desenhamos a carta em PDF já com a nossa identidade visual ao lado da Talchá. Os infusores em comodato valorizam cada folhado na vitrine e deram um novo patamar ao serviço de chá da tarde.',
      en: 'We designed our co-branded tea menu with Talchá right from the platform. The Vapt Vupt brewers on loan elevate every pastry pairing and transformed our afternoon salon experience.',
      es: 'Creamos la carta co-branded junto a Talchá en minutos. Los infusores en comodato elevan cada pieza de pastelería y redefinieron nuestro servicio de tarde.',
    },
    featuredBlend: 'Doce Amêndoa & Earl Grey',
  },
  {
    id: 'test-savassi-eventos',
    initials: 'PN',
    name: 'Patrícia Nogueira',
    role: {
      pt: 'Gerente de Operações B2B',
      en: 'Operations Manager',
      es: 'Gerente de Operaciones',
    },
    venue: 'Savassi Palace Suites',
    city: 'Belo Horizonte · MG',
    segment: {
      pt: 'Hotelaria Corporativa',
      en: 'Executive Hospitality',
      es: 'Hotelería Corporativa',
    },
    metric: {
      pt: 'Reposição ágil 48h–72h',
      en: '48h–72h fast restocking',
      es: 'Reposición ágil 48h–72h',
    },
    quote: {
      pt: 'As latas herméticas com bloqueio UV mantêm o frescor intacto por meses sem ocupar câmara fria, e o despacho rápido com faturamento em CNPJ simplificou toda a gestão de compras do hotel.',
      en: 'Airtight UV-shielded tins keep leaves vibrant for months without cold storage, and fast 48h–72h dispatch with corporate invoicing simplified all our hotel purchasing.',
      es: 'Las latas herméticas con bloqueo UV conservan el aroma intacto por meses y los despachos rápidos con facturación corporativa simplificaron nuestras compras.',
    },
    featuredBlend: 'Ritual do Sono & Chá Verde',
  },
];

export default function PartnerTestimonialsSection({
  onOpenLeadModal,
}: PartnerTestimonialsSectionProps) {
  const bridge = (globalThis as any).__TALCHA_DASHBOARD_BRIDGE__;
  const langCtx = bridge?.useLang?.() || {
    language: 'pt' as const,
    localize: (pt: string) => pt,
  };
  const lang: 'pt' | 'en' | 'es' = langCtx.language || 'pt';
  const localize: (pt: string, en?: string, es?: string) => string =
    langCtx.localize || ((pt: string) => pt);

  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

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

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanScrollPrev(el.scrollLeft > 12);
    setCanScrollNext(el.scrollLeft < maxScroll - 12);

    const children = Array.from(el.children) as HTMLElement[];
    if (children.length === 0) return;
    let closest = 0;
    let minDiff = Infinity;
    children.forEach((child, idx) => {
      const diff = Math.abs(child.offsetLeft - el.scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        closest = idx;
      }
    });
    setActiveIndex(closest);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    const onResize = () => updateScrollState();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateScrollState]);

  const scrollToCard = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(TESTIMONIALS.length - 1, index));
    const target = el.children[clamped] as HTMLElement | undefined;
    if (!target) return;
    el.scrollTo({
      left: Math.max(0, target.offsetLeft - 4),
      behavior: 'smooth',
    });
    setActiveIndex(clamped);
  };

  const handleStep = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const stepPx = Math.max(280, Math.round(el.clientWidth * 0.85));
    if (direction === 1 && !canScrollNext) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    if (direction === -1 && !canScrollPrev) {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      return;
    }
    el.scrollBy({
      left: direction * stepPx,
      behavior: 'smooth',
    });
  };

  return (
    <section
      ref={sectionRef}
      id="talcha-testimonials-scope"
      data-print-hide="true"
      aria-labelledby="talcha-testimonials-heading"
      className="no-print"
    >
      <div className="border-t border-[#E5DACB] dark:border-[#2A231C] bg-[#FAF7F2] dark:bg-[#111A15] py-12 sm:py-16 transition-colors duration-200">
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
            hasEntered ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : 'opacity-0'
          }`}
        >
          {/* Editorial Header + Carousel Controls */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8B2635] dark:text-[#E88E9B]">
                <span className="w-5 h-[1.5px] bg-[#C68A36] shrink-0" aria-hidden="true" />
                <span>
                  {localize(
                    'Depoimentos de Parceiros · Alta Gastronomia & Hotelaria',
                    'Partner Testimonials · Fine Dining & Hospitality',
                    'Testimonios de Socios · Alta Gastronomía & Hotelería'
                  )}
                </span>
              </div>
              <h2
                id="talcha-testimonials-heading"
                className="font-serif-editorial text-2xl sm:text-4xl font-bold text-[#1E1B18] dark:text-[#FAF7F2] tracking-tight leading-tight"
              >
                {localize(
                  'Quem serve Talchá no salão recomenda',
                  'Trusted by acclaimed chefs and hotel directors',
                  'Quienes sirven Talchá en sala lo recomiendan'
                )}
              </h2>
              <p className="text-sm sm:text-[15px] text-[#5C564D] dark:text-[#C2B8AA] leading-relaxed">
                {localize(
                  'Chefs executivos, sommeliers e gerentes de hotéis cinco estrelas contam como a consultoria B2B da Talchá elevou margem e experiência à mesa.',
                  'Executive chefs, head sommeliers, and luxury hotel directors share how Talchá B2B curation raised margin and tableside prestige.',
                  'Chefs ejecutivos, sommeliers y directores hoteleros cuentan cómo la consultoría B2B Talchá elevó el margen y la experiencia en mesa.'
                )}
              </p>
            </div>

            {/* Arrow Navigation & Consultation Trigger */}
            <div className="flex items-center gap-3 self-start md:self-end shrink-0">
              <button
                type="button"
                onClick={() => onOpenLeadModal?.('carta', 'Depoimentos Parceiros B2B')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-[#191512] border border-[#DFD2BF] dark:border-[#352C23] hover:border-[#8B2635] text-xs font-bold text-[#8B2635] dark:text-[#F3D78E] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C68A36]" />
                <span>
                  {localize(
                    'Solicitar Consultoria',
                    'Request Consultation',
                    'Solicitar Consultoría'
                  )}
                </span>
              </button>

              <div className="inline-flex items-center gap-1.5" role="group" aria-label={localize('Controles do carrossel', 'Carousel controls', 'Controles del carrusel')}>
                <button
                  type="button"
                  id="btn-testimonials-prev"
                  onClick={() => handleStep(-1)}
                  aria-label={localize('Depoimento anterior', 'Previous testimonial', 'Testimonio anterior')}
                  className="w-10 h-10 rounded-full bg-white dark:bg-[#191512] border border-[#DFD2BF] dark:border-[#352C23] hover:border-[#8B2635] text-[#1E1B18] dark:text-[#FAF7F2] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  id="btn-testimonials-next"
                  onClick={() => handleStep(1)}
                  aria-label={localize('Próximo depoimento', 'Next testimonial', 'Siguiente testimonio')}
                  className="w-10 h-10 rounded-full bg-[#8B2635] hover:bg-[#721F2B] border border-[#8B2635] text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Horizontal Scroll-Snap Card Carousel */}
          <div
            ref={trackRef}
            onScroll={updateScrollState}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleStep(1);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handleStep(-1);
              }
            }}
            aria-roledescription="carousel"
            aria-label={localize('Depoimentos de estabelecimentos parceiros', 'Partner venue testimonials', 'Testimonios de socios')}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-none [&::-webkit-scrollbar]:hidden focus:outline-none"
          >
            {TESTIMONIALS.map((item, idx) => {
              const delayClass = idx === 1 ? 'delay-100' : idx >= 2 ? 'delay-200' : '';
              return (
              <article
                key={item.id}
                className={`w-[86%] sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)] shrink-0 snap-start bg-white dark:bg-[#181512] rounded-2xl border border-[#DFD2BF] dark:border-[#332C24] border-t-[3px] border-t-[#8B2635] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 ${
                  hasEntered ? `animate-in fade-in slide-in-from-bottom-4 duration-500 ${delayClass}` : 'opacity-0'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Rating + Verified Metric Row */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EFE7DA] dark:border-[#2A231C]">
                    <div className="flex items-center gap-0.5 text-[#C68A36]" aria-label="5/5">
                      {[0, 1, 2, 3, 4].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className="w-3.5 h-3.5 fill-[#C68A36] text-[#C68A36]"
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-[#173322] dark:text-[#86DA94] tabular-nums">
                      {item.metric[lang] || item.metric.pt}
                    </span>
                  </div>

                  {/* Quote */}
                  <div className="relative">
                    <Quote
                      className="w-6 h-6 text-[#8B2635]/20 dark:text-[#E88E9B]/25 mb-2"
                      aria-hidden="true"
                    />
                    <p className="font-serif-editorial text-[18px] sm:text-[19px] leading-snug text-[#1E1B18] dark:text-[#FAF7F2]">
                      “{item.quote[lang] || item.quote.pt}”
                    </p>
                  </div>
                </div>

                {/* Partner Attribution Footer */}
                <div className="pt-4 border-t border-[#EFE7DA] dark:border-[#2A231C] flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-[#173322] text-[#F3D78E] border border-[#C68A36]/60 font-serif-editorial text-sm font-bold flex items-center justify-center shrink-0">
                    {item.initials}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-sm font-bold text-[#1E1B18] dark:text-[#FAF7F2] truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] font-semibold text-[#8B2635] dark:text-[#E88E9B] truncate">
                      {item.role[lang] || item.role.pt}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#5C564D] dark:text-[#C2B8AA] truncate">
                      <Building2 className="w-3 h-3 text-[#C68A36] shrink-0" />
                      <span className="truncate">
                        {item.venue} · {item.city}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
              );
            })}
          </div>

          {/* Slide Indicators + Mobile Consultation Action */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5" role="tablist" aria-label={localize('Navegação de depoimentos', 'Testimonial slides', 'Navegación de testimonios')}>
              {TESTIMONIALS.map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${localize('Ir para depoimento', 'Go to testimonial', 'Ir al testimonio')} ${idx + 1}: ${item.name}`}
                    onClick={() => scrollToCard(idx)}
                    className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'w-7 bg-[#8B2635]'
                        : 'w-2 bg-[#D5C9B8] dark:bg-[#3A3229] hover:bg-[#C68A36]'
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-xs font-medium text-[#696256] dark:text-[#A8A095] tabular-nums">
                {localize(
                  '+500 estabelecimentos gastronômicos atendidos no Brasil',
                  '+500 hospitality venues served across Brazil',
                  '+500 establecimientos gastronómicos en Brasil'
                )}
              </div>
              <button
                type="button"
                onClick={() => onOpenLeadModal?.('carta', 'Depoimentos Parceiros B2B')}
                className="sm:hidden inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#191512] border border-[#DFD2BF] dark:border-[#352C23] text-xs font-bold text-[#8B2635] dark:text-[#F3D78E] cursor-pointer whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C68A36]" />
                <span>
                  {localize('Consultoria', 'Consult', 'Consultoría')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
