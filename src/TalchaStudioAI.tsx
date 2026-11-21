import React, { useRef, useState } from 'react';

interface TalchaStudioAIProps {
  onOpenLeadModal?: (interestType?: string, recommendedTeaName?: string) => void;
}

type StudioTab = 'image' | 'music' | 'search';

const IMAGE_PRESETS = [
  {
    label: 'Mesa de Chá B2B Editorial',
    prompt:
      'Editorial luxury food photography of artisanal loose-leaf tea in a crystal Vapt Vupt infuser pouring golden amber liquid into a double-wall borosilicate glass cup on a dark walnut table, ceramic pastry plates with butter croissants, soft morning window light, shallow depth of field.',
  },
  {
    label: 'Capa de Carta Minimalista Talchá',
    prompt:
      'High-end restaurant tea menu cover artwork on warm ivory cotton paper background, delicate botanical watercolor illustration of Japanese Sencha leaves, wild cherry blossoms, and star anise with subtle brushed gold leaf accents, serene luxury hospitality aesthetic.',
  },
  {
    label: 'Coquetelaria Rubi Vermelho Intenso',
    prompt:
      'Close-up culinary cocktail photography of vibrant ruby hibiscus iced tea signature mocktail in crystal coupe glass garnished with fresh raspberries and dehydrated citrus wheel on dark travertine bar top, dramatic rim lighting.',
  },
];

const MUSIC_PRESETS = [
  {
    label: 'Chá da Tarde · Bossa & Piano',
    mode: 'pro' as const,
    prompt:
      'Elegant instrumental Brazilian bossa nova and warm felt piano trio for a luxury afternoon tea lounge in São Paulo, brushed drums, upright acoustic bass, gentle nylon guitar chords, 84 BPM, intimate vinyl warmth.',
  },
  {
    label: 'Cerimônia Sencha · Bambu & Koto',
    mode: 'clip' as const,
    prompt:
      'Serene minimalist Japanese tea ceremony ambient soundtrack for 30 seconds, delicate koto plucks, warm shakuhachi flute breaths, soft water droplets, meditative peaceful tempo.',
  },
  {
    label: 'Hotelaria & Brunch · Jazz Acústico',
    mode: 'pro' as const,
    prompt:
      'Refined contemporary acoustic jazz quartet for fine dining morning brunch service, warm Rhodes chords, soft brushed cymbals, melodic upright bass, uplifting cosmopolitan hospitality mood.',
  },
];

const SEARCH_PRESETS = [
  'Quais são as tendências globais de harmonização de chás especiais com alta gastronomia e menus degustação em 2026?',
  'Como a região de Shizuoka e Uji no Japão produzem o chá verde Sencha e quais notas sensoriais predominam na primeira colheita (Shincha)?',
  'Comparativo estratégico de margem e ticket médio entre carta de chás a granel vs sachês industriais em hotéis boutique no Brasil.',
];

export default function TalchaStudioAI({ onOpenLeadModal }: TalchaStudioAIProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('image');

  // Image Studio (gemini-nano-banana-2.1)
  const [imgPrompt, setImgPrompt] = useState<string>(IMAGE_PRESETS[0].prompt);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [useImageSearch, setUseImageSearch] = useState<boolean>(false);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [sourceMimeType, setSourceMimeType] = useState<string>('image/png');
  const [imgLoading, setImgLoading] = useState<boolean>(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);
  const [generatedImgText, setGeneratedImgText] = useState<string>('');
  const [generatedImgSources, setGeneratedImgSources] = useState<Array<{ title: string; uri: string }>>([]);
  const imgFileRef = useRef<HTMLInputElement | null>(null);

  // Music Studio (lyria-3-clip-preview / lyria-3-pro-preview)
  const [musicPrompt, setMusicPrompt] = useState<string>(MUSIC_PRESETS[0].prompt);
  const [musicMode, setMusicMode] = useState<'clip' | 'pro'>('clip');
  const [musicMoodImg, setMusicMoodImg] = useState<string | null>(null);
  const [musicMoodMime, setMusicMoodMime] = useState<string>('image/jpeg');
  const [musicLoading, setMusicLoading] = useState<boolean>(false);
  const [musicError, setMusicError] = useState<string | null>(null);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [musicLyrics, setMusicLyrics] = useState<string>('');
  const [musicModelUsed, setMusicModelUsed] = useState<string>('');
  const musicImgRef = useRef<HTMLInputElement | null>(null);

  // Search Grounding Studio (gemini-4-hydrogen + Google Search & Maps)
  const [searchMode, setSearchMode] = useState<'web' | 'maps'>('web');
  const [searchPrompt, setSearchPrompt] = useState<string>(SEARCH_PRESETS[0]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [webSources, setWebSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [mapPlaces, setMapPlaces] = useState<
    Array<{ title: string; uri: string; reviewSnippets?: Array<{ title?: string; uri?: string }> }>
  >([]);

  const readFileAsDataUrl = (file: File, onDone: (dataUrl: string, mime: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      onDone(String(reader.result || ''), file.type || 'image/png');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgPrompt.trim() || imgLoading) return;
    setImgLoading(true);
    setImgError(null);

    try {
      const res = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imgPrompt,
          aspectRatio,
          imageSize,
          useWebSearch,
          useImageSearch,
          sourceImageBase64: sourceImageUrl,
          sourceMimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erro HTTP ${res.status}`);
      }
      setGeneratedImgUrl(data.imageDataUrl);
      setGeneratedImgText(data.text || '');
      setGeneratedImgSources(Array.isArray(data.sources) ? data.sources : []);
    } catch (err: any) {
      setImgError(err?.message || 'Erro ao gerar/editar imagem via Nano Banana 2.1.');
    } finally {
      setImgLoading(false);
    }
  };

  const handleGenerateMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicPrompt.trim() || musicLoading) return;
    setMusicLoading(true);
    setMusicError(null);

    try {
      const res = await fetch('/api/gemini/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt,
          mode: musicMode,
          sourceImageBase64: musicMoodImg,
          sourceMimeType: musicMoodMime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erro HTTP ${res.status}`);
      }
      setAudioDataUrl(data.audioDataUrl);
      setMusicLyrics(data.lyrics || '');
      setMusicModelUsed(data.model || '');
    } catch (err: any) {
      setMusicError(err?.message || 'Erro ao compor trilha sonora via Lyria 3.');
    } finally {
      setMusicLoading(false);
    }
  };

  const handleRunSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPrompt.trim() || searchLoading) return;
    setSearchLoading(true);
    setSearchError(null);

    try {
      const endpoint = searchMode === 'web' ? '/api/gemini/search-grounding' : '/api/gemini/maps-grounding';
      const payload =
        searchMode === 'web'
          ? { query: searchPrompt, language: 'pt' }
          : { query: searchPrompt, language: 'pt' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Erro HTTP ${res.status}`);
      }
      setSearchText(data.text || '');
      setWebSources(Array.isArray(data.sources) ? data.sources : []);
      setMapPlaces(Array.isArray(data.places) ? data.places : []);
    } catch (err: any) {
      setSearchError(err?.message || 'Erro ao executar pesquisa com grounding.');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div id="talcha-studio-ai-scope" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B2635]/10 border border-[#C68A36]/40 text-[#8B2635] dark:text-[#F3D78E] text-[11px] font-bold uppercase tracking-[0.14em] mb-2">
            Ateliê Sensorial IA · Imagem, Trilha Sonora & Pesquisa Ao Vivo
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1E1B18] dark:text-[#FAF7F2] tracking-tight">
            Direção Criativa & Sommelier Inteligente
          </h2>
          <p className="text-sm text-[#5C564D] dark:text-[#C2B8AA] mt-1 max-w-2xl">
            Crie visuais editoriais para a carta do seu estabelecimento, componha trilhas sonoras exclusivas para o salão e pesquise tendências globais em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 rounded-xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23]">
            {(
              [
                { id: 'image', label: 'Estúdio Visual (Nano Banana 2.1)' },
                { id: 'music', label: 'Trilha Sonora (Lyria 3)' },
                { id: 'search', label: 'Pesquisa Search & Maps' },
              ] as Array<{ id: StudioTab; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#8B2635] text-white'
                    : 'text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {onOpenLeadModal && (
            <button
              type="button"
              onClick={() => onOpenLeadModal('atelie-b2b', 'Ativação Sensorial Completa')}
              className="px-4 py-2.5 rounded-xl bg-[#173322] hover:bg-[#22442E] text-[#FAF7F2] border border-[#C68A36] text-xs font-bold cursor-pointer"
            >
              Ativar Projeto B2B
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: IMAGE CREATION & EDITING (gemini-nano-banana-2.1) */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleGenerateImage}
            className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 space-y-4 shadow-sm"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#F3D78E]">
                Criar & Editar Imagens · gemini-nano-banana-2.1
              </span>
              <h3 className="font-serif text-xl font-bold text-[#1E1B18] dark:text-[#FAF7F2] mt-0.5">
                Fotografia Gastronômica & Capas
              </h3>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {IMAGE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setImgPrompt(p.prompt)}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] dark:bg-[#231E1A] border border-[#DFD2BF] dark:border-[#352C23] text-[11px] font-semibold text-[#4F4840] dark:text-[#DDD4C4] hover:border-[#C68A36] cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4F4840] dark:text-[#DDD4C4] mb-1">
                Descrição da Cena ou Instrução de Edição
              </label>
              <textarea
                rows={4}
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD2BF] dark:border-[#352C23] bg-[#FAF7F2] dark:bg-[#120F0D] text-xs text-[#1E1B18] dark:text-[#FAF7F2] outline-none focus:border-[#8B2635]"
                placeholder="Descreva a fotografia da mesa de chá, ambientação do hotel ou instrução para editar a imagem enviada..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#696256] dark:text-[#A8A095] mb-1">
                  Proporção (Aspect Ratio)
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#352C23] bg-[#FAF7F2] dark:bg-[#120F0D] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF7F2]"
                >
                  {['16:9', '1:1', '3:4', '4:3', '9:16', '4:1', '1:4'].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#696256] dark:text-[#A8A095] mb-1">
                  Resolução
                </label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#352C23] bg-[#FAF7F2] dark:bg-[#120F0D] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF7F2]"
                >
                  {['1K', '2K', '4K'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Image Upload for Editing */}
            <div className="rounded-xl border border-dashed border-[#C68A36]/60 bg-[#FAF7F2] dark:bg-[#231E1A] p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#4F4840] dark:text-[#DDD4C4]">
                  Editar Foto Existente (Opcional)
                </span>
                <div className="flex items-center gap-2">
                  {sourceImageUrl && (
                    <button
                      type="button"
                      onClick={() => setSourceImageUrl(null)}
                      className="text-[11px] font-bold text-[#8B2635] underline cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                  <input
                    ref={imgFileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(ev) => {
                      const f = ev.target.files?.[0];
                      if (f) {
                        readFileAsDataUrl(f, (url, mime) => {
                          setSourceImageUrl(url);
                          setSourceMimeType(mime);
                        });
                      }
                      ev.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => imgFileRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1A1613] border border-[#C68A36] text-[11px] font-bold text-[#8B2635] dark:text-[#F3D78E] cursor-pointer"
                  >
                    {sourceImageUrl ? 'Trocar Foto' : 'Enviar Foto do Salão'}
                  </button>
                </div>
              </div>
              {sourceImageUrl && (
                <img
                  src={sourceImageUrl}
                  alt="Imagem base para edição"
                  className="h-24 w-auto rounded-lg object-cover border border-[#DFD2BF]"
                />
              )}
            </div>

            {/* Google Search / Image Search Grounding toggles */}
            <div className="flex flex-wrap gap-4 text-xs text-[#4F4840] dark:text-[#DDD4C4]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="accent-[#8B2635]"
                />
                <span>Web Search Context</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useImageSearch}
                  onChange={(e) => setUseImageSearch(e.target.checked)}
                  className="accent-[#8B2635]"
                />
                <span>Image Search Reference</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={imgLoading}
              className="w-full py-3 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer disabled:opacity-60"
            >
              {imgLoading
                ? 'Renderizando em Nano Banana 2.1...'
                : sourceImageUrl
                ? 'Editar Foto com Nano Banana 2.1'
                : 'Gerar Visual Editorial'}
            </button>

            {imgError && (
              <div className="rounded-xl border border-[#8B2635]/40 bg-[#8B2635]/5 p-3 text-xs text-[#8B2635] dark:text-[#F3B0B8]">
                {imgError}
              </div>
            )}
          </form>

          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 min-h-[420px] flex flex-col justify-between shadow-sm">
            {generatedImgUrl ? (
              <div className="space-y-4">
                <img
                  src={generatedImgUrl}
                  alt="Arte gerada pelo Estúdio Talchá"
                  className="w-full max-h-[460px] object-contain rounded-xl bg-[#FAF7F2] dark:bg-[#120F0D] border border-[#DFD2BF] dark:border-[#352C23]"
                />
                {generatedImgText && (
                  <p className="text-xs text-[#5C564D] dark:text-[#C2B8AA]">{generatedImgText}</p>
                )}
                {generatedImgSources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {generatedImgSources.map((s, i) => (
                      <a
                        key={i}
                        href={s.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] underline text-[#8B2635] dark:text-[#F3D78E]"
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2.5">
                  <a
                    href={generatedImgUrl}
                    download="talcha-editorial-studio.png"
                    className="px-4 py-2 rounded-xl bg-[#173322] text-white text-xs font-bold"
                  >
                    Baixar Imagem ({imageSize})
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceImageUrl(generatedImgUrl);
                      setSourceMimeType('image/png');
                    }}
                    className="px-4 py-2 rounded-xl border border-[#C68A36] text-[#8B2635] dark:text-[#F3D78E] text-xs font-bold cursor-pointer"
                  >
                    Continuar Editando Esta Arte
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#696256] dark:text-[#A8A095]">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#8B2635] dark:text-[#F3D78E] mb-2">
                  Prancheta Visual B2B
                </div>
                <p className="text-sm max-w-md">
                  Gere fotografias gastronômicas em até 4K ou envie uma foto da sua mesa de restaurante para harmonizar o serviço Vapt Vupt da Talchá com edição generativa.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MUSIC GENERATION (lyria-3-clip-preview / lyria-3-pro-preview) */}
      {activeTab === 'music' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleGenerateMusic}
            className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 space-y-4 shadow-sm"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#F3D78E]">
                Paisagem Sonora de Salão · Lyria 3
              </span>
              <h3 className="font-serif text-xl font-bold text-[#1E1B18] dark:text-[#FAF7F2] mt-0.5">
                Compositor de Ambientação B2B
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMusicMode('clip')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  musicMode === 'clip'
                    ? 'bg-[#8B2635] border-[#C68A36] text-white'
                    : 'bg-[#FAF7F2] dark:bg-[#231E1A] border-[#DFD2BF] dark:border-[#352C23] text-[#4F4840] dark:text-[#DDD4C4]'
                }`}
              >
                <div className="text-xs font-bold">Lyria Clip (30s)</div>
                <div className="text-[10px] opacity-80">lyria-3-clip-preview</div>
              </button>
              <button
                type="button"
                onClick={() => setMusicMode('pro')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  musicMode === 'pro'
                    ? 'bg-[#8B2635] border-[#C68A36] text-white'
                    : 'bg-[#FAF7F2] dark:bg-[#231E1A] border-[#DFD2BF] dark:border-[#352C23] text-[#4F4840] dark:text-[#DDD4C4]'
                }`}
              >
                <div className="text-xs font-bold">Lyria Pro (Completa)</div>
                <div className="text-[10px] opacity-80">lyria-3-pro-preview</div>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {MUSIC_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setMusicPrompt(p.prompt);
                    setMusicMode(p.mode);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] dark:bg-[#231E1A] border border-[#DFD2BF] dark:border-[#352C23] text-[11px] font-semibold text-[#4F4840] dark:text-[#DDD4C4] hover:border-[#C68A36] cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4F4840] dark:text-[#DDD4C4] mb-1">
                Atmosfera Musical, Instrumentos & BPM
              </label>
              <textarea
                rows={4}
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD2BF] dark:border-[#352C23] bg-[#FAF7F2] dark:bg-[#120F0D] text-xs text-[#1E1B18] dark:text-[#FAF7F2] outline-none focus:border-[#8B2635]"
                placeholder="Ex: Bossa nova acústica elegante com piano suave e violão para serviço de chá da tarde..."
              />
            </div>

            <div className="rounded-xl border border-dashed border-[#C68A36]/60 bg-[#FAF7F2] dark:bg-[#231E1A] p-3 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-[#4F4840] dark:text-[#DDD4C4]">
                Inspiração Visual (Opcional)
              </span>
              <div className="flex items-center gap-2">
                {musicMoodImg && (
                  <button
                    type="button"
                    onClick={() => setMusicMoodImg(null)}
                    className="text-[11px] font-bold text-[#8B2635] underline cursor-pointer"
                  >
                    Remover
                  </button>
                )}
                <input
                  ref={musicImgRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(ev) => {
                    const f = ev.target.files?.[0];
                    if (f) {
                      readFileAsDataUrl(f, (url, mime) => {
                        setMusicMoodImg(url);
                        setMusicMoodMime(mime);
                      });
                    }
                    ev.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => musicImgRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1A1613] border border-[#C68A36] text-[11px] font-bold text-[#8B2635] dark:text-[#F3D78E] cursor-pointer"
                >
                  {musicMoodImg ? 'Foto Carregada' : 'Foto do Ambiente'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={musicLoading}
              className="w-full py-3 rounded-xl bg-[#173322] hover:bg-[#22442E] text-white border border-[#C68A36] text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer disabled:opacity-60"
            >
              {musicLoading ? 'Compondo em Streaming via Lyria 3...' : 'Compor Trilha Sonora de Salão'}
            </button>

            {musicError && (
              <div className="rounded-xl border border-[#8B2635]/40 bg-[#8B2635]/5 p-3 text-xs text-[#8B2635] dark:text-[#F3B0B8]">
                {musicError}
              </div>
            )}
          </form>

          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-6 min-h-[380px] flex flex-col justify-between shadow-sm">
            {audioDataUrl ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#2E6B34] dark:text-[#6FD47B]">
                      Trilha MP3 Pronta · {musicModelUsed}
                    </div>
                    <h4 className="font-serif text-xl font-bold text-[#1E1B18] dark:text-[#FAF7F2]">
                      Reprodutor de Ambiente Talchá
                    </h4>
                  </div>
                  <a
                    href={audioDataUrl}
                    download={`talcha-salon-${musicMode}.mp3`}
                    className="px-3.5 py-2 rounded-xl bg-[#8B2635] text-white text-xs font-bold"
                  >
                    Baixar MP3
                  </a>
                </div>

                <audio controls src={audioDataUrl} className="w-full" />

                {musicLyrics && (
                  <div className="rounded-xl bg-[#FAF7F2] dark:bg-[#231E1A] border border-[#E5DACB] dark:border-[#352C23] p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#F3D78E] mb-1">
                      Notas & Estrutura da Composição
                    </div>
                    <pre className="text-xs text-[#4F4840] dark:text-[#DDD4C4] whitespace-pre-wrap font-sans leading-relaxed">
                      {musicLyrics}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#696256] dark:text-[#A8A095]">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#8B2635] dark:text-[#F3D78E] mb-2">
                  Curadoria Sonora para Hospitalidade
                </div>
                <p className="text-sm max-w-md">
                  Crie trilhas instrumentais sob medida de 30 segundos (Lyria Clip) ou faixas completas (Lyria Pro) para harmonizar com o serviço de chá da tarde do seu hotel, café ou spa.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE SEARCH & GOOGLE MAPS DATA GROUNDING (gemini-4-hydrogen) */}
      {activeTab === 'search' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleRunSearch}
            className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 space-y-4 shadow-sm"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#F3D78E]">
                Dados em Tempo Real · gemini-4-hydrogen
              </span>
              <h3 className="font-serif text-xl font-bold text-[#1E1B18] dark:text-[#FAF7F2] mt-0.5">
                Inteligência Web & Localização Real
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSearchMode('web')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  searchMode === 'web'
                    ? 'bg-[#8B2635] border-[#C68A36] text-white'
                    : 'bg-[#FAF7F2] dark:bg-[#231E1A] border-[#DFD2BF] dark:border-[#352C23] text-[#4F4840] dark:text-[#DDD4C4]'
                }`}
              >
                <div className="text-xs font-bold">Google Search Data</div>
                <div className="text-[10px] opacity-80">Fontes Web Atualizadas</div>
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('maps')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                  searchMode === 'maps'
                    ? 'bg-[#8B2635] border-[#C68A36] text-white'
                    : 'bg-[#FAF7F2] dark:bg-[#231E1A] border-[#DFD2BF] dark:border-[#352C23] text-[#4F4840] dark:text-[#DDD4C4]'
                }`}
              >
                <div className="text-xs font-bold">Google Maps Data</div>
                <div className="text-[10px] opacity-80">Locais & Avaliações</div>
              </button>
            </div>

            <div className="space-y-1.5">
              {SEARCH_PRESETS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSearchPrompt(q)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#231E1A] border border-[#DFD2BF] dark:border-[#352C23] text-[11px] font-medium text-[#4F4840] dark:text-[#DDD4C4] hover:border-[#C68A36] cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={searchPrompt}
              onChange={(e) => setSearchPrompt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD2BF] dark:border-[#352C23] bg-[#FAF7F2] dark:bg-[#120F0D] text-xs text-[#1E1B18] dark:text-[#FAF7F2] outline-none focus:border-[#8B2635]"
              placeholder="Pergunte sobre safras, tendências gastronômicas ou locais reais..."
            />

            <button
              type="submit"
              disabled={searchLoading}
              className="w-full py-3 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60"
            >
              {searchLoading
                ? 'Consultando fontes verificadas...'
                : searchMode === 'web'
                ? 'Pesquisar com Google Search'
                : 'Pesquisar com Google Maps'}
            </button>

            {searchError && (
              <div className="rounded-xl border border-[#8B2635]/40 bg-[#8B2635]/5 p-3 text-xs text-[#8B2635] dark:text-[#F3B0B8]">
                {searchError}
              </div>
            )}
          </form>

          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-6 min-h-[380px] space-y-4 shadow-sm">
            {searchText ? (
              <>
                <div className="text-xs text-[#2B2621] dark:text-[#EAE1D3] whitespace-pre-wrap leading-relaxed">
                  {searchText}
                </div>

                {webSources.length > 0 && (
                  <div className="pt-3 border-t border-[#E5DACB] dark:border-[#352C23] space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#F3D78E]">
                      Fontes Google Search ({webSources.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {webSources.map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#231E1A] border border-[#DFD2BF] dark:border-[#352C23] text-[11px] font-semibold text-[#173322] dark:text-[#6FD47B] underline"
                        >
                          {src.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {mapPlaces.length > 0 && (
                  <div className="pt-3 border-t border-[#E5DACB] dark:border-[#352C23] space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#F3D78E]">
                      Locais Google Maps ({mapPlaces.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mapPlaces.map((mp, i) => (
                        <a
                          key={i}
                          href={mp.uri || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#231E1A] border border-[#DFD2BF] dark:border-[#352C23] text-xs font-bold text-[#8B2635] dark:text-[#F3D78E] underline"
                        >
                          {mp.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#696256] dark:text-[#A8A095]">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#8B2635] dark:text-[#F3D78E] mb-2">
                  Pesquisa Fundamentada
                </div>
                <p className="text-sm max-w-md">
                  Consulte relatórios reais de gastronomia, dados de terroirs de chá no Google Search ou estabelecimentos e avaliações reais diretamente do Google Maps.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
