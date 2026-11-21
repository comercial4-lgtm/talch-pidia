import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  APILoadingStatus,
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';

interface TalchaMapsExplorerProps {
  onOpenLeadModal?: (interestType?: string, recommendedTeaName?: string) => void;
}

interface DiscoveredPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  googleMapsURI?: string;
  isFlagship?: boolean;
}

interface GroundedMapsPlace {
  title: string;
  uri: string;
  placeId?: string;
  reviewSnippets: Array<{ title?: string; uri?: string }>;
}

const REGION_PRESETS = [
  {
    id: 'flagship-sp',
    label: 'Lojas SP · Higienópolis & JK Iguatemi',
    query: 'Talchá Shopping Pátio Higienópolis e Talchá Shopping JK Iguatemi São Paulo',
    groundingQuery: 'Talchá Shopping Pátio Higienópolis Piso Pacaembu, Shopping JK Iguatemi e restaurantes e hotéis sofisticados em São Paulo',
  },
  {
    id: 'hotelaria-sp',
    label: 'Hotelaria & Alta Gastronomia SP',
    query: 'Hotéis cinco estrelas e restaurantes de alta gastronomia Jardins Itaim Bibi São Paulo',
    groundingQuery: 'Hotéis cinco estrelas e restaurantes de alta gastronomia com serviço de chá da tarde em São Paulo',
  },
  {
    id: 'terroir-japao',
    label: 'Terroir · Shizuoka (Sencha)',
    query: 'Shizuoka green tea plantations Uji tea house Japan',
    groundingQuery: 'Principais casas de chá tradicionais e regiões produtoras de Sencha em Shizuoka e Uji, Japão',
  },
  {
    id: 'terroir-ceilao',
    label: 'Terroir · Ceilão (Earl Grey)',
    query: 'Nuwara Eliya Ceylon tea estates Sri Lanka',
    groundingQuery: 'Históricas plantações e casas de degustação de chá preto do Ceilão em Nuwara Eliya, Sri Lanka',
  },
];

function PlaceAdvancedMarker({
  place,
  selected,
  onSelect,
  onClear,
  onRequestRoute,
}: {
  place: DiscoveredPlace;
  selected: boolean;
  onSelect: (p: DiscoveredPlace) => void;
  onClear: () => void;
  onRequestRoute: (dest: { lat: number; lng: number; name: string }) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: place.lat, lng: place.lng }}
        title={place.name}
        onClick={() => onSelect(place)}
      >
        <Pin
          background={place.isFlagship ? '#8B2635' : '#173322'}
          borderColor="#C68A36"
          glyphColor="#FAF7F2"
          scale={place.isFlagship ? 1.25 : 1.05}
        />
      </AdvancedMarker>
      {selected && marker && (
        <InfoWindow anchor={marker} maxWidth={300} onCloseClick={onClear}>
          <div className="p-1 text-[#1E1B18] space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B2635]">
              {place.isFlagship ? 'Flagship & Curadoria Talchá' : 'Google Places (New)'}
            </div>
            <div className="text-sm font-bold leading-snug">{place.name}</div>
            {place.address && <div className="text-xs text-[#5C564D]">{place.address}</div>}
            {typeof place.rating === 'number' && (
              <div className="text-xs font-semibold text-[#C68A36]">Avaliação: {place.rating.toFixed(1)} / 5.0</div>
            )}
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onRequestRoute({ lat: place.lat, lng: place.lng, name: place.name })}
                className="px-2.5 py-1 rounded-md bg-[#8B2635] text-white text-[11px] font-semibold cursor-pointer"
              >
                Calcular Rota B2B
              </button>
              {place.googleMapsURI && (
                <a
                  href={place.googleMapsURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md border border-[#C68A36] text-[#8B2635] text-[11px] font-semibold"
                >
                  Abrir no Maps
                </a>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function InteractiveMapContent({
  searchQuery,
  searchNonce,
  originCoords,
  routeDestination,
  onPlacesLoaded,
  onRouteSummary,
  onRequestRoute,
}: {
  searchQuery: string;
  searchNonce: number;
  originCoords: { lat: number; lng: number } | null;
  routeDestination: { lat: number; lng: number; name: string } | null;
  onPlacesLoaded: (places: DiscoveredPlace[]) => void;
  onRouteSummary: (summary: { distanceKm: string; durationMin: number; destName: string } | null) => void;
  onRequestRoute: (dest: { lat: number; lng: number; name: string }) => void;
}) {
  const map = useMap();
  const coreLib = useMapsLibrary('core');
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const status = useApiLoadingStatus();

  const [places, setPlaces] = useState<DiscoveredPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<DiscoveredPlace | null>(null);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const polylinesRef = useRef<Array<{ setMap: (m: any) => void; setOptions: (opts: any) => void }>>([]);

  // Fetch places dynamically using modern Places API (New) Place.searchByText
  useEffect(() => {
    if (!placesLib || !coreLib || !map || !searchQuery) return;
    let cancelled = false;
    setPlacesError(null);

    (async () => {
      try {
        const { places: found } = await (placesLib.Place as any).searchByText({
          textQuery: searchQuery,
          fields: ['id', 'displayName', 'formattedAddress', 'location', 'rating', 'googleMapsURI'],
          maxResultCount: 8,
          language: 'pt-BR',
        });

        if (cancelled) return;

        const mapped: DiscoveredPlace[] = [];
        const LatLngBoundsCtor = (coreLib as any).LatLngBounds || (window as any).google?.maps?.LatLngBounds;
        const bounds = new LatLngBoundsCtor();

        for (const p of found || []) {
          const loc = p.location;
          if (!loc) continue;
          const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
          const lng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;
          if (typeof lat !== 'number' || typeof lng !== 'number') continue;

          const name = String(p.displayName || 'Local');
          mapped.push({
            id: String(p.id || `${lat}_${lng}`),
            name,
            address: String(p.formattedAddress || ''),
            lat,
            lng,
            rating: typeof p.rating === 'number' ? p.rating : undefined,
            googleMapsURI: p.googleMapsURI,
            isFlagship: name.toLowerCase().includes('talchá') || name.toLowerCase().includes('talcha'),
          });
          bounds.extend({ lat, lng });
        }

        setPlaces(mapped);
        onPlacesLoaded(mapped);
        if (mapped.length > 0) {
          setSelectedPlace(mapped[0]);
          if (mapped.length === 1) {
            map.panTo({ lat: mapped[0].lat, lng: mapped[0].lng });
            map.setZoom(15);
          } else {
            map.fitBounds(bounds, 48);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setPlacesError(
            err?.message || 'Não foi possível consultar locais no Places API (New). Verifique a conexão ou chave.'
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [placesLib, coreLib, map, searchQuery, searchNonce, onPlacesLoaded]);

  // Compute routes using modern Route.computeRoutes (never DirectionsService)
  useEffect(() => {
    polylinesRef.current.forEach((pl) => pl.setMap(null));
    polylinesRef.current = [];
    onRouteSummary(null);

    if (!routesLib || !map || !routeDestination) return;
    let cancelled = false;

    const fallbackOrigin = originCoords || { lat: -23.5425, lng: -46.6579 };

    (async () => {
      try {
        const response = await (routesLib.Route as any).computeRoutes({
          origin: fallbackOrigin,
          destination: { lat: routeDestination.lat, lng: routeDestination.lng },
          travelMode: 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
        });

        if (cancelled) return;
        const primaryRoute = response?.routes?.[0];
        if (!primaryRoute) return;

        const newPolylines: Array<{ setMap: (m: any) => void; setOptions: (opts: any) => void }> =
          primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#8B2635',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 52);
        }

        onRouteSummary({
          distanceKm: ((primaryRoute.distanceMeters || 0) / 1000).toFixed(1),
          durationMin: Math.max(1, Math.round((primaryRoute.durationMillis || 0) / 60000)),
          destName: routeDestination.name,
        });
      } catch (err) {
        console.warn('Routes API warning:', err);
      }
    })();

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((pl) => pl.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, originCoords, routeDestination, onRouteSummary]);

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#FAF7F2] dark:bg-[#1A1613] p-6 text-center">
        <div className="max-w-md space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[#8B2635]">
            Mapa Interativo Indisponível
          </div>
          <p className="text-sm text-[#4F4840] dark:text-[#DDD4C4]">
            Não foi possível carregar o Google Maps JavaScript API com a credencial atual. Verifique a chave configurada em <code className="px-1 py-0.5 rounded bg-black/5">VITE_GOOGLE_MAPS_API_KEY</code> ou utilize a busca Google Maps Grounding ao lado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {placesError && (
        <div className="absolute top-3 left-3 right-3 z-20 rounded-xl bg-white/95 border border-[#8B2635]/40 px-3 py-2 text-xs text-[#8B2635] shadow-md">
          {placesError}
        </div>
      )}
      {places.map((p) => (
        <PlaceAdvancedMarker
          key={p.id}
          place={p}
          selected={selectedPlace?.id === p.id}
          onSelect={setSelectedPlace}
          onClear={() => setSelectedPlace(null)}
          onRequestRoute={onRequestRoute}
        />
      ))}
    </>
  );
}

export default function TalchaMapsExplorer({ onOpenLeadModal }: TalchaMapsExplorerProps) {
  const envApiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
  const [apiKey, setApiKey] = useState<string>(envApiKey);
  const [keyChecked, setKeyChecked] = useState<boolean>(Boolean(envApiKey));

  const [activePresetId, setActivePresetId] = useState<string>(REGION_PRESETS[0].id);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>(REGION_PRESETS[0].query);
  const [searchNonce, setSearchNonce] = useState<number>(0);

  const [discoveredPlaces, setDiscoveredPlaces] = useState<DiscoveredPlace[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>('');
  const [routeDest, setRouteDest] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [routeSummary, setRouteSummary] = useState<{
    distanceKm: string;
    durationMin: number;
    destName: string;
  } | null>(null);

  // Google Maps Grounding via Gemini 4 Hydrogen state
  const [groundingLoading, setGroundingLoading] = useState<boolean>(false);
  const [groundingError, setGroundingError] = useState<string | null>(null);
  const [groundingText, setGroundingText] = useState<string>('');
  const [groundedPlaces, setGroundedPlaces] = useState<GroundedMapsPlace[]>([]);

  useEffect(() => {
    if (envApiKey) {
      setApiKey(envApiKey);
      setKeyChecked(true);
      return;
    }
    fetch('/api/config/public-maps')
      .then((r) => r.json())
      .then((data) => {
        if (data?.mapsApiKey) setApiKey(String(data.mapsApiKey));
      })
      .catch(() => {})
      .finally(() => setKeyChecked(true));
  }, [envApiKey]);

  const runMapsGrounding = useCallback(
    async (queryToRun: string, coords?: { lat: number; lng: number } | null) => {
      setGroundingLoading(true);
      setGroundingError(null);
      try {
        const res = await fetch('/api/gemini/maps-grounding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: queryToRun,
            latitude: coords?.lat,
            longitude: coords?.lng,
            language: 'pt',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || `Erro HTTP ${res.status}`);
        }
        setGroundingText(data.text || '');
        setGroundedPlaces(Array.isArray(data.places) ? data.places : []);
      } catch (err: any) {
        setGroundingError(err?.message || 'Erro ao consultar Google Maps Grounding.');
      } finally {
        setGroundingLoading(false);
      }
    },
    []
  );

  const handleSelectPreset = (presetId: string) => {
    const preset = REGION_PRESETS.find((p) => p.id === presetId) || REGION_PRESETS[0];
    setActivePresetId(preset.id);
    setSearchQuery(preset.query);
    setSearchNonce((n) => n + 1);
    setRouteDest(null);
    runMapsGrounding(preset.groundingQuery, userCoords);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = customQuery.trim();
    if (!q) return;
    setSearchQuery(q);
    setSearchNonce((n) => n + 1);
    setRouteDest(null);
    runMapsGrounding(q, userCoords);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocalização não suportada neste navegador.');
      return;
    }
    setGeoStatus('Obtendo coordenadas...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setGeoStatus(`Localização ativa (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})`);
        runMapsGrounding(
          customQuery.trim() || 'Restaurantes, cafeterias especiais e hotéis próximos para carta de chás Talchá',
          coords
        );
      },
      () => {
        setGeoStatus('Permissão de localização recusada. Usando busca regional em São Paulo.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div id="talcha-maps-scope" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#173322]/10 border border-[#C68A36]/40 text-[#173322] dark:text-[#6FD47B] text-[11px] font-bold uppercase tracking-[0.14em] mb-2">
            Google Maps Platform · Places New, Routes & Grounding
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1E1B18] dark:text-[#FAF7F2] tracking-tight">
            Mapa B2B Talchá, Flagship & Origens Globais
          </h2>
          <p className="text-sm text-[#5C564D] dark:text-[#C2B8AA] mt-1 max-w-2xl">
            Explore em tempo real regiões de hospitalidade em São Paulo, o terroir de origem dos nossos blends e estabelecimentos com avaliações verificadas do Google Maps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDetectLocation}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1E1B18] border border-[#DFD2BF] dark:border-[#352C23] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF7F2] hover:border-[#C68A36] cursor-pointer"
          >
            Usar Minha Localização
          </button>
          {onOpenLeadModal && (
            <button
              type="button"
              onClick={() => onOpenLeadModal('visita-flagship', 'Degustação Comercial Flagship')}
              className="px-4 py-2.5 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              Agendar Degustação B2B
            </button>
          )}
        </div>
      </div>

      {geoStatus && (
        <div className="text-xs font-medium text-[#2E6B34] dark:text-[#6FD47B]">{geoStatus}</div>
      )}

      {/* Search & Preset Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap gap-2">
          {REGION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                activePresetId === preset.id
                  ? 'bg-[#8B2635] border-[#C68A36] text-white'
                  : 'bg-[#FAF7F2] dark:bg-[#231E1A] border-[#E5DACB] dark:border-[#352C23] text-[#4F4840] dark:text-[#DDD4C4]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleCustomSearch} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Busque bairro, hotel, restaurante ou região produtora (ex: Jardins São Paulo, Uji Japão)..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#DFD2BF] dark:border-[#352C23] bg-[#FAF7F2] dark:bg-[#120F0D] text-sm text-[#1E1B18] dark:text-[#FAF7F2] outline-none focus:border-[#8B2635]"
          />
          <button
            type="submit"
            disabled={groundingLoading}
            className="px-5 py-2.5 rounded-xl bg-[#173322] hover:bg-[#22442E] text-[#FAF7F2] border border-[#C68A36] text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60"
          >
            {groundingLoading ? 'Pesquisando...' : 'Explorar no Google Maps'}
          </button>
        </form>
      </div>

      {/* Main Split: Interactive Map (Left) + Real Google Maps Grounding Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Interactive Google Map */}
        <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-[#DFD2BF] dark:border-[#352C23] bg-[#FAF7F2] dark:bg-[#1A1613] shadow-md">
          <div className="relative w-full h-[460px] sm:h-[540px]">
            {!keyChecked ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-[#5C564D]">
                Carregando configuração do mapa...
              </div>
            ) : apiKey ? (
              <APIProvider
                apiKey={apiKey}
                libraries={['core', 'places', 'marker', 'routes']}
                language="pt-BR"
                region="BR"
              >
                <GoogleMap
                  mapId="DEMO_MAP_ID"
                  defaultCenter={{ lat: -23.5425, lng: -46.6579 }}
                  defaultZoom={13}
                  gestureHandling="greedy"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  <InteractiveMapContent
                    searchQuery={searchQuery}
                    searchNonce={searchNonce}
                    originCoords={userCoords}
                    routeDestination={routeDest}
                    onPlacesLoaded={setDiscoveredPlaces}
                    onRouteSummary={setRouteSummary}
                    onRequestRoute={setRouteDest}
                  />
                </GoogleMap>
              </APIProvider>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#FAF7F2] dark:bg-[#161210]">
                <div className="max-w-md space-y-3">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#8B2635] dark:text-[#F3D78E]">
                    Mapa Interativo · Aguardando Chave Maps
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#1E1B18] dark:text-[#FAF7F2]">
                    Configure VITE_GOOGLE_MAPS_API_KEY para renderizar o mapa dinâmico
                  </h3>
                  <p className="text-xs text-[#5C564D] dark:text-[#C2B8AA] leading-relaxed">
                    Para ativar os marcadores avançados (<code className="px-1 py-0.5 rounded bg-black/5">AdvancedMarkerElement</code>), Places API (New) e cálculo de rotas no mapa interativo, adicione sua chave nas variáveis de ambiente do projeto (<code className="px-1 py-0.5 rounded bg-black/5">VITE_GOOGLE_MAPS_API_KEY</code>). Enquanto isso, o painel ao lado executa buscas reais via Google Maps Grounding.
                  </p>
                </div>
              </div>
            )}
          </div>

          {routeSummary && (
            <div className="px-4 py-3 bg-[#173322] text-[#FAF7F2] border-t border-[#C68A36]/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>
                <strong>Rota B2B até {routeSummary.destName}:</strong> {routeSummary.distanceKm} km · aprox.{' '}
                {routeSummary.durationMin} min de carro
              </span>
              <button
                type="button"
                onClick={() => setRouteDest(null)}
                className="underline text-[#F3D78E] cursor-pointer"
              >
                Limpar rota
              </button>
            </div>
          )}

          {discoveredPlaces.length > 0 && (
            <div className="p-3 border-t border-[#E5DACB] dark:border-[#352C23] bg-white dark:bg-[#1E1B18] flex flex-wrap gap-2">
              {discoveredPlaces.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setRouteDest({ lat: p.lat, lng: p.lng, name: p.name })}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] dark:bg-[#26201B] border border-[#E5DACB] dark:border-[#352C23] text-[11px] font-semibold text-[#1E1B18] dark:text-[#FAF7F2] hover:border-[#8B2635] cursor-pointer"
                >
                  {p.name} {typeof p.rating === 'number' ? `(${p.rating.toFixed(1)}★)` : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Google Maps Grounding Intelligence Panel */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5DACB] dark:border-[#352C23]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B2635] dark:text-[#F3D78E]">
                Google Maps Data · Grounding
              </span>
              <h3 className="font-serif text-xl font-bold text-[#1E1B18] dark:text-[#FAF7F2]">
                Radar Gastronômico & Links Diretos
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                runMapsGrounding(
                  customQuery.trim() ||
                    REGION_PRESETS.find((p) => p.id === activePresetId)?.groundingQuery ||
                    REGION_PRESETS[0].groundingQuery,
                  userCoords
                )
              }
              disabled={groundingLoading}
              className="px-3 py-1.5 rounded-lg bg-[#8B2635] text-white text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              {groundingLoading ? 'Buscando...' : 'Consultar Agora'}
            </button>
          </div>

          {groundingError && (
            <div className="rounded-xl border border-[#8B2635]/40 bg-[#8B2635]/5 p-3 text-xs text-[#8B2635] dark:text-[#F3B0B8]">
              {groundingError}
            </div>
          )}

          {!groundingText && !groundingError && !groundingLoading && (
            <div className="rounded-xl bg-[#FAF7F2] dark:bg-[#231E1A] border border-[#E5DACB] dark:border-[#352C23] p-4 text-xs text-[#5C564D] dark:text-[#C2B8AA] leading-relaxed">
              Clique em <strong>Consultar Agora</strong> ou escolha uma região acima para descobrir casas de chá, hotéis e restaurantes reais com links verificados e trechos de avaliações do Google Maps.
            </div>
          )}

          {groundingText && (
            <div className="max-h-[240px] overflow-y-auto pr-1 text-xs text-[#3B352F] dark:text-[#E5DDD0] leading-relaxed whitespace-pre-wrap">
              {groundingText}
            </div>
          )}

          {groundedPlaces.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E5DACB] dark:border-[#352C23]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#696256] dark:text-[#A8A095]">
                Locais Verificados no Google Maps ({groundedPlaces.length})
              </div>
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {groundedPlaces.map((gp, idx) => (
                  <div
                    key={`${gp.uri}_${idx}`}
                    className="rounded-xl border border-[#E5DACB] dark:border-[#352C23] bg-[#FAF7F2] dark:bg-[#231E1A] p-3 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-[#1E1B18] dark:text-[#FAF7F2]">{gp.title}</span>
                      {gp.uri && (
                        <a
                          href={gp.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[11px] font-bold text-[#8B2635] dark:text-[#F3D78E] underline"
                        >
                          Ver no Maps
                        </a>
                      )}
                    </div>
                    {gp.reviewSnippets.length > 0 && (
                      <div className="space-y-1">
                        {gp.reviewSnippets.slice(0, 2).map((snip, sIdx) => (
                          <div key={sIdx} className="text-[11px] text-[#5C564D] dark:text-[#C2B8AA]">
                            {snip.uri ? (
                              <a href={snip.uri} target="_blank" rel="noopener noreferrer" className="underline">
                                “{snip.title || 'Avaliação de cliente no Google Maps'}”
                              </a>
                            ) : (
                              <span>“{snip.title}”</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
