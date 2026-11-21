/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  Menu,
  X,
  Phone,
  MessageCircle,
  Calculator,
  Compass,
  Award,
  Sparkles,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Clock,
  Thermometer,
  Coffee,
  CheckCircle2,
  Calendar,
  Send,
  Building2,
  ExternalLink,
  ShieldCheck,
  Percent,
  Search,
  ArrowRight,
  Upload,
  Trash2,
  Image as ImageIcon,
  Download,
  FileText,
  BookOpen,
  Network,
  User,
  Bell,
  Sun,
  Moon,
  Monitor,
  Volume2,
  VolumeX,
  Globe,
  Share2
} from 'lucide-react';
import FlavorMap from './FlavorMap';

// Contact & Lead Information Types
interface LeadForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  segment: string;
  interest: string;
  notes: string;
  logoUrl?: string | null;
}

export function FileUploader({
  label = 'Logotipo do Estabelecimento (PNG/JPG)',
  description = 'Carregue seu logo em PNG ou JPG para pré-visualização instantânea na Carta Oficial e na proposta comercial.',
  onFileChange,
}: {
  label?: string;
  description?: string;
  onFileChange?: (dataUrl: string | null, file?: File) => void;
}) {
  const [logoPreview, setLogoPreview] = useState<string | null>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('talcha_carta_client_logo');
    }
    return null;
  });
  const [fileName, setFileName] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('talcha_carta_client_logo_name') || '';
    }
    return '';
  });
  const [fileSize, setFileSize] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('talcha_carta_client_logo_size') || '';
    }
    return '';
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem('talcha_carta_client_logo');
        setLogoPreview(stored);
        setFileName(localStorage.getItem('talcha_carta_client_logo_name') || '');
        setFileSize(localStorage.getItem('talcha_carta_client_logo_size') || '');
      } catch (e) {}
    };
    window.addEventListener('talcha_logo_updated', handleSync);
    return () => window.removeEventListener('talcha_logo_updated', handleSync);
  }, []);

  const handleProcessFile = (file: File) => {
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp|svg)$/i)) {
      alert('Formato de arquivo inválido. Por favor, selecione uma imagem PNG ou JPG.');
      return;
    }
    const sizeKb = Math.round(file.size / 1024);
    const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      setFileName(file.name);
      setFileSize(sizeStr);
      try {
        localStorage.setItem('talcha_carta_client_logo', result);
        localStorage.setItem('talcha_carta_client_logo_name', file.name);
        localStorage.setItem('talcha_carta_client_logo_size', sizeStr);
        window.dispatchEvent(new Event('talcha_logo_updated'));
      } catch (err) {}
      onFileChange?.(result, file);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogoPreview(null);
    setFileName('');
    setFileSize('');
    try {
      localStorage.removeItem('talcha_carta_client_logo');
      localStorage.removeItem('talcha_carta_client_logo_name');
      localStorage.removeItem('talcha_carta_client_logo_size');
      window.dispatchEvent(new Event('talcha_logo_updated'));
    } catch (err) {}
    if (fileInputRef.current) fileInputRef.current.value = '';
    onFileChange?.(null);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleProcessFile(file);
      }}
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        logoPreview
          ? 'border-[#C68A36]/60 bg-[#FAF7F2]'
          : isDragging
          ? 'border-[#8B2635] bg-[#8B2635]/5 ring-2 ring-[#8B2635]'
          : 'border-dashed border-[#DDD5C7] hover:border-[#8B2635] bg-white'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleProcessFile(file);
        }}
        className="hidden"
      />

      {logoPreview ? (
        <div className="flex flex-col sm:flex-row items-center gap-3.5 justify-between">
          <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
            <div className="w-14 h-14 rounded-xl bg-white p-1 border border-[#DDD5C7] shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
              <img src={logoPreview} alt="Logo Estabelecimento" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2E6B34] flex items-center gap-1">
                  ✓ Logo carregado
                </span>
                {fileSize && (
                  <span className="text-[10px] font-semibold text-[#8A8275] bg-[#EFE9DF] px-1.5 py-0.5 rounded">
                    {fileSize}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-[#1E1B18] truncate mt-0.5">
                {fileName || 'logo-estabelecimento.png'}
              </p>
              <p className="text-[11px] text-[#706B63] mt-0.5">
                Pré-visualização ativa para carta oficial e proposta comercial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5DACB]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-[#DDD5C7] text-[#1E1B18] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-[#8B2635] hover:bg-[#8B2635]/10 transition-colors cursor-pointer"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 cursor-pointer group"
        >
          <div className="flex items-center gap-3 text-left w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-[#8B2635]/10 group-hover:bg-[#8B2635]/20 text-[#8B2635] flex items-center justify-center shrink-0 transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1E1B18] group-hover:text-[#8B2635] transition-colors">
                {label}
              </p>
              <p className="text-[11px] text-[#706B63] mt-0.5">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Selecionar Logo</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'curador' | 'curadoria' | 'carta' | 'infusao' | 'catalogo' | 'mapa_sabores' | 'calculadora' | 'consultoria'>('curador');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [maisOpen, setMaisOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'pt' | 'en' | 'es'>('pt');
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('system');
  const [audioMuted, setAudioMuted] = useState(true);

  // Profit Simulator State
  const [cupSalePrice, setCupSalePrice] = useState(16);
  const [dailyCups, setDailyCups] = useState(25);
  const costPerCup = 1.45;

  // Event Calculator State
  const [guestsCount, setGuestsCount] = useState(120);
  const [eventType, setEventType] = useState<'quente' | 'gelado' | 'ambos'>('ambos');

  // Sommelier Harmonizer State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todos' | 'carnes' | 'pescados' | 'sobremesas' | 'digestivos'>('todos');

  // Contact Form State
  const [leadForm, setLeadForm] = useState<LeadForm>({
    name: '',
    company: '',
    email: '',
    phone: '',
    city: 'São Paulo',
    segment: 'restaurante',
    interest: 'carta_completa',
    notes: '',
  });

  // Track window scroll for elevated navbar shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme Sync
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else if (themeMode === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.style.colorScheme = 'light';
    } else {
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour >= 18;
      if (isNight) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.style.colorScheme = 'light';
      }
    }
  }, [themeMode]);

  // Commercial WhatsApp Link Helper
  const getWhatsAppUrl = (message?: string) => {
    const text = message || `Olá! Vim através da Talchápidia B2B e gostaria de conversar sobre a carta de chás para o meu estabelecimento.`;
    return `https://wa.me/5511925963961?text=${encodeURIComponent(text)}`;
  };

  // Handle Lead Form Submission
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const storedLogo = typeof localStorage !== 'undefined' ? localStorage.getItem('talcha_carta_client_logo') : null;
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadForm,
          logoUrl: leadForm.logoUrl || storedLogo,
          source: 'Talchápidia Header Nav',
          createdAt: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.warn('Lead save fallback:', err);
    }
    setContactSubmitted(true);
  };

  // Calculations
  const cupsPerMonth = dailyCups * 30;
  const monthlyRevenue = cupsPerMonth * cupSalePrice;
  const monthlyCost = cupsPerMonth * costPerCup;
  const monthlyProfit = monthlyRevenue - monthlyCost;
  const marginPercentage = Math.round(((cupSalePrice - costPerCup) / cupSalePrice) * 100);

  // Event Calculations (approx 250ml per cup, 2 cups per guest)
  const totalLiters = Math.round((guestsCount * 0.4));
  const gramsNeeded = Math.round(totalLiters * 12);
  const tinsNeeded = Math.ceil(gramsNeeded / 100);

  // Core Teas Data for Curadoria
  const curatedTeas = [
    {
      id: 'earl-grey',
      name: 'Earl Grey Especial',
      category: 'carnes',
      categoryLabel: 'Carnes Nobres & Massas',
      type: 'Chá Preto do Ceilão',
      headline: 'Encorpado com óleo natural de bergamota prensada a frio',
      pairings: 'Carnes grelhadas, risotos densos, cordeiro, queijos curados e sobremesas de cacau 70%.',
      ritual: '95°C · 3-4 min · Infusor Vapt Vupt',
      image: '/assets/creamearlgrey-yC8DmIAI.jpg',
      badge: 'Campeão de Vendas B2B',
    },
    {
      id: 'cherry-rose',
      name: 'Cherry Rose',
      category: 'pescados',
      categoryLabel: 'Pescados & Frutos do Mar',
      type: 'Chá Verde Japonês & Flor de Cerejeira',
      headline: 'Frescor vegetal de alta altitude com pétalas de rosas silvestres',
      pairings: 'Sushi, robata de salmão, ceviches peruanos, ostras e saladas com cítricos.',
      ritual: '75°C · 2-3 min · Copo de vidro duplo',
      image: '/assets/cha-verde-cherry-rose-talcha-D4nTpJYj.jpg',
      badge: 'Harmonização de Estrela',
    },
    {
      id: 'doce-amendoa',
      name: 'Doce Amêndoa',
      category: 'sobremesas',
      categoryLabel: 'Sobremesas & Confeitaria',
      type: 'Infusão Nobre sem Cafeína',
      headline: 'Maçã assada, amêndoas caramelizadas, canela e beterraba natural',
      pairings: 'Tortas quentes de maçã, fondues, pudim de leite, waffles e sobremesas com sorvete.',
      ritual: '100°C · 5-8 min · Xícara transparente',
      image: '/assets/doceamendoa-BlMYaqBT.jpg',
      badge: 'Aroma Inesquecível',
    },
    {
      id: 'gengibre-fresh',
      name: 'Gengibre Fresh',
      category: 'digestivos',
      categoryLabel: 'Digestivos & Refrescantes',
      type: 'Infusão Herbal Digestiva',
      headline: 'Gengibre aromático, capim-limão, hortelã e pimenta-rosa',
      pairings: 'Pós-refeição, culinária asiática picante, ceviches e drinks contemporâneos sem álcool.',
      ritual: '100°C · 5-6 min · Serviço quente ou com gelo',
      image: '/assets/infusaofrescor-DEKs3cbB.jpg',
      badge: 'Pós-Refeição Essencial',
    },
  ];

  const filteredTeas = curatedTeas.filter((tea) => {
    const matchesCategory = selectedCategory === 'todos' || tea.category === selectedCategory;
    const matchesSearch =
      tea.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tea.pairings.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tea.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const [downloadingCarta, setDownloadingCarta] = useState(false);

  const handleDownloadCartaPdf = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setDownloadingCarta(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const venueName = leadForm.company.trim() || 'Estabelecimento Parceiro';
      const logo = leadForm.logoUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem('talcha_carta_client_logo') : null);

      // Page background: Ivory #FAF8F5
      doc.setFillColor(250, 248, 245);
      doc.rect(0, 0, 210, 297, 'F');

      // Top Ribbon (Burgundy #8B2635 & Gold #C68A36)
      doc.setFillColor(139, 38, 53);
      doc.rect(0, 0, 210, 4.5, 'F');
      doc.setFillColor(198, 138, 54);
      doc.rect(0, 4.5, 210, 0.8, 'F');

      // Header Emblem & Brand
      const startY = 14;
      doc.setFillColor(139, 38, 53);
      doc.circle(18.5, startY + 4.5, 4.5, 'F');
      doc.setDrawColor(198, 138, 54);
      doc.setLineWidth(0.3);
      doc.circle(18.5, startY + 4.5, 5.1, 'S');

      // Talchá Title
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(139, 38, 53);
      doc.text('talchá', 26, startY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(198, 138, 54);
      doc.text('·  CHÁS ESPECIAIS & ALTA GASTRONOMIA', 47, startY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(102, 96, 86);
      doc.text('Chás Especiais de Origem · Desde 2010 · Curadoria Oficial B2B', 26, startY + 9);

      // Official Badge
      doc.setFillColor(139, 38, 53);
      doc.roundedRect(144, startY - 1, 52, 6.5, 1.2, 1.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('DOCUMENTO OFICIAL B2B', 170, startY + 3.3, { align: 'center' });

      // Venue Co-branding Card
      let y = startY + 18;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, y, 182, 22, 2, 2, 'F');
      doc.setDrawColor(226, 218, 206);
      doc.setLineWidth(0.3);
      doc.roundedRect(14, y, 182, 22, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(139, 38, 53);
      doc.text(
        logo ? 'ESTABELECIMENTO PARCEIRO · CO-BRANDING OFICIAL' : 'ESTABELECIMENTO PARCEIRO',
        18,
        y + 5
      );

      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 27, 24);
      doc.text(venueName.toUpperCase(), 18, y + 10.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(102, 96, 86);
      doc.text('Curadoria Gastronômica Personalizada · Padrão de Serviço Vapt Vupt', 18, y + 16);

      // Client Logo in Co-Branding Box
      if (logo) {
        try {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(151, y + 2, 42, 18, 1.2, 1.2, 'F');
          doc.setDrawColor(198, 138, 54);
          doc.setLineWidth(0.35);
          doc.roundedRect(151, y + 2, 42, 18, 1.2, 1.2, 'S');

          const format = logo.indexOf('image/png') !== -1 ? 'PNG' : 'JPEG';
          doc.addImage(logo, format, 153, y + 3, 38, 16, undefined, 'FAST');
        } catch (err) {
          console.warn('Could not render logo in PDF:', err);
        }
      }

      // Selected Teas Section
      y += 28;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(139, 38, 53);
      doc.text('BLENDS NOBRES SELECIONADOS PARA A CARTA DE SALÃO', 14, y);

      y += 5;
      curatedTeas.forEach((tea) => {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(14, y, 182, 28, 1.5, 1.5, 'F');
        doc.setDrawColor(226, 218, 206);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, y, 182, 28, 1.5, 1.5, 'S');

        doc.setFont('times', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(139, 38, 53);
        doc.text(tea.name, 18, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(102, 96, 86);
        doc.text(tea.type, 18, y + 10.5);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 27, 24);
        doc.text(`"${tea.headline}"`, 18, y + 15.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(198, 138, 54);
        doc.text('Harmonização: ', 18, y + 20.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 45, 40);
        const splitPairings = doc.splitTextToSize(tea.pairings, 110);
        doc.text(splitPairings[0] || '', 36, y + 20.5);

        doc.setFillColor(247, 241, 232);
        doc.roundedRect(132, y + 16, 60, 8, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(46, 107, 52);
        doc.text(`✓ ${tea.ritual}`, 162, y + 21.2, { align: 'center' });

        y += 31;
      });

      // Footer
      doc.setDrawColor(226, 218, 206);
      doc.setLineWidth(0.3);
      doc.line(14, 285, 196, 285);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(102, 96, 86);
      doc.text('Talchá Chás Especiais B2B · comercial4@talcha.com.br · (11) 92596-3961 · www.talcha.com.br', 14, 289.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Página 1 de 1', 196, 289.5, { align: 'right' });

      const fileName = `Talcha_Carta_de_Chas_${venueName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Error downloading carta PDF:', err);
    } finally {
      setDownloadingCarta(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1B18] font-sans antialiased selection:bg-[#EBE4D8] selection:text-[#173322]">
      {/* ─────────────────────────────────────────────────────────────────────────────
          CABEÇALHO OFICIAL TALCHAPIDIA (100% IDENTICAL TO REFERENCE PROJECT)
      ───────────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF7F2]/95 dark:bg-[#111A15]/95 backdrop-blur-md border-b border-[#EBE4D8] dark:border-[#243328] transition-colors duration-200 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-20 gap-2 lg:gap-3">
            {/* 1. BRAND LOGO (TALCHAPIDIA WITH TEACUP ICON) */}
            <div
              onClick={() => {
                setActiveTab('curador');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0 min-h-[44px] py-1 select-none"
              id="brand-home-link"
            >
              {/* Circular Emblem with Teacup SVG */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1E1B18] dark:bg-[#FAF8F5] text-white dark:text-[#1E1B18] flex items-center justify-center p-1.5 sm:p-2 shadow-xs transition-transform group-hover:scale-105 shrink-0">
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

              {/* Brand Typography */}
              <div className="shrink-0 text-left">
                <span className="font-serif-editorial text-lg sm:text-xl xl:text-2xl font-bold tracking-tight text-[#1E1B18] dark:text-[#FAF8F5] block leading-none">
                  Talchápidia
                </span>
                <p className="text-[9px] xl:text-[10px] uppercase tracking-wider text-[#706B63] dark:text-[#A8A095] font-medium hidden sm:block mt-0.5 leading-none whitespace-nowrap">
                  Guia Sensorial B2B
                </p>
              </div>
            </div>

            {/* 2. PILL NAVIGATION BAR */}
            <nav className="hidden lg:flex items-center gap-0.5 bg-[#F3ECE1]/70 dark:bg-[#1F1C18]/90 p-1 rounded-full border border-[#E5DDD0] dark:border-[#332D26] shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('curador');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[34px] flex items-center shrink-0 cursor-pointer ${
                  activeTab === 'curador' || activeTab === 'curadoria'
                    ? 'bg-white dark:bg-[#2B2620] text-[#1E1B18] dark:text-[#FAF8F5] shadow-xs font-semibold'
                    : 'text-[#5C564D] dark:text-[#A8A095] hover:text-[#1E1B18] dark:hover:text-white'
                }`}
                id="nav-curador"
              >
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 shrink-0 text-[#8B2635] dark:text-[#E88E9B]" />
                  <span className="whitespace-nowrap">Curador</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('carta');
                  setContactSubmitted(false);
                  setContactModalOpen(true);
                }}
                className={`px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[34px] flex items-center shrink-0 cursor-pointer ${
                  activeTab === 'carta'
                    ? 'bg-white dark:bg-[#2B2620] text-[#1E1B18] dark:text-[#FAF8F5] shadow-xs font-semibold'
                    : 'text-[#5C564D] dark:text-[#A8A095] hover:text-[#1E1B18] dark:hover:text-white'
                }`}
                id="nav-carta"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 shrink-0 text-[#2E6B34] dark:text-[#6FD47B]" />
                  <span className="whitespace-nowrap">Carta B2B</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('infusao');
                  document.getElementById('secao-conteudo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[34px] flex items-center shrink-0 cursor-pointer ${
                  activeTab === 'infusao'
                    ? 'bg-white dark:bg-[#2B2620] text-[#1E1B18] dark:text-[#FAF8F5] shadow-xs font-semibold'
                    : 'text-[#5C564D] dark:text-[#A8A095] hover:text-[#1E1B18] dark:hover:text-white'
                }`}
                id="nav-infusao"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-[#B87333] dark:text-[#E5A967]" />
                  <span className="whitespace-nowrap">Infusão</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('catalogo');
                  document.getElementById('secao-conteudo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[34px] flex items-center shrink-0 cursor-pointer ${
                  activeTab === 'catalogo'
                    ? 'bg-white dark:bg-[#2B2620] text-[#1E1B18] dark:text-[#FAF8F5] shadow-xs font-semibold'
                    : 'text-[#5C564D] dark:text-[#A8A095] hover:text-[#1E1B18] dark:hover:text-white'
                }`}
                id="nav-catalogo"
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 shrink-0 text-[#706B63] dark:text-[#C4BCB1]" />
                  <span className="whitespace-nowrap">Catálogo</span>
                </span>
              </button>

              {/* 'Mais' Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMaisOpen(!maisOpen)}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all min-h-[34px] flex items-center gap-1 shrink-0 cursor-pointer ${
                    ['mapa_sabores', 'calculadora', 'consultoria'].includes(activeTab)
                      ? 'bg-white dark:bg-[#2B2620] text-[#1E1B18] dark:text-[#FAF8F5] shadow-xs font-semibold'
                      : 'text-[#5C564D] dark:text-[#A8A095] hover:text-[#1E1B18] dark:hover:text-white'
                  }`}
                  aria-expanded={maisOpen}
                >
                  <span>Mais</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${maisOpen ? 'rotate-180' : ''}`} />
                </button>

                {maisOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E1B18] border border-[#DDD5C7] dark:border-[#383229] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#706B63] dark:text-[#A8A095]">
                      Outras Ferramentas
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('mapa_sabores');
                        setMaisOpen(false);
                        document.getElementById('secao-conteudo')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        activeTab === 'mapa_sabores'
                          ? 'bg-[#1E1B18] dark:bg-[#8B2635] text-white font-semibold'
                          : 'text-[#1E1B18] dark:text-[#FAF8F5] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Network className="w-4 h-4 shrink-0 text-[#8B2635] dark:text-[#E88E9B]" />
                      <div className="min-w-0">
                        <span className="block truncate font-medium">Mapa de Sabores B2B</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('calculadora');
                        setMaisOpen(false);
                        document.getElementById('secao-conteudo')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        activeTab === 'calculadora'
                          ? 'bg-[#1E1B18] dark:bg-[#8B2635] text-white font-semibold'
                          : 'text-[#1E1B18] dark:text-[#FAF8F5] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Calculator className="w-4 h-4 shrink-0 text-[#2E6B34] dark:text-[#6FD47B]" />
                      <div className="min-w-0">
                        <span className="block truncate font-medium">Simulador de Margem (+700%)</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('consultoria');
                        setMaisOpen(false);
                        document.getElementById('secao-conteudo')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        activeTab === 'consultoria'
                          ? 'bg-[#1E1B18] dark:bg-[#8B2635] text-white font-semibold'
                          : 'text-[#1E1B18] dark:text-[#FAF8F5] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Award className="w-4 h-4 shrink-0 text-[#C48021] dark:text-[#F3BA68]" />
                      <div className="min-w-0">
                        <span className="block truncate font-medium">Consultoria & Treinamento</span>
                      </div>
                    </button>

                    <div className="border-t border-[#EBE4D8] dark:border-[#2C2620] my-1" />

                    <a
                      href={getWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMaisOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#2E6B34] dark:text-[#6FD47B] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>WhatsApp B2B Oficial</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setMaisOpen(false);
                        setContactSubmitted(false);
                        setContactModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#1E1B18] dark:text-[#FAF8F5] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left font-medium"
                    >
                      <User className="w-4 h-4 shrink-0 text-[#2E6B34] dark:text-[#6FD47B]" />
                      <span>Acesso B2B (Google / Apple)</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* 3. RIGHT SIDE CONTROLS & CTA */}
            <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
              {/* Entrar Button */}
              <button
                type="button"
                onClick={() => {
                  setContactSubmitted(false);
                  setContactModalOpen(true);
                }}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shadow-2xs transition-all shrink-0 text-xs font-semibold min-h-[34px] cursor-pointer border-[#D9C4A2] dark:border-[#4A3B28] bg-[#FAF5EB] dark:bg-[#251E16] text-[#7A5B2E] dark:text-[#E0BC75] hover:bg-[#F4ECE0] dark:hover:bg-[#30261C]"
                title="Acesso B2B Seguro (Google / Apple)"
                id="header-auth-btn"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap max-w-[80px] truncate">Entrar</span>
              </button>

              {/* Language Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#DDD5C7] dark:border-[#38322A] bg-white/80 dark:bg-[#221E1A] text-xs font-semibold text-[#4A453E] dark:text-[#D4CCC0] hover:bg-white dark:hover:bg-[#2C2722] min-h-[34px] cursor-pointer"
                  title="Selecionar Idioma"
                >
                  <Globe className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B]" />
                  <span className="uppercase text-[11px] font-bold">{language}</span>
                </button>
                {langMenuOpen && (
                  <div className="absolute right-0 mt-1 w-28 rounded-xl bg-white dark:bg-[#1E1B18] border border-[#DDD5C7] dark:border-[#383229] shadow-lg p-1 z-50 text-xs">
                    {(['pt', 'en', 'es'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          setLanguage(l);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                          language === l
                            ? 'bg-[#8B2635] text-white font-bold'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#1E1B18] dark:text-[#FAF8F5]'
                        }`}
                      >
                        {l === 'pt' ? '🇧🇷 PT-BR' : l === 'en' ? '🇺🇸 English' : '🇪🇸 Español'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Push Notification Bell */}
              <button
                type="button"
                onClick={() => alert('Alertas B2B: Notificações ativas sobre estoques e lançamentos de safras exclusivas.')}
                className="hidden sm:flex relative min-w-[34px] min-h-[34px] p-2 rounded-lg border border-[#DDD5C7] dark:border-[#38322A] bg-white/80 dark:bg-[#221E1A] text-[#4A453E] dark:text-[#D4CCC0] hover:text-[#1E1B18] dark:hover:text-white hover:bg-white dark:hover:bg-[#2C2722] shadow-2xs transition-all shrink-0 items-center justify-center cursor-pointer"
                title="Alertas Push de Estoque & Lançamentos"
                id="header-notification-btn"
              >
                <Bell className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B]" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8B2635] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#12110F] animate-pulse">
                  1
                </span>
              </button>

              {/* Theme Toggle Group */}
              <div className="hidden xl:inline-flex items-center shrink-0 rounded-lg bg-[#FAF8F5] dark:bg-[#201D19] border border-[#DDD5C7] dark:border-[#383229] p-0.5 shadow-2xs select-none">
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`px-1.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-white dark:bg-[#2B2620] text-[#1E1B18] dark:text-white shadow-xs font-semibold'
                      : 'text-[#706B63] dark:text-[#A8A095] hover:text-[#1E1B18]'
                  }`}
                  title="Modo Claro"
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`px-1.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-white dark:bg-[#2B2620] text-[#1E1B18] dark:text-white shadow-xs font-semibold'
                      : 'text-[#706B63] dark:text-[#A8A095] hover:text-[#1E1B18]'
                  }`}
                  title="Modo Escuro"
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('system')}
                  className={`px-1.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    themeMode === 'system'
                      ? 'bg-white dark:bg-[#2B2620] text-[#1E1B18] dark:text-white shadow-xs font-semibold'
                      : 'text-[#706B63] dark:text-[#A8A095] hover:text-[#1E1B18]'
                  }`}
                  title="Modo Automático / Sistema"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Audio Toggle */}
              <button
                type="button"
                onClick={() => setAudioMuted(!audioMuted)}
                className="hidden sm:flex min-w-[34px] min-h-[34px] p-2 rounded-lg border border-[#DDD5C7] dark:border-[#38322A] bg-white/80 dark:bg-[#221E1A] text-[#4A453E] dark:text-[#D4CCC0] hover:text-[#1E1B18] hover:bg-white transition-all shrink-0 items-center justify-center cursor-pointer"
                title={audioMuted ? 'Ativar Som Ambiente' : 'Desativar Som Ambiente'}
              >
                {audioMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-[#706B63]" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#2E6B34]" />
                )}
              </button>

              {/* Monte sua Carta CTA Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('carta');
                  setContactSubmitted(false);
                  setContactModalOpen(true);
                }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md active:scale-95 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                id="btn-monte-sua-carta"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Monte sua Carta</span>
              </button>

              {/* Mobile Menu Hamburger */}
              <div className="flex items-center lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl text-[#1E1B18] dark:text-[#FAF8F5] hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none"
                  aria-label="Abrir menu de navegação"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────────
            MOBILE DROPDOWN DRAWER
        ───────────────────────────────────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#E5DACB] dark:border-[#2C2620] bg-[#FAF7F2] dark:bg-[#1E1B18] px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fadeIn">
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('curador');
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${
                  activeTab === 'curador' || activeTab === 'curadoria'
                    ? 'bg-[#8B2635]/10 text-[#8B2635] font-semibold'
                    : 'bg-white/60 dark:bg-black/20 text-[#1E1B18] dark:text-[#FAF8F5]'
                }`}
              >
                <Compass className="w-5 h-5 text-[#8B2635]" />
                <div>
                  <strong className="block text-sm">Curador</strong>
                  <span className="text-xs text-[#706B63] dark:text-[#A8A095]">Curadoria Sommelier & Blends Nobres</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('mapa_sabores');
                  setMobileMenuOpen(false);
                  document.getElementById('secao-conteudo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${
                  activeTab === 'mapa_sabores'
                    ? 'bg-[#8B2635]/10 text-[#8B2635] font-semibold'
                    : 'bg-white/60 dark:bg-black/20 text-[#1E1B18] dark:text-[#FAF8F5]'
                }`}
              >
                <Network className="w-5 h-5 text-[#8B2635]" />
                <div>
                  <strong className="block text-sm">Mapa de Sabores B2B</strong>
                  <span className="text-xs text-[#706B63] dark:text-[#A8A095]">Rede interativa e sensorial de harmonizações</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('carta');
                  setMobileMenuOpen(false);
                  setContactSubmitted(false);
                  setContactModalOpen(true);
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${
                  activeTab === 'carta'
                    ? 'bg-[#8B2635]/10 text-[#8B2635] font-semibold'
                    : 'bg-white/60 dark:bg-black/20 text-[#1E1B18] dark:text-[#FAF8F5]'
                }`}
              >
                <FileText className="w-5 h-5 text-[#2E6B34]" />
                <div>
                  <strong className="block text-sm">Carta B2B & Download PDF</strong>
                  <span className="text-xs text-[#706B63] dark:text-[#A8A095]">Monte sua carta personalizada com logo</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('calculadora');
                  setMobileMenuOpen(false);
                  document.getElementById('secao-conteudo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${
                  activeTab === 'calculadora'
                    ? 'bg-[#8B2635]/10 text-[#8B2635] font-semibold'
                    : 'bg-white/60 dark:bg-black/20 text-[#1E1B18] dark:text-[#FAF8F5]'
                }`}
              >
                <Calculator className="w-5 h-5 text-[#2E6B34]" />
                <div>
                  <strong className="block text-sm">Calculadora de Margem</strong>
                  <span className="text-xs text-[#706B63] dark:text-[#A8A095]">Simule +700% de margem e ROI para o salão</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('consultoria');
                  setMobileMenuOpen(false);
                  document.getElementById('secao-conteudo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-colors ${
                  activeTab === 'consultoria'
                    ? 'bg-[#8B2635]/10 text-[#8B2635] font-semibold'
                    : 'bg-white/60 dark:bg-black/20 text-[#1E1B18] dark:text-[#FAF8F5]'
                }`}
              >
                <Award className="w-5 h-5 text-[#C48021]" />
                <div>
                  <strong className="block text-sm">Consultoria & Treinamento</strong>
                  <span className="text-xs text-[#706B63] dark:text-[#A8A095]">Rituais Vapt Vupt e capacitação de brigada</span>
                </div>
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="pt-2 border-t border-[#E5DACB] dark:border-[#2C2620] flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setContactSubmitted(false);
                  setContactModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#8B2635] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Monte sua Carta & Download PDF</span>
              </button>

              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-[#2E6B34] text-[#2E6B34] dark:text-[#6FD47B] text-xs font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Comercial Direto</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          CINEMATIC HERO BANNER
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#140F0D] text-white border-b border-[#2C211B] py-16 lg:py-24">
        {/* Background Cinematic Photography with Drift Animation & Dark Warm Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src="/assets/hero_tea_cinematic_1790696331284-CUI9AcbG.jpg"
            alt="Cerimônia e infusão cinematográfica de chá especial Talchá"
            className="w-full h-full object-cover object-center opacity-40 animate-cinematic-drift scale-105"
          />
          {/* Multi-layered Vignette & Editorial Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#140F0D] via-[#140F0D]/90 to-[#140F0D]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140F0D] via-transparent to-[#140F0D]/60" />
          <div className="absolute inset-0 bg-radial-[at_75%_30%] from-amber-600/15 via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Editorial Headline & Value Propositions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#F5C469] text-xs font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#F5C469] animate-pulse" />
                <span>Pioneira em Chás Especiais desde 2010 · +500 Clientes B2B</span>
              </div>

              <h1 className="font-serif-editorial text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08]">
                A arte e a alta rentabilidade do chá no seu{' '}
                <span className="text-[#F5C469] italic">restaurante ou hotel</span>.
              </h1>

              <p className="text-base sm:text-lg text-[#DDD5C7] leading-relaxed max-w-2xl font-light">
                Cartas de chás autorais, serviço à mesa com o espetacular infusor <strong className="text-white font-semibold">Vapt Vupt</strong> transparente, treinamento completo de brigada e margens líquidas superiores a <strong className="text-[#6FD47B] font-semibold">+700%</strong>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('curadoria');
                    document.getElementById('secao-conteudo')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3.5 rounded-xl bg-[#8B2635] hover:bg-[#A32F40] text-white font-semibold text-sm shadow-lg hover:shadow-[#8B2635]/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Explorar Curadoria de Blends</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('calculadora');
                    document.getElementById('secao-conteudo')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-[#6FD47B]" />
                  <span>Simular Lucro (+700%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setContactSubmitted(false);
                    setContactModalOpen(true);
                  }}
                  className="px-4 py-3.5 rounded-xl text-xs font-semibold text-[#DDD5C7] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Falar com o Comercial</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div>
                  <strong className="block text-xl sm:text-2xl font-bold font-serif-editorial text-white">80+</strong>
                  <span className="text-xs text-[#A8A095]">Blends Nobres & Folhas</span>
                </div>
                <div>
                  <strong className="block text-xl sm:text-2xl font-bold font-serif-editorial text-[#6FD47B]">+700%</strong>
                  <span className="text-xs text-[#A8A095]">Margem Média Salão</span>
                </div>
                <div>
                  <strong className="block text-xl sm:text-2xl font-bold font-serif-editorial text-white">R$ 1,45</strong>
                  <span className="text-xs text-[#A8A095]">Custo Médio / Infusão</span>
                </div>
                <div>
                  <strong className="block text-xl sm:text-2xl font-bold font-serif-editorial text-[#F5C469]">Vapt Vupt</strong>
                  <span className="text-xs text-[#A8A095]">Ritual de Mesa Sem Pingar</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Cinematic Showcase Card with Glass Badges */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-[#1C1614] group">
                {/* Main Cinematic Image: Pour & Double-Glass Infusion */}
                <img
                  src="/assets/hero_tea_pour_desktop_1790696437398-b0NvJpnD.jpg"
                  alt="Ritual cinematográfico do chá Talchá sendo servido"
                  className="w-full h-[380px] sm:h-[460px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Subtle Amber Vignette on Card */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Top Floating Glass Badge */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <div className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#6FD47B] animate-ping" />
                    <span>Ritual de Serviço à Mesa</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#F5C469] bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    Padrão Talchá
                  </span>
                </div>

                {/* Bottom Floating Glass Card with Real Metrics */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 text-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#A8A095] block">
                        Experiência Gastronômica
                      </span>
                      <strong className="font-serif-editorial text-lg text-white">
                        Infusão Cristalina sem Pingar
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#6FD47B] font-bold uppercase block">Margem Bruta</span>
                      <strong className="text-lg font-bold text-[#6FD47B] font-serif-editorial">728%</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#DDD5C7] leading-relaxed">
                    Apoiado diretamente sobre a xícara ou copo térmico de vidro duplo: liberação imediata e aroma espetacular no salão.
                  </p>
                </div>
              </div>

              {/* Decorative Warm Ambient Glow Behind Card */}
              <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-[#8B2635]/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -top-6 -left-6 w-64 h-64 bg-[#C68A36]/20 rounded-full blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MAIN CONTENT AREA (CONTROLLED BY NAVIGATION HEADER)
      ───────────────────────────────────────────────────────────────────────────── */}
      <main id="secao-conteudo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Navigation Tab Indicator */}
        <div className="flex items-center justify-between border-b border-[#E5DACB] pb-4 mb-10">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#8B2635]">Seção Ativa</span>
            <h2 className="font-serif-editorial text-3xl font-bold text-[#1E1B18] capitalize">
              {activeTab === 'consultoria' && 'Consultoria & Soluções B2B'}
              {activeTab === 'curadoria' && 'Curadoria & Harmonização Gastronômica'}
              {activeTab === 'calculadora' && 'Calculadora de Margem & Volume'}
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-[#EBE4D8]/60 p-1 rounded-xl">
            {(['consultoria', 'curadoria', 'calculadora'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white text-[#8B2635] shadow-xs'
                    : 'text-[#635B4E] hover:text-[#1E1B18]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────────
            0. ABA MAPA DE SABORES B2B
        ───────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'mapa_sabores' && (
          <div className="space-y-6 animate-fadeIn">
            <FlavorMap
              onSelectBlendForCarta={() => {
                setActiveTab('carta');
                setContactSubmitted(false);
                setContactModalOpen(true);
              }}
              onOpenLeadModal={() => {
                setContactSubmitted(false);
                setContactModalOpen(true);
              }}
            />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────
            1. ABA CURADORIA / CURADOR
        ───────────────────────────────────────────────────────────────────────── */}
        {(activeTab === 'curadoria' || activeTab === 'curador') && (
          <div className="space-y-10 animate-fadeIn">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5DACB] shadow-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8A8275] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por prato (ex: salmão, carne, risoto, chocolate)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-transparent border-0 focus:ring-0 text-[#1E1B18] placeholder-[#A8A095]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t sm:border-t-0 sm:border-l border-[#E5DACB] pt-3 sm:pt-0 sm:pl-4">
                {(['todos', 'carnes', 'pescados', 'sobremesas', 'digestivos'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#8B2635] text-white'
                        : 'bg-[#FAF7F2] text-[#635B4E] hover:bg-[#EBE4D8]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Curated Tea Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTeas.map((tea) => (
                <div
                  key={tea.id}
                  className="bg-white rounded-3xl border border-[#E5DACB] overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C68A36]">
                          {tea.categoryLabel}
                        </span>
                        <h3 className="font-serif-editorial text-2xl font-bold text-[#1E1B18] mt-0.5">
                          {tea.name}
                        </h3>
                        <span className="text-xs text-[#706B63]">{tea.type}</span>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-[#8B2635]/10 text-[#8B2635] text-[11px] font-bold">
                        {tea.badge}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-[#38271D] mb-4 leading-relaxed">
                      "{tea.headline}"
                    </p>

                    <div className="space-y-2.5 text-xs text-[#524B40] bg-[#FAF7F2] p-4 rounded-2xl border border-[#EBE4D8]">
                      <div>
                        <strong className="text-[#1E1B18] block font-semibold mb-0.5">
                          Harmonização Recomendada:
                        </strong>
                        <span>{tea.pairings}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#E5DACB] text-[#706B63]">
                        <Clock className="w-3.5 h-3.5 text-[#8B2635]" />
                        <span>Ritual de Serviço: {tea.ritual}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#FAF7F2] border-t border-[#E5DACB] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setLeadForm((prev) => ({
                          ...prev,
                          interest: `Amostra olfativa de ${tea.name}`,
                          notes: `Gostaria de conhecer o blend ${tea.name} para harmonização.`,
                        }));
                        setContactSubmitted(false);
                        setContactModalOpen(true);
                      }}
                      className="text-xs font-semibold text-[#8B2635] hover:text-[#721F2B] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Solicitar Amostra deste Blend</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={getWhatsAppUrl(`Olá! Gostaria de consultar a disponibilidade B2B do chá ${tea.name}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-[#2E6B34] hover:bg-white transition-colors"
                      title="Consultar no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────
            2. ABA CONSULTORIA
        ───────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'consultoria' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#8B2635]/10 flex items-center justify-center text-[#8B2635]">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-serif-editorial text-xl font-bold text-[#1E1B18]">
                  Treinamento de Brigada
                </h3>
                <p className="text-xs sm:text-sm text-[#635B4E] leading-relaxed">
                  Capacitação prática presencial ou remota para garçons, sommeliers e baristas. Como apresentar a carta, despertar a curiosidade olfativa e elevar o ticket médio.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#C68A36]/10 flex items-center justify-center text-[#C68A36]">
                  <Coffee className="w-6 h-6" />
                </div>
                <h3 className="font-serif-editorial text-xl font-bold text-[#1E1B18]">
                  Ritual de Infusão à Mesa
                </h3>
                <p className="text-xs sm:text-sm text-[#635B4E] leading-relaxed">
                  Padrão operacional com o infusor Vapt Vupt patenteado e copos térmicos de parede dupla. Infusão perfeita, sem pingar e com altíssimo apelo visual.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#2E6B34]/10 flex items-center justify-center text-[#2E6B34]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif-editorial text-xl font-bold text-[#1E1B18]">
                  Logística Ágil & MOQ Acessível
                </h3>
                <p className="text-xs sm:text-sm text-[#635B4E] leading-relaxed">
                  Pedido mínimo flexível para não imobilizar capital. Embalagens especiais de 250g e 500g para salão com reposição rápida e suporte direto via WhatsApp.
                </p>
              </div>
            </div>

            {/* Passos de Implantação */}
            <div className="bg-[#FAF5EE] p-8 rounded-3xl border border-[#E5DACB]">
              <h3 className="font-serif-editorial text-2xl font-bold text-[#1E1B18] mb-6">
                Como Funciona a Consultoria Talchá B2B
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="text-2xl font-serif-editorial font-bold text-[#8B2635]">01</div>
                  <strong className="text-sm font-semibold text-[#1E1B18] block">Diagnóstico de Cardápio</strong>
                  <p className="text-xs text-[#635B4E] leading-relaxed">
                    Avaliamos o perfil gastronômico, estilo de serviço e público do seu estabelecimento.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-2xl font-serif-editorial font-bold text-[#8B2635]">02</div>
                  <strong className="text-sm font-semibold text-[#1E1B18] block">Degustação & Amostras</strong>
                  <p className="text-xs text-[#635B4E] leading-relaxed">
                    Envio de display olfativo com tubos de vidro para escolha dos blends pela equipe.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-2xl font-serif-editorial font-bold text-[#8B2635]">03</div>
                  <strong className="text-sm font-semibold text-[#1E1B18] block">Diagramação da Carta</strong>
                  <p className="text-xs text-[#635B4E] leading-relaxed">
                    Criação de carta física ou selo digital pronto para inserção no menu do salão.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-2xl font-serif-editorial font-bold text-[#8B2635]">04</div>
                  <strong className="text-sm font-semibold text-[#1E1B18] block">Ativação & Vendas</strong>
                  <p className="text-xs text-[#635B4E] leading-relaxed">
                    Treinamento da brigada e início imediato das vendas com margens acima de 700%.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E5DACB] flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-[#635B4E]">
                  Quer agendar uma reunião comercial com nossa equipe de consultoria?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setContactSubmitted(false);
                    setContactModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#8B2635] text-white text-xs font-semibold hover:bg-[#721F2B] transition-colors cursor-pointer"
                >
                  Agendar Consultoria B2B
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────────
            3. ABA CALCULADORA
        ───────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'calculadora' && (
          <div className="space-y-12 animate-fadeIn">
            {/* Profitability Simulator */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5DACB] shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-[#2E6B34]">
                    Simulador Financeiro
                  </span>
                  <h3 className="font-serif-editorial text-2xl font-bold text-[#1E1B18]">
                    Lucratividade da Carta de Chás
                  </h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#2E6B34]/10 text-[#2E6B34] text-xs font-bold flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" />
                  Margem de {marginPercentage}%
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Sliders */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#635B4E] font-medium">Preço de Venda no Salão:</span>
                      <strong className="text-[#1E1B18] text-base">R$ {cupSalePrice.toFixed(2)}</strong>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={26}
                      step={1}
                      value={cupSalePrice}
                      onChange={(e) => setCupSalePrice(Number(e.target.value))}
                      className="w-full accent-[#8B2635] cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-[#A8A095] mt-1">
                      <span>R$ 10,00</span>
                      <span>Média Brasil: R$ 16,00</span>
                      <span>R$ 26,00</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#635B4E] font-medium">Xícaras Servidas por Dia:</span>
                      <strong className="text-[#1E1B18] text-base">{dailyCups} xícaras/dia</strong>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={80}
                      step={5}
                      value={dailyCups}
                      onChange={(e) => setDailyCups(Number(e.target.value))}
                      className="w-full accent-[#8B2635] cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-[#A8A095] mt-1">
                      <span>5/dia (pequeno bistrô)</span>
                      <span>25/dia (restaurante padrão)</span>
                      <span>80+/dia (hotel/brunch)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#EBE4D8] text-xs text-[#635B4E] space-y-1">
                    <p>
                      • <strong>Custo médio por infusão:</strong> R$ {costPerCup.toFixed(2)} (base 2g de folha nobre granel).
                    </p>
                    <p>
                      • <strong>Lucro líquido por xícara:</strong> R$ {(cupSalePrice - costPerCup).toFixed(2)}.
                    </p>
                  </div>
                </div>

                {/* Profit Result Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#FAF5EE] p-5 rounded-2xl border border-[#E5DACB]">
                    <span className="text-xs text-[#706B63] block">Faturamento Mensal</span>
                    <strong className="text-xl sm:text-2xl font-bold text-[#1E1B18] block mt-1">
                      R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    <span className="text-[11px] text-[#8A8275]">{cupsPerMonth} xícaras/mês</span>
                  </div>

                  <div className="bg-[#FAF5EE] p-5 rounded-2xl border border-[#E5DACB]">
                    <span className="text-xs text-[#706B63] block">Custo de Insumo</span>
                    <strong className="text-xl sm:text-2xl font-bold text-[#8A8275] block mt-1">
                      R$ {monthlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    <span className="text-[11px] text-[#8A8275]">Apenas R$ 1,45/xícara</span>
                  </div>

                  <div className="col-span-2 bg-gradient-to-r from-[#8B2635] to-[#721F2B] p-5 rounded-2xl text-white shadow-xs">
                    <span className="text-xs text-white/80 uppercase font-semibold tracking-wider block">
                      Lucro Líquido Estimado para o Salão
                    </span>
                    <strong className="text-3xl sm:text-4xl font-bold block mt-1 font-serif-editorial">
                      R$ {monthlyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      <span className="text-sm font-sans font-normal text-white/80"> /mês</span>
                    </strong>
                    <p className="text-xs text-white/80 mt-2">
                      Retorno líquido garantido com baixo investimento e operação simplificada.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event & Banqueting Calculator */}
            <div className="bg-[#FAF5EE] p-6 sm:p-8 rounded-3xl border border-[#E5DACB]">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#8B2635]" />
                <h3 className="font-serif-editorial text-2xl font-bold text-[#1E1B18]">
                  Calculadora de Eventos & Banquetes
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#635B4E] block">
                    Número de Convidados / Participantes:
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={1000}
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DDD5C7] bg-white text-sm font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#635B4E] block">
                    Formato de Serviço Desejado:
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DDD5C7] bg-white text-sm font-semibold"
                  >
                    <option value="ambos">Chá Quente & Gelado (Recomendado)</option>
                    <option value="quente">Apenas Chá Quente</option>
                    <option value="gelado">Apenas Chá Gelado / Welcome Drink</option>
                  </select>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E5DACB] space-y-1">
                  <span className="text-xs text-[#706B63] block">Volume Estimado Necessário</span>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-2xl font-bold text-[#8B2635]">{totalLiters} Litros</strong>
                    <span className="text-xs text-[#706B63]">({tinsNeeded} latas de 100g)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────────────────────
          FOOTER WITH BRAND SIGNATURE
      ───────────────────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E5DACB] bg-[#1E1B18] text-[#F3EDE2] pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-serif-editorial text-2xl font-bold tracking-wider text-white">
                  TALCHÁ
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#8B2635] text-white">
                  B2B
                </span>
              </div>
              <p className="text-xs text-[#A8A095] max-w-md leading-relaxed">
                Pioneira no mercado de chás especiais e blends autorais no Brasil desde 2010. Mais de 500 restaurantes, hotéis de luxo, confeitarias e eventos atendidos com excelência e padrão internacional.
              </p>
              <div className="flex items-center gap-4 text-xs text-[#C2B8AA] pt-2">
                <a href="https://www.talcha.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">
                  talcha.com.br
                </a>
                <span>·</span>
                <a href="https://instagram.com/atalcha" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  @atalcha
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-bold text-white mb-3">
                Navegação Rápida
              </h4>
              <ul className="space-y-1.5 text-xs text-[#A8A095]">
                <li>
                  <button onClick={() => { setActiveTab('consultoria'); window.scrollTo({ top: 300, behavior: 'smooth' }); }} className="hover:text-white cursor-pointer">
                    Consultoria de Salão
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('curadoria'); window.scrollTo({ top: 300, behavior: 'smooth' }); }} className="hover:text-white cursor-pointer">
                    Curadoria de Blends
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('calculadora'); window.scrollTo({ top: 300, behavior: 'smooth' }); }} className="hover:text-white cursor-pointer">
                    Calculadora de Lucro (+700%)
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-bold text-white mb-3">
                Contato Comercial
              </h4>
              <ul className="space-y-2 text-xs text-[#A8A095]">
                <li>
                  <a href="tel:5511925963961" className="flex items-center gap-1.5 hover:text-white">
                    <Phone className="w-3.5 h-3.5 text-[#8B2635]" />
                    (11) 92596-3961
                  </a>
                </li>
                <li>
                  <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#6FD47B] hover:text-[#8FE099]">
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp Direto B2B
                  </a>
                </li>
                <li>comercial@talcha.com.br</li>
                <li className="text-[11px] text-[#706B63]">Seg a Sex, das 9h às 18h</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#706B63]">
            <span>© {new Date().getFullYear()} Talchá. Todos os direitos reservados.</span>
            <span>Talchápidia B2B · Consultoria & Carta de Chás</span>
          </div>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────────────────────
          CONTATO CTA MODAL
      ───────────────────────────────────────────────────────────────────────────── */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#DDD5C7] relative">
            <button
              type="button"
              onClick={() => setContactModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-[#706B63] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {contactSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#2E6B34]/15 flex items-center justify-center text-[#2E6B34]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif-editorial text-2xl font-bold text-[#1E1B18]">
                  Solicitação Enviada com Sucesso!
                </h3>
                <p className="text-xs sm:text-sm text-[#635B4E] leading-relaxed max-w-sm mx-auto">
                  Recebemos seus dados e nossa equipe comercial entrará em contato em breve para apresentar a proposta sob medida para o seu estabelecimento.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    disabled={downloadingCarta}
                    onClick={handleDownloadCartaPdf}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#C68A36] bg-[#FAF5EE] hover:bg-[#F3EAD9] text-[#8B2635] text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#C68A36]" />
                    <span>{downloadingCarta ? 'Gerando Carta...' : 'Download Carta (PDF)'}</span>
                  </button>
                  <a
                    href={getWhatsAppUrl(`Olá! Acabei de enviar minha solicitação comercial pelo site da Talchápidia. Meu nome é ${leadForm.name} do estabelecimento ${leadForm.company}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E6B34] text-white text-xs font-semibold shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Acelerar no WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-[#DDD5C7] text-xs font-semibold text-[#1E1B18] hover:bg-[#FAF7F2]"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B2635]">
                    Atendimento Comercial Prioritário
                  </span>
                  <h3 className="font-serif-editorial text-2xl font-bold text-[#1E1B18] mt-0.5">
                    Fale com um Especialista Talchá
                  </h3>
                  <p className="text-xs text-[#706B63] mt-1">
                    Receba catálogo B2B, tabela de preços atacado e proposta para o seu salão.
                  </p>
                </div>

                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#4F4639] block mb-1">
                        Seu Nome *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Carlos Oliveira"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5C7] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B2635]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#4F4639] block mb-1">
                        Estabelecimento / Empresa *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Restaurante Origens"
                        value={leadForm.company}
                        onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5C7] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B2635]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#4F4639] block mb-1">
                        WhatsApp / Telefone *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="(11) 99999-9999"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5C7] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B2635]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#4F4639] block mb-1">
                        E-mail Corporativo *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="contato@empresa.com.br"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5C7] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B2635]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#4F4639] block mb-1">
                        Segmento
                      </label>
                      <select
                        value={leadForm.segment}
                        onChange={(e) => setLeadForm({ ...leadForm, segment: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5C7] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B2635]"
                      >
                        <option value="restaurante">Restaurante / Bistrô</option>
                        <option value="hotel">Hotel / Pousada / Room Service</option>
                        <option value="cafeteria">Cafeteria / Confeitaria</option>
                        <option value="buffet">Buffet / Eventos / Banqueteria</option>
                        <option value="outro">Outro Modelo B2B</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#4F4639] block mb-1">
                        Cidade / UF
                      </label>
                      <input
                        type="text"
                        placeholder="São Paulo / SP"
                        value={leadForm.city}
                        onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5C7] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B2635]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#4F4639] block mb-1">
                      Logotipo do Estabelecimento (PNG/JPG)
                    </label>
                    <FileUploader
                      label="Carregar Logo do Estabelecimento"
                      description="Envie sua logo (PNG ou JPG) para pré-visualização instantânea na Carta Oficial e na proposta comercial."
                      onFileChange={(logoUrl) => setLeadForm((prev) => ({ ...prev, logoUrl }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#4F4639] block mb-1">
                      Observações ou Interesse Específico
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Gostaria de receber tabela para montar carta de 6 chás para restaurante japonês..."
                      value={leadForm.notes}
                      onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5C7] text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B2635]"
                    />
                  </div>

                  {/* Prévia da Carta Oficial PDF Action Box */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF5EE] to-[#F3EDE3] border border-[#C68A36]/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 text-left w-full sm:w-auto min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#8B2635] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1E1B18]">
                          Prévia da Carta Oficial de Chás (PDF)
                        </p>
                        <p className="text-[11px] text-[#706B63] truncate">
                          Cores Talchá, logo do estabelecimento e blends nobres selecionados.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={downloadingCarta}
                      onClick={handleDownloadCartaPdf}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#C68A36] bg-white hover:bg-[#FAF5EE] text-[#8B2635] text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-60 whitespace-nowrap"
                    >
                      <Download className="w-4 h-4 text-[#C68A36]" />
                      <span>{downloadingCarta ? 'Gerando PDF...' : 'Download Carta'}</span>
                    </button>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      disabled={downloadingCarta}
                      onClick={handleDownloadCartaPdf}
                      className="w-full sm:w-1/2 py-3 bg-white border-2 border-[#C68A36] hover:bg-[#FAF5EE] text-[#8B2635] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
                    >
                      <Download className="w-4 h-4 text-[#C68A36]" />
                      <span>{downloadingCarta ? 'Gerando Carta...' : 'Download Carta'}</span>
                    </button>

                    <button
                      type="submit"
                      className="w-full sm:w-1/2 py-3 bg-[#8B2635] hover:bg-[#721F2B] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Solicitação Comercial</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
