/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, Component } from 'react';
import {
  FileText,
  Briefcase,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Download,
  ExternalLink,
  PencilLine,
  ShieldCheck,
  LogOut,
  Building2,
  MapPin,
  Layers,
  AlertCircle,
  ArrowUpRight,
  Check,
  X,
  Coffee,
  MessageCircle,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
  Copy,
  CloudUpload,
  Thermometer,
  Hourglass,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react';
import CartaPdfPreviewModal from './CartaPdfPreviewModal';

export interface SavedCartaItem {
  id: string;
  uid?: string;
  ownerId?: string;
  name: string;
  establishmentName?: string;
  businessType: string;
  audienceProfile?: string;
  operatingHours?: string;
  menuHighlights?: string;
  serviceFormat?: string;
  cartaTitle?: string;
  itemCount: number;
  customBlendIds?: string[];
  removedBlendIds?: string[];
  replacedBlendMap?: Record<string, string>;
  savedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  source?: 'cloud' | 'local';
}

export type LeadStatus = 'novo' | 'em_atendimento' | 'concluido';
export type LeadInterestType = 'proposta' | 'experimentar' | 'carta' | 'especialista' | 'evento';

export interface CommercialProposalItem {
  id: string;
  uid?: string;
  ownerId?: string;
  name: string;
  company: string;
  role?: string;
  whatsapp?: string;
  email: string;
  city?: string;
  estimatedQuantity?: string;
  interestType: LeadInterestType;
  recommendedTeaName?: string;
  notes?: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt?: string;
  source?: 'cloud' | 'local';
}

export interface DashboardEstabelecimentoProps {
  onOpenCarta?: (carta?: SavedCartaItem) => void;
  onOpenLeadModal?: (interestType?: LeadInterestType, recommendedTeaName?: string) => void;
  onOpenFullDashboard?: () => void;
  variant?: 'full' | 'compact';
}

interface BridgeShape {
  useAuth: () => any;
  useLang: () => {
    language: 'pt' | 'en' | 'es';
    localize: (pt: string, en?: string, es?: string) => string;
  };
  useTheme: () => { isDark: boolean };
  firebase: {
    config: {
      projectId: string;
      firestoreDatabaseId?: string;
    };
    db: any;
    auth: any;
    doc: (...args: any[]) => any;
    getDoc?: (ref: any) => Promise<any>;
    setDoc: (ref: any, data: any) => Promise<void>;
    updateDoc: (ref: any, data: any) => Promise<void>;
    deleteDoc: (ref: any) => Promise<void>;
    serverTimestamp: () => any;
    testConnection: () => Promise<void>;
    handleFirestoreError: (err: unknown, op: string, path: string) => never;
    OperationType: {
      CREATE: string;
      UPDATE: string;
      DELETE: string;
      LIST: string;
      GET: string;
      WRITE: string;
    };
  };
  catalog: {
    products: any[];
    getTemplateForBusiness: (businessType: string, lang: string) => any;
    localizeProduct: (product: any, lang: string) => any;
    localizeCategory: (category: string, lang: string) => string;
  };
  storage: {
    getCartas: () => SavedCartaItem[];
    deleteCarta: (id: string) => SavedCartaItem[];
    getLeads: () => any[];
    getLeadsStorageKey: () => string;
    sanitizeId: (val: string) => string;
    sanitizeText: (val: string | undefined, max: number, fallback?: string) => string;
    commercialContact: {
      cleanPhone: string;
      phone: string;
      email: string;
    };
  };
  pdf: {
    downloadCartaPdf: (payload: any) => Promise<void>;
  };
}

function getBridge(): BridgeShape | null {
  return (globalThis as any).__TALCHA_DASHBOARD_BRIDGE__ || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore REST Value Parser (preserves Firestore Security Rules via ID Token)
// ─────────────────────────────────────────────────────────────────────────────
function decodeFirestoreValue(v: any): any {
  if (!v || typeof v !== 'object') return undefined;
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return String(v.stringValue);
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('timestampValue' in v) return String(v.timestampValue);
  if ('arrayValue' in v) {
    const vals = v.arrayValue?.values;
    return Array.isArray(vals) ? vals.map(decodeFirestoreValue) : [];
  }
  if ('mapValue' in v) {
    const fields = v.mapValue?.fields || {};
    const out: Record<string, any> = {};
    for (const [k, fv] of Object.entries(fields)) {
      out[k] = decodeFirestoreValue(fv);
    }
    return out;
  }
  return undefined;
}

function decodeFirestoreDocument(docObj: any): Record<string, any> | null {
  if (!docObj || !docObj.fields) return null;
  const parsed: Record<string, any> = {};
  for (const [key, val] of Object.entries(docObj.fields)) {
    parsed[key] = decodeFirestoreValue(val);
  }
  if (!parsed.id && typeof docObj.name === 'string') {
    const segs = docObj.name.split('/');
    parsed.id = segs[segs.length - 1];
  }
  return parsed;
}

async function runFirestoreQuery(opts: {
  projectId: string;
  databaseId: string;
  idToken: string;
  parentSubpath?: string;
  structuredQuery: Record<string, any>;
}): Promise<Record<string, any>[]> {
  const dbId = opts.databaseId || '(default)';
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    opts.projectId
  )}/databases/${encodeURIComponent(dbId)}/documents`;
  const url = opts.parentSubpath
    ? `${base}/${opts.parentSubpath}:runQuery`
    : `${base}:runQuery`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.idToken}`,
    },
    body: JSON.stringify({ structuredQuery: opts.structuredQuery }),
  });

  if (!res.ok) {
    const errPayload = await res.json().catch(() => null);
    const errMsg =
      (Array.isArray(errPayload) ? errPayload[0]?.error?.message : errPayload?.error?.message) ||
      `Firestore HTTP ${res.status}`;
    throw new Error(errMsg);
  }

  const rows = await res.json();
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => decodeFirestoreDocument(r?.document))
    .filter((d): d is Record<string, any> => Boolean(d));
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Boundary (per firebase-integration-rpc guidelines)
// ─────────────────────────────────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class DashboardErrorBoundary extends Component<
  { children: React.ReactNode; onReset?: () => void },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || 'Erro inesperado no painel.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-[#8B2635]/30 bg-white dark:bg-[#1A1613] p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B2635]/10 text-[#8B2635] dark:text-[#E88E9B] flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF8F5]">
            Não foi possível carregar o Dashboard do Estabelecimento
          </h3>
          <p className="text-xs text-[#6E6659] dark:text-[#A89E90] max-w-md mx-auto">
            {this.state.message}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, message: '' });
              this.props.onReset?.();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B2635] text-white text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar Novamente</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting, Proposal Matching & Commercial Status Mapping Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDateShort(iso: string | undefined, lang: 'pt' | 'en' | 'es'): string {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '—';
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR';
  return dt.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string | undefined, lang: 'pt' | 'en' | 'es'): string {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '—';
  const locale = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR';
  return dt.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeStr(v?: string): string {
  return String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getInterestLabel(
  interest: LeadInterestType | string,
  localize: (pt: string, en?: string, es?: string) => string
): string {
  switch (interest) {
    case 'proposta':
      return localize('Proposta Comercial B2B', 'B2B Commercial Proposal', 'Propuesta Comercial B2B');
    case 'experimentar':
      return localize('Degustação & Amostras', 'Tasting & Samples', 'Degustación y Muestras');
    case 'carta':
      return localize('Curadoria de Carta', 'Tea Menu Curation', 'Curaduría de Carta');
    case 'especialista':
      return localize('Consultoria Sommelier', 'Sommelier Consulting', 'Consultoría Sommelier');
    case 'evento':
      return localize('Evento Corporativo', 'Corporate Event', 'Evento Corporativo');
    default:
      return localize('Atendimento B2B', 'B2B Service', 'Atención B2B');
  }
}

function getStatusMeta(
  status: LeadStatus | string,
  localize: (pt: string, en?: string, es?: string) => string
) {
  switch (status) {
    case 'concluido':
      return {
        label: localize('Aprovada', 'Approved', 'Aprobada'),
        step: 3,
        desc: localize(
          'Proposta comercial aprovada com tabela atacado e implantação liberada.',
          'Commercial proposal approved with wholesale pricing and rollout ready.',
          'Propuesta comercial aprobada con condiciones mayoristas liberadas.'
        ),
        badgeClass:
          'bg-[#2E6B34]/12 text-[#235428] dark:bg-[#2E6B34]/25 dark:text-[#7FE08A] border border-[#2E6B34]/25',
      };
    case 'em_atendimento':
      return {
        label: localize('Em Análise', 'Under Review', 'En Análisis'),
        step: 2,
        desc: localize(
          'Consultor Talchá analisando mix de blends, volume mensal e condições logísticas.',
          'Talchá advisor analyzing blend mix, monthly volume and logistics terms.',
          'Consultor Talchá analizando mix de blends, volumen y logística.'
        ),
        badgeClass:
          'bg-[#C68A36]/14 text-[#8F5F14] dark:bg-[#C68A36]/20 dark:text-[#F2C374] border border-[#C68A36]/30',
      };
    case 'novo':
    default:
      return {
        label: localize('Pendente', 'Pending', 'Pendiente'),
        step: 1,
        desc: localize(
          'Solicitação recebida na fila comercial B2B aguardando avaliação.',
          'Request received in the B2B commercial queue awaiting evaluation.',
          'Solicitud recibida en la fila comercial B2B esperando evaluación.'
        ),
        badgeClass:
          'bg-[#8B2635]/10 text-[#8B2635] dark:bg-[#8B2635]/25 dark:text-[#F099A5] border border-[#8B2635]/25',
      };
  }
}

function findMatchingProposalForCarta(
  carta: SavedCartaItem,
  proposals: CommercialProposalItem[]
): CommercialProposalItem | null {
  if (!proposals.length) return null;
  const cartaNameNorm = normalizeStr(carta.name);
  const cartaTitleNorm = normalizeStr(carta.cartaTitle);
  const venueNorm = normalizeStr(carta.establishmentName);

  // 1. Direct match by recommendedTeaName or notes referencing the menu name
  const directMatch = proposals.find((p) => {
    const rec = normalizeStr(p.recommendedTeaName);
    const notes = normalizeStr(p.notes);
    if (rec && cartaNameNorm && (rec === cartaNameNorm || rec.includes(cartaNameNorm) || cartaNameNorm.includes(rec))) {
      return true;
    }
    if (rec && cartaTitleNorm && (rec === cartaTitleNorm || rec.includes(cartaTitleNorm))) {
      return true;
    }
    if (notes && cartaNameNorm.length >= 4 && notes.includes(cartaNameNorm)) {
      return true;
    }
    return false;
  });
  if (directMatch) return directMatch;

  // 2. Establishment venue match for carta / proposta inquiries
  if (venueNorm.length >= 3) {
    const venueMatch = proposals.find((p) => {
      const comp = normalizeStr(p.company);
      return (
        comp &&
        (comp === venueNorm || comp.includes(venueNorm) || venueNorm.includes(comp)) &&
        (p.interestType === 'carta' || p.interestType === 'proposta')
      );
    });
    if (venueMatch) return venueMatch;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component: DashboardEstabelecimento
// ─────────────────────────────────────────────────────────────────────────────
function DashboardEstabelecimentoInner({
  onOpenCarta = () => {},
  onOpenLeadModal = () => {},
  onOpenFullDashboard,
  variant = 'full',
}: DashboardEstabelecimentoProps) {
  const bridge = getBridge();
  if (!bridge) return null;

  const { useAuth, useLang, firebase, catalog, storage, pdf } = bridge;
  const {
    user,
    isAuthReady,
    userProfile,
    firebaseUser,
    signOutSession,
    setIsAuthModalOpen,
    authenticatedFetch,
  } = useAuth();
  const { language, localize } = useLang();

  const [activeTab, setActiveTab] = useState<'overview' | 'cartas' | 'propostas'>(() => {
    const init = (globalThis as any).__TALCHA_DASHBOARD_INIT_STATE__;
    if (variant === 'full' && init?.tab) return init.tab;
    return 'overview';
  });
  const [cartas, setCartas] = useState<SavedCartaItem[]>([]);
  const [starterTemplates, setStarterTemplates] = useState<SavedCartaItem[]>([]);
  const [proposals, setProposals] = useState<CommercialProposalItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  // Filters
  const [cartaSearch, setCartaSearch] = useState('');
  const [cartaSegmentFilter, setCartaSegmentFilter] = useState('all');
  const [proposalSearch, setProposalSearch] = useState('');
  const [proposalStatusFilter, setProposalStatusFilter] = useState<'all' | LeadStatus>(() => {
    const init = (globalThis as any).__TALCHA_DASHBOARD_INIT_STATE__;
    if (variant === 'full' && init?.statusFilter) {
      delete (globalThis as any).__TALCHA_DASHBOARD_INIT_STATE__;
      return init.statusFilter;
    }
    return 'all';
  });
  const [proposalTypeFilter, setProposalTypeFilter] = useState<'all' | LeadInterestType>('all');

  // Detailed view & Carta Firestore editing state
  const [expandedCartaIds, setExpandedCartaIds] = useState<Record<string, boolean>>({});
  const [editingCartaId, setEditingCartaId] = useState<string | null>(null);
  const [editCartaName, setEditCartaName] = useState('');
  const [editCartaVenue, setEditCartaVenue] = useState('');
  const [editCartaService, setEditCartaService] = useState('');
  const [editCartaHighlights, setEditCartaHighlights] = useState('');
  const [savingCartaId, setSavingCartaId] = useState<string | null>(null);
  const [syncingCartaId, setSyncingCartaId] = useState<string | null>(null);

  // Inline Interactions
  const [confirmDeleteCartaId, setConfirmDeleteCartaId] = useState<string | null>(null);
  const [confirmDeleteProposalId, setConfirmDeleteProposalId] = useState<string | null>(null);
  const [downloadingCartaId, setDownloadingCartaId] = useState<string | null>(null);
  const [previewCarta, setPreviewCarta] = useState<SavedCartaItem | null>(null);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingProposal, setSavingProposal] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message });
    setTimeout(() => {
      setActionFeedback((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  }, []);

  const toggleCartaDetails = useCallback((id: string) => {
    setExpandedCartaIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Ensure /users/{uid} exists before writing cartas subcollection (required by firestore.rules)
  const ensureUserProfileDoc = useCallback(async () => {
    if (!firebaseUser || !firebaseUser.emailVerified) return false;
    const safeUid = storage.sanitizeId(firebaseUser.uid);
    const userRef = firebase.doc(firebase.db, 'users', safeUid);
    if (firebase.getDoc) {
      try {
        const snap = await firebase.getDoc(userRef);
        if (snap.exists()) return true;
      } catch {
        // Proceed to create if needed
      }
    }
    try {
      await firebase.setDoc(userRef, {
        uid: safeUid,
        displayName: storage.sanitizeText(
          user?.displayName || firebaseUser.displayName || 'Parceiro Talchá',
          120,
          'Parceiro Talchá'
        ),
        role: user?.role === 'admin' ? 'admin' : 'partner',
        tier: 'prata',
        providerId: firebaseUser.providerData?.[0]?.providerId || 'google.com',
        createdAt: firebase.serverTimestamp(),
        updatedAt: firebase.serverTimestamp(),
      });
      return true;
    } catch {
      return false;
    }
  }, [firebase, firebaseUser, storage, user]);

  const resolveCartaBlends = useCallback(
    (carta: SavedCartaItem) => {
      const tpl = catalog.getTemplateForBusiness(carta.businessType || 'Restaurante', language);
      const removed = new Set(Array.isArray(carta.removedBlendIds) ? carta.removedBlendIds : []);
      const replaced = carta.replacedBlendMap || {};
      const resolvedItems: any[] = [];

      if (Array.isArray(tpl?.items)) {
        for (const baseItem of tpl.items) {
          if (removed.has(baseItem.blend.id)) continue;
          const replId = replaced[baseItem.blend.id];
          if (replId) {
            const replProduct = catalog.products.find((p) => p.id === replId);
            if (replProduct) {
              const locP = catalog.localizeProduct(replProduct, language);
              resolvedItems.push({
                blend: replProduct,
                roleInMenu: baseItem.roleInMenu,
                serviceTip: `${locP.brewGuide?.tempC || '90°C'} · ${
                  locP.brewGuide?.infusionTime || '3 min'
                }`,
              });
              continue;
            }
          }
          resolvedItems.push(baseItem);
        }
      }

      if (Array.isArray(carta.customBlendIds)) {
        for (const customId of carta.customBlendIds) {
          if (resolvedItems.some((it) => it.blend.id === customId)) continue;
          const product = catalog.products.find((p) => p.id === customId);
          if (product) {
            const locP = catalog.localizeProduct(product, language);
            resolvedItems.push({
              blend: product,
              roleInMenu: localize(
                `Seleção Personalizada · ${catalog.localizeCategory(locP.category, language)}`,
                `Custom Selection · ${catalog.localizeCategory(locP.category, language)}`,
                `Selección Personalizada · ${catalog.localizeCategory(locP.category, language)}`
              ),
              serviceTip: `${locP.brewGuide?.tempC || '90°C'} · ${
                locP.brewGuide?.infusionTime || '3 min'
              }`,
            });
          }
        }
      }

      return { tpl, items: resolvedItems };
    },
    [catalog, language, localize]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Load Cartas & Commercial Proposals from Firestore when Auth detects logged user
  // ───────────────────────────────────────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setSyncError(null);

    const localCartasRaw = storage.getCartas();
    const localTemplates = localCartasRaw
      .filter((c) => c.id.startsWith('preset_'))
      .map((c) => ({ ...c, source: 'local' as const }));
    const localUserCartas = localCartasRaw
      .filter((c) => !c.id.startsWith('preset_'))
      .map((c) => ({ ...c, source: 'local' as const }));

    const localLeads = (storage.getLeads() || []).map((l: any) => ({
      ...l,
      status: (['novo', 'em_atendimento', 'concluido'].includes(l.status)
        ? l.status
        : 'novo') as LeadStatus,
      interestType: ([
        'proposta',
        'experimentar',
        'carta',
        'especialista',
        'evento',
      ].includes(l.interestType)
        ? l.interestType
        : 'proposta') as LeadInterestType,
      source: 'local' as const,
    }));

    setStarterTemplates(localTemplates);

    let cloudCartas: SavedCartaItem[] = [];
    let cloudLeads: CommercialProposalItem[] = [];
    let firestoreIssue: string | null = null;

    if (firebaseUser) {
      const safeUid = storage.sanitizeId(firebaseUser.uid);
      try {
        await firebase.testConnection().catch(() => {});
        const idToken = await firebaseUser.getIdToken();

        // 1. Query /users/{safeUid}/cartas
        try {
          const docs = await runFirestoreQuery({
            projectId: firebase.config.projectId,
            databaseId: firebase.config.firestoreDatabaseId || '(default)',
            idToken,
            parentSubpath: `users/${encodeURIComponent(safeUid)}`,
            structuredQuery: {
              from: [{ collectionId: 'cartas' }],
              where: {
                compositeFilter: {
                  op: 'AND',
                  filters: [
                    {
                      fieldFilter: {
                        field: { fieldPath: 'ownerId' },
                        op: 'EQUAL',
                        value: { stringValue: safeUid },
                      },
                    },
                    {
                      fieldFilter: {
                        field: { fieldPath: 'uid' },
                        op: 'EQUAL',
                        value: { stringValue: safeUid },
                      },
                    },
                  ],
                },
              },
            },
          });
          cloudCartas = docs.map((d) => ({
            id: String(d.id),
            uid: d.uid,
            ownerId: d.ownerId,
            name: String(d.name || 'Carta B2B'),
            establishmentName: d.establishmentName || '',
            businessType: String(d.businessType || 'Restaurante'),
            audienceProfile: d.audienceProfile || '',
            operatingHours: d.operatingHours || '',
            menuHighlights: d.menuHighlights || '',
            serviceFormat: d.serviceFormat || '',
            cartaTitle: d.cartaTitle || '',
            itemCount: Number(d.itemCount) || 4,
            customBlendIds: Array.isArray(d.customBlendIds) ? d.customBlendIds : [],
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            savedAt: d.updatedAt || d.createdAt,
            source: 'cloud' as const,
          }));
        } catch (err: any) {
          try {
            firebase.handleFirestoreError(err, firebase.OperationType.LIST, `users/${safeUid}/cartas`);
          } catch {}
          firestoreIssue = err?.message || 'Erro ao sincronizar cartas na nuvem.';
        }

        // 2. Query /b2b_leads
        if (firebaseUser.emailVerified) {
          try {
            const leadDocs = await runFirestoreQuery({
              projectId: firebase.config.projectId,
              databaseId: firebase.config.firestoreDatabaseId || '(default)',
              idToken,
              structuredQuery: {
                from: [{ collectionId: 'b2b_leads' }],
                where: {
                  fieldFilter: {
                    field: { fieldPath: 'ownerId' },
                    op: 'EQUAL',
                    value: { stringValue: safeUid },
                  },
                },
              },
            });
            cloudLeads = leadDocs.map((d) => ({
              id: String(d.id),
              uid: d.uid,
              ownerId: d.ownerId,
              name: String(d.name || ''),
              company: String(d.company || ''),
              role: d.role || '',
              whatsapp: d.whatsapp || '',
              email: String(d.email || ''),
              city: d.city || '',
              estimatedQuantity: d.estimatedQuantity || '',
              interestType: ([
                'proposta',
                'experimentar',
                'carta',
                'especialista',
                'evento',
              ].includes(d.interestType)
                ? d.interestType
                : 'proposta') as LeadInterestType,
              recommendedTeaName: d.recommendedTeaName || '',
              notes: d.notes || '',
              status: (['novo', 'em_atendimento', 'concluido'].includes(d.status)
                ? d.status
                : 'novo') as LeadStatus,
              createdAt: d.createdAt || new Date().toISOString(),
              updatedAt: d.updatedAt || d.createdAt,
              source: 'cloud' as const,
            }));
          } catch (err: any) {
            try {
              firebase.handleFirestoreError(err, firebase.OperationType.LIST, 'b2b_leads');
            } catch {}
            if (!firestoreIssue) {
              firestoreIssue = err?.message || 'Erro ao sincronizar propostas na nuvem.';
            }
          }
        }
      } catch (err: any) {
        firestoreIssue = err?.message || 'Falha de autenticação com o Firestore.';
      }
    }

    const cartaMap = new Map<string, SavedCartaItem>();
    for (const c of localUserCartas) {
      cartaMap.set(c.id, c);
    }
    for (const c of cloudCartas) {
      const existingLocal = cartaMap.get(c.id);
      cartaMap.set(c.id, {
        ...(existingLocal || {}),
        ...c,
        removedBlendIds: existingLocal?.removedBlendIds,
        replacedBlendMap: existingLocal?.replacedBlendMap,
        source: 'cloud',
      });
    }
    const mergedCartas = Array.from(cartaMap.values()).sort((a, b) => {
      const ta = new Date(a.updatedAt || a.savedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.savedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });

    const leadMap = new Map<string, CommercialProposalItem>();
    for (const l of localLeads) {
      leadMap.set(l.id, l);
    }
    for (const l of cloudLeads) {
      leadMap.set(l.id, { ...l, source: 'cloud' });
    }
    const mergedLeads = Array.from(leadMap.values()).sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });

    setCartas(mergedCartas);
    setProposals(mergedLeads);
    setSyncError(firestoreIssue);
    setLastSyncAt(new Date().toISOString());
    setLoading(false);
  }, [firebase, firebaseUser, storage, user]);

  useEffect(() => {
    if (isAuthReady && user) {
      loadDashboardData();
    } else if (isAuthReady && !user) {
      setCartas([]);
      setProposals([]);
      setLoading(false);
    }
  }, [isAuthReady, user, loadDashboardData]);

  useEffect(() => {
    const onFocus = () => {
      if (user) loadDashboardData();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('talcha_dashboard_refresh', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('talcha_dashboard_refresh', onFocus);
    };
  }, [user, loadDashboardData]);

  // ───────────────────────────────────────────────────────────────────────────
  // Carta Firestore Actions (Sync, Edit, Duplicate, Delete, PDF Export)
  // ───────────────────────────────────────────────────────────────────────────
  const writeCartaToFirestore = useCallback(
    async (carta: SavedCartaItem) => {
      if (!firebaseUser || !firebaseUser.emailVerified) {
        throw new Error(
          localize(
            'Verifique seu e-mail para salvar cartas no Firestore.',
            'Verify your email to save menus to Firestore.',
            'Verifica tu correo para guardar cartas en Firestore.'
          )
        );
      }

      const safeUid = storage.sanitizeId(firebaseUser.uid);
      const safeCartaId = storage.sanitizeId(carta.id);
      await ensureUserProfileDoc();

      const customIds = Array.isArray(carta.customBlendIds)
        ? carta.customBlendIds.slice(0, 20).map((id) => storage.sanitizeText(String(id), 80, ''))
        : [];

      const path = `users/${safeUid}/cartas/${safeCartaId}`;
      try {
        await firebase.setDoc(firebase.doc(firebase.db, 'users', safeUid, 'cartas', safeCartaId), {
          id: safeCartaId,
          uid: safeUid,
          ownerId: safeUid,
          name: storage.sanitizeText(carta.name, 140, 'Carta Personalizada'),
          establishmentName: storage.sanitizeText(carta.establishmentName, 150, ''),
          businessType: storage.sanitizeText(carta.businessType, 80, 'Restaurante'),
          audienceProfile: storage.sanitizeText(carta.audienceProfile, 200, ''),
          operatingHours: storage.sanitizeText(carta.operatingHours, 120, ''),
          menuHighlights: storage.sanitizeText(carta.menuHighlights, 500, ''),
          serviceFormat: storage.sanitizeText(carta.serviceFormat, 160, 'Serviço de Salão'),
          cartaTitle: storage.sanitizeText(carta.cartaTitle, 160, 'Carta de Chás B2B'),
          itemCount: Math.max(1, Math.min(20, Number(carta.itemCount) || 4)),
          customBlendIds: customIds.filter(Boolean),
          createdAt: firebase.serverTimestamp(),
          updatedAt: firebase.serverTimestamp(),
        });
      } catch (err) {
        firebase.handleFirestoreError(err, firebase.OperationType.CREATE, path);
      }
    },
    [ensureUserProfileDoc, firebase, firebaseUser, localize, storage]
  );

  const handleSyncCartaToCloud = async (carta: SavedCartaItem) => {
    if (syncingCartaId) return;
    setSyncingCartaId(carta.id);
    try {
      await writeCartaToFirestore(carta);
      const nowIso = new Date().toISOString();
      setCartas((prev) =>
        prev.map((c) => (c.id === carta.id ? { ...c, source: 'cloud', updatedAt: nowIso } : c))
      );
      showFeedback(
        'success',
        localize(
          `"${carta.name}" sincronizada no Firestore com sucesso.`,
          `"${carta.name}" synced to Firestore successfully.`,
          `"${carta.name}" sincronizada en Firestore.`
        )
      );
    } catch (err: any) {
      showFeedback(
        'error',
        err?.message || localize('Não foi possível sincronizar a carta.', 'Could not sync menu.', 'Error al sincronizar.')
      );
    } finally {
      setSyncingCartaId(null);
    }
  };

  const startEditCarta = (carta: SavedCartaItem) => {
    setEditingCartaId(carta.id);
    setEditCartaName(carta.name || '');
    setEditCartaVenue(carta.establishmentName || '');
    setEditCartaService(carta.serviceFormat || '');
    setEditCartaHighlights(carta.menuHighlights || '');
    setExpandedCartaIds((prev) => ({ ...prev, [carta.id]: true }));
  };

  const handleSaveCartaEdit = async (carta: SavedCartaItem) => {
    if (savingCartaId) return;
    const nextName = storage.sanitizeText(editCartaName, 140, carta.name || 'Carta Personalizada');
    if (!nextName) return;

    setSavingCartaId(carta.id);
    const nextVenue = storage.sanitizeText(editCartaVenue, 150, '');
    const nextService = storage.sanitizeText(editCartaService, 160, '');
    const nextHighlights = storage.sanitizeText(editCartaHighlights, 500, '');
    const nowIso = new Date().toISOString();

    try {
      if (firebaseUser && firebaseUser.emailVerified && carta.source === 'cloud') {
        const safeUid = storage.sanitizeId(firebaseUser.uid);
        const safeCartaId = storage.sanitizeId(carta.id);
        const path = `users/${safeUid}/cartas/${safeCartaId}`;
        try {
          await firebase.updateDoc(firebase.doc(firebase.db, 'users', safeUid, 'cartas', safeCartaId), {
            name: nextName,
            establishmentName: nextVenue,
            businessType: storage.sanitizeText(carta.businessType, 80, 'Restaurante'),
            audienceProfile: storage.sanitizeText(carta.audienceProfile, 200, ''),
            operatingHours: storage.sanitizeText(carta.operatingHours, 120, ''),
            menuHighlights: nextHighlights,
            serviceFormat: nextService,
            cartaTitle: storage.sanitizeText(carta.cartaTitle, 160, nextName),
            itemCount: Math.max(1, Math.min(20, Number(carta.itemCount) || 4)),
            customBlendIds: Array.isArray(carta.customBlendIds)
              ? carta.customBlendIds.slice(0, 20).map((id) => storage.sanitizeText(String(id), 80, '')).filter(Boolean)
              : [],
            updatedAt: firebase.serverTimestamp(),
          });
        } catch (err) {
          firebase.handleFirestoreError(err, firebase.OperationType.UPDATE, path);
        }
      }

      try {
        const storageKey = firebaseUser?.uid
          ? `talchapidia_saved_cartas_v1_${storage.sanitizeId(firebaseUser.uid)}`
          : 'talchapidia_saved_cartas_v1';
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const updatedLocal = parsed.map((item: any) =>
              item.id === carta.id
                ? {
                    ...item,
                    name: nextName,
                    establishmentName: nextVenue,
                    serviceFormat: nextService,
                    menuHighlights: nextHighlights,
                    updatedAt: nowIso,
                  }
                : item
            );
            localStorage.setItem(storageKey, JSON.stringify(updatedLocal));
          }
        }
      } catch {}

      setCartas((prev) =>
        prev.map((c) =>
          c.id === carta.id
            ? {
                ...c,
                name: nextName,
                establishmentName: nextVenue,
                serviceFormat: nextService,
                menuHighlights: nextHighlights,
                updatedAt: nowIso,
              }
            : c
        )
      );
      setEditingCartaId(null);
      showFeedback(
        'success',
        localize('Carta atualizada no histórico.', 'Tea menu updated in history.', 'Carta actualizada.')
      );
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erro ao atualizar a carta no Firestore.');
    } finally {
      setSavingCartaId(null);
    }
  };

  const handleDuplicateCarta = async (carta: SavedCartaItem) => {
    if (syncingCartaId) return;
    setSyncingCartaId(carta.id);
    try {
      const newId = storage.sanitizeId(`carta_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
      const safeUid = firebaseUser ? storage.sanitizeId(firebaseUser.uid) : undefined;
      const nowIso = new Date().toISOString();
      const copyItem: SavedCartaItem = {
        ...carta,
        id: newId,
        uid: safeUid,
        ownerId: safeUid,
        name: storage.sanitizeText(`${carta.name} (${localize('Cópia', 'Copy', 'Copia')})`, 140, carta.name),
        createdAt: nowIso,
        updatedAt: nowIso,
        savedAt: nowIso,
        source: firebaseUser?.emailVerified ? 'cloud' : 'local',
      };

      if (firebaseUser && firebaseUser.emailVerified) {
        await writeCartaToFirestore(copyItem);
      }

      try {
        const storageKey = safeUid
          ? `talchapidia_saved_cartas_v1_${safeUid}`
          : 'talchapidia_saved_cartas_v1';
        const existing = storage.getCartas();
        localStorage.setItem(storageKey, JSON.stringify([copyItem, ...existing]));
      } catch {}

      setCartas((prev) => [copyItem, ...prev]);
      showFeedback(
        'success',
        localize(
          `Nova versão "${copyItem.name}" criada e salva.`,
          `Duplicated "${copyItem.name}" successfully.`,
          `Nueva versión "${copyItem.name}" guardada.`
        )
      );
    } catch (err: any) {
      showFeedback('error', err?.message || 'Não foi possível duplicar a carta.');
    } finally {
      setSyncingCartaId(null);
    }
  };

  const handleDeleteCarta = async (carta: SavedCartaItem) => {
    try {
      if (firebaseUser && firebaseUser.emailVerified && carta.source === 'cloud') {
        const safeUid = storage.sanitizeId(firebaseUser.uid);
        const safeCartaId = storage.sanitizeId(carta.id);
        const path = `users/${safeUid}/cartas/${safeCartaId}`;
        try {
          await firebase.deleteDoc(firebase.doc(firebase.db, 'users', safeUid, 'cartas', safeCartaId));
        } catch (err) {
          firebase.handleFirestoreError(err, firebase.OperationType.DELETE, path);
        }
      }

      storage.deleteCarta(carta.id);
      setCartas((prev) => prev.filter((c) => c.id !== carta.id));
      setConfirmDeleteCartaId(null);
      showFeedback(
        'success',
        localize('Carta removida do histórico.', 'Menu removed from history.', 'Carta eliminada del historial.')
      );
    } catch (err: any) {
      showFeedback('error', err?.message || 'Não foi possível excluir a carta.');
    }
  };

  const handleDownloadCartaPdf = async (carta: SavedCartaItem) => {
    if (downloadingCartaId) return;
    setDownloadingCartaId(carta.id);
    try {
      const { tpl, items } = resolveCartaBlends(carta);
      let clientLogoDataUrl: string | null = null;
      try {
        clientLogoDataUrl = localStorage.getItem('talcha_carta_client_logo') || null;
      } catch {}

      await pdf.downloadCartaPdf({
        establishmentName: carta.establishmentName || userProfile?.company || carta.name,
        businessType: carta.businessType || 'Restaurante',
        audienceProfile: carta.audienceProfile || '',
        operatingHours: carta.operatingHours || '',
        menuHighlights: carta.menuHighlights || '',
        serviceFormat: carta.serviceFormat || '',
        cartaTitle: carta.cartaTitle || tpl?.title || carta.name,
        cartaSubtitle: tpl?.subtitle || '',
        strategicRationale: tpl?.strategicRationale || '',
        items,
        language,
        theme: 'editorial',
        mode: 'executive',
        clientLogoDataUrl,
      });
      showFeedback(
        'success',
        localize(
          `PDF oficial de "${carta.name}" gerado.`,
          `Official PDF for "${carta.name}" downloaded.`,
          `PDF oficial de "${carta.name}" generado.`
        )
      );
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erro ao gerar PDF da carta.');
    } finally {
      setDownloadingCartaId(null);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Commercial Proposal Firestore Actions
  // ───────────────────────────────────────────────────────────────────────────
  const startEditProposal = (lead: CommercialProposalItem) => {
    setEditingProposalId(lead.id);
    setEditQty(lead.estimatedQuantity || '');
    setEditNotes(lead.notes || '');
  };

  const handleSaveProposalEdit = async (lead: CommercialProposalItem) => {
    if (savingProposal) return;
    setSavingProposal(true);

    const nextQty = storage.sanitizeText(editQty, 120, '');
    const nextNotes = storage.sanitizeText(editNotes, 1000, '');
    const nowIso = new Date().toISOString();

    try {
      if (firebaseUser && firebaseUser.emailVerified && lead.source === 'cloud') {
        const path = `b2b_leads/${lead.id}`;
        try {
          await firebase.updateDoc(firebase.doc(firebase.db, 'b2b_leads', lead.id), {
            name: storage.sanitizeText(lead.name, 120, 'Parceiro B2B'),
            company: storage.sanitizeText(lead.company, 150, 'Estabelecimento'),
            role: storage.sanitizeText(lead.role, 100, 'Responsável'),
            whatsapp: storage.sanitizeText(lead.whatsapp, 40, '000000'),
            email: storage.sanitizeText(
              lead.email || firebaseUser.email || 'contato@empresa.com',
              160,
              'contato@empresa.com'
            ),
            city: storage.sanitizeText(lead.city, 100, ''),
            estimatedQuantity: nextQty,
            interestType: lead.interestType,
            recommendedTeaName: storage.sanitizeText(lead.recommendedTeaName, 160, ''),
            notes: nextNotes,
            updatedAt: firebase.serverTimestamp(),
          });
        } catch (err) {
          firebase.handleFirestoreError(err, firebase.OperationType.UPDATE, path);
        }
      }

      try {
        const key = storage.getLeadsStorageKey();
        const existing = storage.getLeads();
        const updated = existing.map((item: any) =>
          item.id === lead.id
            ? { ...item, estimatedQuantity: nextQty, notes: nextNotes, updatedAt: nowIso }
            : item
        );
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}

      setProposals((prev) =>
        prev.map((p) =>
          p.id === lead.id
            ? { ...p, estimatedQuantity: nextQty, notes: nextNotes, updatedAt: nowIso }
            : p
        )
      );
      setEditingProposalId(null);
      showFeedback(
        'success',
        localize(
          'Observações da proposta atualizadas no Firestore.',
          'Proposal notes updated in Firestore.',
          'Notas de la propuesta actualizadas.'
        )
      );
    } catch (err: any) {
      showFeedback('error', err?.message || 'Sem permissão para atualizar esta proposta.');
    } finally {
      setSavingProposal(false);
    }
  };

  const handleAdminStatusChange = async (lead: CommercialProposalItem, nextStatus: LeadStatus) => {
    if (user?.role !== 'admin' || updatingStatusId) return;
    setUpdatingStatusId(lead.id);
    const nowIso = new Date().toISOString();

    try {
      if (firebaseUser && firebaseUser.emailVerified && lead.source === 'cloud') {
        const path = `b2b_leads/${lead.id}`;
        try {
          await firebase.updateDoc(firebase.doc(firebase.db, 'b2b_leads', lead.id), {
            status: nextStatus,
            updatedAt: firebase.serverTimestamp(),
          });
        } catch (err) {
          firebase.handleFirestoreError(err, firebase.OperationType.UPDATE, path);
        }
      }

      try {
        const key = storage.getLeadsStorageKey();
        const existing = storage.getLeads();
        const updated = existing.map((item: any) =>
          item.id === lead.id ? { ...item, status: nextStatus, updatedAt: nowIso } : item
        );
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}

      setProposals((prev) =>
        prev.map((p) => (p.id === lead.id ? { ...p, status: nextStatus, updatedAt: nowIso } : p))
      );
      showFeedback(
        'success',
        localize(
          `Status da proposta "${lead.company}" atualizado.`,
          `Proposal status for "${lead.company}" updated.`,
          `Estado de propuesta actualizado.`
        )
      );
    } catch (err: any) {
      showFeedback('error', err?.message || 'Não foi possível atualizar o status no Firestore.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteProposal = async (lead: CommercialProposalItem) => {
    try {
      if (firebaseUser && firebaseUser.emailVerified && lead.source === 'cloud') {
        const path = `b2b_leads/${lead.id}`;
        try {
          await firebase.deleteDoc(firebase.doc(firebase.db, 'b2b_leads', lead.id));
        } catch (err) {
          firebase.handleFirestoreError(err, firebase.OperationType.DELETE, path);
        }
      }

      try {
        const key = storage.getLeadsStorageKey();
        const filtered = storage.getLeads().filter((item: any) => item.id !== lead.id);
        localStorage.setItem(key, JSON.stringify(filtered));
      } catch {}

      if (typeof authenticatedFetch === 'function') {
        authenticatedFetch(`/api/leads/${encodeURIComponent(lead.id)}`, {
          method: 'DELETE',
        }).catch(() => {});
      }

      setProposals((prev) => prev.filter((p) => p.id !== lead.id));
      setConfirmDeleteProposalId(null);
      showFeedback(
        'success',
        localize(
          'Solicitação comercial removida.',
          'Commercial request removed.',
          'Solicitud comercial eliminada.'
        )
      );
    } catch (err: any) {
      showFeedback('error', err?.message || 'Não foi possível remover a proposta.');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Derived KPIs, Proposal-to-Carta Correlation & Filtered Lists
  // ───────────────────────────────────────────────────────────────────────────
  const establishmentTitle = useMemo(() => {
    if (userProfile?.company?.trim()) return userProfile.company.trim();
    const firstWithName = cartas.find((c) => c.establishmentName?.trim());
    if (firstWithName?.establishmentName) return firstWithName.establishmentName;
    const firstProposal = proposals.find((p) => p.company?.trim());
    if (firstProposal?.company) return firstProposal.company;
    return user?.displayName || localize('Seu Estabelecimento B2B', 'Your B2B Venue', 'Su Establecimiento B2B');
  }, [userProfile, cartas, proposals, user, localize]);

  const segments = useMemo(() => {
    const s = new Set<string>();
    cartas.forEach((c) => {
      if (c.businessType) s.add(c.businessType);
    });
    return Array.from(s);
  }, [cartas]);

  const kpis = useMemo(() => {
    const pendingCount = proposals.filter((p) => p.status === 'novo').length;
    const inReviewCount = proposals.filter((p) => p.status === 'em_atendimento').length;
    const approvedCount = proposals.filter((p) => p.status === 'concluido').length;
    const totalBlends = cartas.reduce((acc, c) => acc + (Number(c.itemCount) || 0), 0);
    const cloudCartasCount = cartas.filter((c) => c.source === 'cloud').length;
    return {
      cartasCount: cartas.length,
      cloudCartasCount,
      proposalsCount: proposals.length,
      pendingCount,
      inReviewCount,
      approvedCount,
      totalBlends,
    };
  }, [cartas, proposals]);

  const latestProposal = useMemo(() => proposals[0] || null, [proposals]);

  const filteredCartas = useMemo(() => {
    const q = cartaSearch.trim().toLowerCase();
    return cartas.filter((c) => {
      if (cartaSegmentFilter !== 'all' && c.businessType !== cartaSegmentFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.establishmentName || '').toLowerCase().includes(q) ||
        (c.businessType || '').toLowerCase().includes(q) ||
        (c.menuHighlights || '').toLowerCase().includes(q)
      );
    });
  }, [cartas, cartaSearch, cartaSegmentFilter]);

  const filteredProposals = useMemo(() => {
    const q = proposalSearch.trim().toLowerCase();
    return proposals.filter((p) => {
      if (proposalStatusFilter !== 'all' && p.status !== proposalStatusFilter) {
        return false;
      }
      if (proposalTypeFilter !== 'all' && p.interestType !== proposalTypeFilter) return false;
      if (!q) return true;
      return (
        p.company.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.recommendedTeaName || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q)
      );
    });
  }, [proposals, proposalSearch, proposalStatusFilter, proposalTypeFilter]);

  // If Auth isn't ready yet on compact view or no logged-in user on compact view, do not clutter Landing
  if (!isAuthReady) {
    if (variant === 'compact') return null;
    return (
      <div id="talcha-dashboard-estabelecimento-scope" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-36 rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] animate-pulse p-6" />
      </div>
    );
  }

  if (!user) {
    if (variant === 'compact') return null;
    return (
      <div id="talcha-dashboard-estabelecimento-scope" className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#8B2635]/10 text-[#8B2635] dark:text-[#E88E9B] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-serif-editorial text-xl font-bold text-[#1E1B18] dark:text-[#FAF8F5]">
            {localize('Dashboard do Estabelecimento', 'Establishment Dashboard', 'Panel del Establecimiento')}
          </h3>
          <p className="text-xs text-[#6E6659] dark:text-[#A89E90] max-w-md mx-auto">
            {localize(
              'Faça login com sua conta autenticada para carregar suas cartas de chá salvas no Firestore e o status das propostas comerciais.',
              'Sign in with your authenticated account to load your saved Firestore tea menus and commercial proposal status.',
              'Inicia sesión para cargar tus cartas de té en Firestore y el estado de tus propuestas.'
            )}
          </p>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold cursor-pointer"
          >
            {localize('Entrar no Portal B2B', 'Sign In to B2B Portal', 'Ingresar al Portal B2B')}
          </button>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Reusable Quick Commercial Proposal Status Strip (Pendente / Em Análise / Aprovada)
  // ───────────────────────────────────────────────────────────────────────────
  const renderQuickProposalStatusOverview = (isCompactView = false) => {
    const stages = [
      {
        id: 'novo' as LeadStatus,
        label: localize('Pendente', 'Pending', 'Pendiente'),
        count: kpis.pendingCount,
        sublabel: localize('Aguardando análise', 'Awaiting review', 'Esperando análisis'),
        icon: Hourglass,
        accentText: 'text-[#8B2635] dark:text-[#F099A5]',
        activeRing: 'border-[#8B2635] bg-[#8B2635]/8 dark:bg-[#8B2635]/18',
      },
      {
        id: 'em_atendimento' as LeadStatus,
        label: localize('Em Análise', 'Under Review', 'En Análisis'),
        count: kpis.inReviewCount,
        sublabel: localize('Consultor avaliando mix', 'Advisor reviewing mix', 'Consultor evaluando'),
        icon: Clock,
        accentText: 'text-[#8F5F14] dark:text-[#F2C374]',
        activeRing: 'border-[#C68A36] bg-[#C68A36]/10 dark:bg-[#C68A36]/18',
      },
      {
        id: 'concluido' as LeadStatus,
        label: localize('Aprovada', 'Approved', 'Aprobada'),
        count: kpis.approvedCount,
        sublabel: localize('Condições liberadas', 'Terms approved', 'Condiciones aprobadas'),
        icon: BadgeCheck,
        accentText: 'text-[#235428] dark:text-[#7FE08A]',
        activeRing: 'border-[#2E6B34] bg-[#2E6B34]/10 dark:bg-[#2E6B34]/18',
      },
    ];

    const totalProposals = kpis.proposalsCount;
    const pendingPct = totalProposals > 0 ? Math.round((kpis.pendingCount / totalProposals) * 100) : 0;
    const inReviewPct = totalProposals > 0 ? Math.round((kpis.inReviewCount / totalProposals) * 100) : 0;
    const approvedPct = totalProposals > 0 ? Math.max(0, 100 - pendingPct - inReviewPct) : 0;

    return (
      <section
        aria-labelledby="quick-proposal-status-heading"
        className={
          isCompactView
            ? 'pb-5 border-b border-[#EDE3D5] dark:border-[#2E251D]'
            : 'rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 sm:p-6'
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#EDE3D5] dark:border-[#2E251D]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#C68A36]">
              {localize('Visualização Rápida Comercial', 'Quick Commercial Status', 'Vista Rápida Comercial')}
            </div>
            <h3
              id="quick-proposal-status-heading"
              className="font-serif-editorial text-lg sm:text-xl font-bold text-[#1E1B18] dark:text-[#FAF8F5] mt-0.5"
            >
              {localize(
                'Status da Proposta Comercial',
                'Commercial Proposal Status',
                'Estado de la Propuesta Comercial'
              )}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {latestProposal && (
              <span className="text-xs text-[#5C564D] dark:text-[#C7BFB2]">
                {localize('Última solicitação:', 'Latest request:', 'Última solicitud:')}{' '}
                <strong className="text-[#1E1B18] dark:text-[#FAF8F5]">
                  {getStatusMeta(latestProposal.status, localize).label}
                </strong>
                {' · '}
                <span className="tabular-nums">{formatDateShort(latestProposal.createdAt, language)}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => onOpenLeadModal('proposta')}
              className="px-3.5 py-1.5 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{localize('Solicitar Proposta', 'Request Proposal', 'Solicitar Propuesta')}</span>
            </button>
          </div>
        </div>

        {/* Visual Pipeline Progress Bar across Pendente / Em Análise / Aprovada */}
        {!loading && totalProposals > 0 && (
          <div className="pt-3.5 space-y-1.5">
            <div className="h-2 w-full rounded-full overflow-hidden bg-[#EDE3D5] dark:bg-[#2E251D] flex">
              {kpis.pendingCount > 0 && (
                <div
                  style={{ width: `${pendingPct}%` }}
                  className="h-full bg-[#8B2635] transition-all duration-300"
                  title={`${localize('Pendente', 'Pending', 'Pendiente')}: ${kpis.pendingCount}`}
                />
              )}
              {kpis.inReviewCount > 0 && (
                <div
                  style={{ width: `${inReviewPct}%` }}
                  className="h-full bg-[#C68A36] transition-all duration-300"
                  title={`${localize('Em Análise', 'Under Review', 'En Análisis')}: ${kpis.inReviewCount}`}
                />
              )}
              {kpis.approvedCount > 0 && (
                <div
                  style={{ width: `${approvedPct}%` }}
                  className="h-full bg-[#2E6B34] transition-all duration-300"
                  title={`${localize('Aprovada', 'Approved', 'Aprobada')}: ${kpis.approvedCount}`}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6E6659] dark:text-[#A89E90] tabular-nums">
              <span>
                {localize(
                  `${totalProposals} proposta(s) comercial(is) vinculada(s) à conta`,
                  `${totalProposals} commercial proposal(s) linked to account`,
                  `${totalProposals} propuesta(s) comercial(es) vinculada(s)`
                )}
              </span>
              <span>
                {kpis.approvedCount > 0
                  ? `${approvedPct}% ${localize('aprovada(s)', 'approved', 'aprobada(s)')}`
                  : kpis.inReviewCount > 0
                  ? `${kpis.inReviewCount} ${localize('em análise comercial', 'under review', 'en análisis')}`
                  : `${kpis.pendingCount} ${localize('pendente(s)', 'pending', 'pendiente(s)')}`}
              </span>
            </div>
          </div>
        )}

        {/* 3-Stage Status Pipeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          {stages.map((st) => {
            const IconComp = st.icon;
            const isSelected = !isCompactView && proposalStatusFilter === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  if (isCompactView && onOpenFullDashboard) {
                    (globalThis as any).__TALCHA_DASHBOARD_INIT_STATE__ = {
                      tab: 'propostas',
                      statusFilter: st.id,
                    };
                    onOpenFullDashboard();
                    return;
                  }
                  setActiveTab('propostas');
                  setProposalStatusFilter((curr) => (curr === st.id ? 'all' : st.id));
                }}
                className={`text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                  isSelected
                    ? st.activeRing
                    : isCompactView
                    ? 'border-[#E5DACB] dark:border-[#352C23] bg-[#FAF7F2]/80 dark:bg-[#221C17] hover:border-[#C68A36]/70'
                    : 'border-[#E5DACB] dark:border-[#352C23] bg-[#FAF7F2]/60 dark:bg-[#221C17] hover:border-[#C68A36]/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${st.accentText}`}>
                    <IconComp className="w-4 h-4 shrink-0" />
                    <span>{st.label}</span>
                  </span>
                  <span className="font-serif-editorial text-2xl font-bold text-[#1E1B18] dark:text-[#FAF8F5] tabular-nums">
                    {loading ? '—' : st.count}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#6E6659] dark:text-[#A89E90]">
                  {st.sublabel}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Compact View (Rendered automatically on Home when logged-in Auth user detected)
  // ───────────────────────────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <section
        id="talcha-dashboard-estabelecimento-scope"
        aria-label={localize('Dashboard do Estabelecimento', 'Establishment Dashboard')}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 space-y-5"
      >
        {/* Authenticated Establishment Header Bar */}
        <div className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EDE3D5] dark:border-[#2E251D]">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#8B2635]/10 dark:bg-[#8B2635]/20 border border-[#8B2635]/20 text-[#8B2635] dark:text-[#E88E9B] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#E88E9B]">
                  <span>{localize('Dashboard do Estabelecimento', 'Establishment Dashboard', 'Panel del Establecimiento')}</span>
                  <span aria-hidden="true" className="text-[#C68A36]">·</span>
                  <span className="text-[#235428] dark:text-[#7FE08A]">
                    {localize('Conectado via Auth & Firestore', 'Connected via Auth & Firestore', 'Conectado a Firestore')}
                  </span>
                </div>
                <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-[#1E1B18] dark:text-[#FAF8F5] truncate mt-0.5">
                  {establishmentTitle}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => loadDashboardData()}
                disabled={loading}
                className="px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{localize('Atualizar', 'Refresh', 'Actualizar')}</span>
              </button>

              {onOpenFullDashboard && (
                <button
                  type="button"
                  onClick={onOpenFullDashboard}
                  className="px-4 py-2 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>{localize('Abrir Dashboard Completo', 'Open Full Dashboard', 'Abrir Panel Completo')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Commercial Proposal Status Strip (Pendente / Em Análise / Aprovada) */}
          {renderQuickProposalStatusOverview(true)}

          {/* Compact Table of Created Tea Menus (Data | Nome da Carta | Status da Proposta) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF8F5]">
                {localize('Cartas de Chá Criadas (Firestore)', 'Created Tea Menus (Firestore)', 'Cartas de Té Creadas')}
              </h3>
              <button
                type="button"
                onClick={() => onOpenCarta()}
                className="text-xs font-semibold text-[#8B2635] dark:text-[#E88E9B] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{localize('Nova Carta de Chá', 'New Tea Menu', 'Nueva Carta')}</span>
              </button>
            </div>

            {loading ? (
              <div className="h-24 rounded-xl bg-[#FAF7F2] dark:bg-[#221C17] border border-[#E5DACB] dark:border-[#352C23] animate-pulse" />
            ) : cartas.length === 0 ? (
              <div className="rounded-xl bg-[#FAF7F2] dark:bg-[#221C17] border border-[#E5DACB] dark:border-[#352C23] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-[#6E6659] dark:text-[#A89E90]">
                  {localize(
                    'Nenhuma carta de chás salva no seu histórico ainda. Crie a primeira carta personalizada para acompanhar suas propostas.',
                    'No saved tea menus yet. Create your first custom tea menu to track proposals.',
                    'Aún no hay cartas guardadas. Crea la primera carta para seguir tus propuestas.'
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenCarta()}
                  className="px-4 py-2 rounded-xl bg-[#8B2635] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {localize('Criar Primeira Carta', 'Create First Menu', 'Crear Primera Carta')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E5DACB] dark:border-[#352C23]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF7F2] dark:bg-[#221C17] border-b border-[#E5DACB] dark:border-[#352C23] text-[11px] font-bold uppercase tracking-wider text-[#6E6659] dark:text-[#A89E90]">
                      <th className="py-2.5 px-4 whitespace-nowrap">{localize('Data', 'Date', 'Fecha')}</th>
                      <th className="py-2.5 px-4">{localize('Nome da Carta', 'Menu Name', 'Nombre de Carta')}</th>
                      <th className="py-2.5 px-4 whitespace-nowrap">{localize('Status da Proposta', 'Proposal Status', 'Estado')}</th>
                      <th className="py-2.5 px-4 text-right whitespace-nowrap">{localize('Ação', 'Action', 'Acción')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE3D5] dark:divide-[#2E251D] bg-white dark:bg-[#1A1613]">
                    {cartas.slice(0, 5).map((carta) => {
                      const matched = findMatchingProposalForCarta(carta, proposals);
                      const statusMeta = matched ? getStatusMeta(matched.status, localize) : null;
                      return (
                        <tr key={carta.id} className="hover:bg-[#FAF7F2]/70 dark:hover:bg-[#221C17]/70 transition-colors">
                          <td className="py-3 px-4 tabular-nums text-[#5C564D] dark:text-[#C7BFB2] whitespace-nowrap">
                            {formatDateShort(carta.updatedAt || carta.savedAt || carta.createdAt, language)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#1E1B18] dark:text-[#FAF8F5]">{carta.name}</div>
                            <div className="text-[11px] text-[#70675A] dark:text-[#9E9487]">
                              {carta.businessType} · {carta.itemCount} blends
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {statusMeta && matched ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenFullDashboard) {
                                    (globalThis as any).__TALCHA_DASHBOARD_INIT_STATE__ = {
                                      tab: 'propostas',
                                      statusFilter: matched.status,
                                    };
                                    onOpenFullDashboard();
                                  }
                                }}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${statusMeta.badgeClass}`}
                              >
                                {statusMeta.step === 3 ? (
                                  <BadgeCheck className="w-3.5 h-3.5" />
                                ) : statusMeta.step === 2 ? (
                                  <Clock className="w-3.5 h-3.5" />
                                ) : (
                                  <Hourglass className="w-3.5 h-3.5" />
                                )}
                                <span>{statusMeta.label}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenLeadModal('proposta', carta.name)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8B2635] dark:text-[#E88E9B] hover:underline cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>{localize('Sem proposta · Solicitar', 'No proposal · Request', 'Sin propuesta')}</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onOpenCarta(carta)}
                              className="px-3 py-1 rounded-lg bg-[#FAF7F2] dark:bg-[#221C17] border border-[#DFD2BF] dark:border-[#3A3027] hover:border-[#8B2635] text-[11px] font-semibold text-[#1E1B18] dark:text-[#FAF8F5] cursor-pointer"
                            >
                              {localize('Abrir', 'Open', 'Abrir')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Full Dashboard View
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div id="talcha-dashboard-estabelecimento-scope" className="mb-8 space-y-6">
      {/* ── Establishment Header & Session Bar ─────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#8B2635]/10 dark:bg-[#8B2635]/20 border border-[#8B2635]/20 text-[#8B2635] dark:text-[#E88E9B] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#E88E9B]">
                <span>{localize('Dashboard do Estabelecimento', 'Establishment Dashboard', 'Panel del Establecimiento')}</span>
                <span aria-hidden="true" className="text-[#C68A36]">·</span>
                <span className="text-[#2E6B34] dark:text-[#7FE08A] inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user.role === 'admin'
                    ? localize('Admin Comercial', 'Commercial Admin', 'Admin Comercial')
                    : localize('Parceiro Verificado', 'Verified Partner', 'Socio Verificado')}
                </span>
                {firebaseUser && (
                  <>
                    <span aria-hidden="true" className="text-[#C68A36]">·</span>
                    <span className="text-[#5C564D] dark:text-[#C2B8AA] font-semibold">
                      {syncError
                        ? localize('Firestore (Fallback Local)', 'Firestore (Local Fallback)', 'Firestore (Caché Local)')
                        : localize('Conectado ao Firestore', 'Connected to Firestore', 'Conectado a Firestore')}
                    </span>
                  </>
                )}
              </div>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#1E1B18] dark:text-[#FAF8F5] mt-1 truncate">
                {establishmentTitle}
              </h2>
              <p className="text-xs text-[#6E6659] dark:text-[#A89E90] mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span>{user.email}</span>
                {userProfile?.city && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#C68A36]" />
                      {userProfile.city}
                    </span>
                  </>
                )}
                {lastSyncAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums text-[#8A8072] dark:text-[#8E8477]">
                      {localize('Sincronizado às', 'Synced at', 'Sincronizado')}{' '}
                      {new Date(lastSyncAt).toLocaleTimeString(
                        language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR',
                        { hour: '2-digit', minute: '2-digit' }
                      )}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadDashboardData()}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] hover:bg-[#F2EAE0] dark:hover:bg-[#2B241E] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{localize('Sincronizar Firestore', 'Sync Firestore', 'Sincronizar')}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCarta()}
              className="px-4 py-2 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{localize('Nova Carta de Chá', 'New Tea Menu', 'Nueva Carta de Té')}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenLeadModal('proposta')}
              className="px-4 py-2 rounded-xl border border-[#C68A36] bg-[#FAF7F2] dark:bg-[#241E18] hover:bg-[#F5EDE0] dark:hover:bg-[#2E261E] text-[#8B2635] dark:text-[#F2C374] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{localize('Solicitar Proposta', 'Request Proposal', 'Solicitar Propuesta')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1E1915] hover:bg-[#FAF7F2] dark:hover:bg-[#26201A] text-xs font-semibold text-[#5C564D] dark:text-[#C7BFB2] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title={localize('Segurança & LGPD', 'Security & Privacy', 'Seguridad y Privacidad')}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E6B34] dark:text-[#7FE08A]" />
              <span className="hidden sm:inline">{localize('LGPD', 'Privacy', 'LGPD')}</span>
            </button>

            <button
              type="button"
              onClick={() => signOutSession('dashboard_logout')}
              className="px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1E1915] hover:bg-[#FDF2F2] dark:hover:bg-[#2E1A1C] text-xs font-semibold text-[#8B2635] dark:text-[#E88E9B] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{localize('Sair', 'Sign Out', 'Salir')}</span>
            </button>
          </div>
        </div>

        {/* Feedback / Sync Error Banners */}
        {actionFeedback && (
          <div
            className={`mt-4 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 ${
              actionFeedback.type === 'success'
                ? 'bg-[#2E6B34]/12 border border-[#2E6B34]/25 text-[#235428] dark:text-[#7FE08A]'
                : 'bg-[#8B2635]/10 border border-[#8B2635]/25 text-[#8B2635] dark:text-[#F099A5]'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {actionFeedback.message}
            </span>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {syncError && (
          <div className="mt-4 px-4 py-2.5 rounded-xl bg-[#C68A36]/12 border border-[#C68A36]/30 text-xs text-[#7D5211] dark:text-[#F2C374] flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {localize(
                  `Sincronização parcial com o Firestore (${syncError}). Exibindo registros locais em cache.`,
                  `Partial Firestore sync (${syncError}). Showing cached local records.`,
                  `Sincronización parcial (${syncError}). Mostrando registros locales.`
                )}
              </span>
            </span>
            <button
              type="button"
              onClick={() => loadDashboardData()}
              className="font-semibold underline shrink-0 cursor-pointer"
            >
              {localize('Tentar novamente', 'Retry', 'Reintentar')}
            </button>
          </div>
        )}

        {firebaseUser && !firebaseUser.emailVerified && (
          <div className="mt-4 px-4 py-2.5 rounded-xl bg-[#8B2635]/10 border border-[#8B2635]/25 text-xs text-[#8B2635] dark:text-[#F099A5] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {localize(
                'Confirme seu e-mail para habilitar a sincronização completa das cartas e propostas comerciais no Firestore.',
                'Verify your email to enable full Firestore sync for menus and commercial proposals.',
                'Verifica tu correo para habilitar la sincronización completa en Firestore.'
              )}
            </span>
          </div>
        )}
      </div>

      {/* ── Visualização Rápida do Status da Proposta Comercial (Pendente / Em Análise / Aprovada) ── */}
      {renderQuickProposalStatusOverview(false)}

      {/* ── Segmented Section View Switcher ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={localize('Seções do estabelecimento', 'Establishment sections', 'Secciones')}
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'bg-[#8B2635] text-white'
                : 'text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-white'
            }`}
          >
            {localize('Visão Geral', 'Overview', 'Vista General')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cartas'}
            onClick={() => setActiveTab('cartas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums whitespace-nowrap shrink-0 ${
              activeTab === 'cartas'
                ? 'bg-[#8B2635] text-white'
                : 'text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-white'
            }`}
          >
            {localize('Cartas de Chá', 'Tea Menus', 'Cartas de Té')} ({cartas.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'propostas'}
            onClick={() => setActiveTab('propostas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums whitespace-nowrap shrink-0 ${
              activeTab === 'propostas'
                ? 'bg-[#8B2635] text-white'
                : 'text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-white'
            }`}
          >
            {localize('Propostas Comerciais', 'Proposals', 'Propuestas')} ({proposals.length})
          </button>
        </div>

        <div className="text-xs text-[#6E6659] dark:text-[#A89E90] tabular-nums">
          {localize(
            `${kpis.cartasCount} cartas (${kpis.totalBlends} blends) · ${kpis.cloudCartasCount} no Firestore`,
            `${kpis.cartasCount} menus (${kpis.totalBlends} blends) · ${kpis.cloudCartasCount} in Firestore`,
            `${kpis.cartasCount} cartas (${kpis.totalBlends} blends) · ${kpis.cloudCartasCount} en Firestore`
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: HISTÓRICO DE CARTAS DE CHÁ CRIADAS (DATA · NOME · STATUS) */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'overview' || activeTab === 'cartas') && (
        <section
          aria-labelledby="heading-historico-cartas"
          className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 sm:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EDE3D5] dark:border-[#2E251D]">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#8B2635] dark:text-[#E88E9B]">
                <Coffee className="w-3.5 h-3.5" />
                <span>{localize('Curadoria B2B Salva no Firestore', 'Saved B2B Curation', 'Curaduría B2B Guardada')}</span>
              </div>
              <h3
                id="heading-historico-cartas"
                className="font-serif-editorial text-xl sm:text-2xl font-bold text-[#1E1B18] dark:text-[#FAF8F5] mt-0.5"
              >
                {localize(
                  'Cartas de Chá Criadas Anteriormente',
                  'Previously Created Tea Menus',
                  'Cartas de Té Creadas Anteriormente'
                )}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 sm:flex-initial min-w-[210px]">
                <Search className="w-3.5 h-3.5 text-[#8A8072] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={cartaSearch}
                  onChange={(e) => setCartaSearch(e.target.value)}
                  placeholder={localize('Buscar carta ou estabelecimento...', 'Search menu or venue...', 'Buscar carta...')}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5] placeholder:text-[#8A8072] focus:outline-none focus:border-[#8B2635]"
                />
              </div>

              {segments.length > 0 && (
                <select
                  value={cartaSegmentFilter}
                  onChange={(e) => setCartaSegmentFilter(e.target.value)}
                  aria-label={localize('Filtrar por segmento', 'Filter by segment', 'Filtrar por segmento')}
                  className="px-3 py-1.5 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs font-medium text-[#1E1B18] dark:text-[#FAF8F5] focus:outline-none focus:border-[#8B2635] cursor-pointer"
                >
                  <option value="all">{localize('Todos os segmentos', 'All segments', 'Todos los segmentos')}</option>
                  {segments.map((seg) => (
                    <option key={seg} value={seg}>
                      {seg}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 pt-5">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="h-24 rounded-xl bg-[#FAF7F2] dark:bg-[#231D18] border border-[#EDE3D5] dark:border-[#322921] animate-pulse p-5"
                />
              ))}
            </div>
          ) : filteredCartas.length === 0 ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] dark:bg-[#231D18] border border-[#E5DACB] dark:border-[#352C23] flex items-center justify-center mx-auto text-[#8B2635] dark:text-[#E88E9B]">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF8F5]">
                  {cartas.length === 0
                    ? localize(
                        'Nenhuma carta de chás salva ainda',
                        'No tea menus saved yet',
                        'Aún no hay cartas de té guardadas'
                      )
                    : localize(
                        'Nenhuma carta corresponde ao filtro',
                        'No menus match your filter',
                        'Ninguna carta coincide con el filtro'
                      )}
                </h4>
                <p className="text-xs text-[#6E6659] dark:text-[#A89E90]">
                  {cartas.length === 0
                    ? localize(
                        'Monte a curadoria de blends do seu restaurante, hotel ou cafeteria e salve-a no histórico oficial do estabelecimento.',
                        'Design a curated blend menu for your venue and save it to your establishment history.',
                        'Diseña una carta de blends para tu establecimiento y guárdala en el historial.'
                      )
                    : localize(
                        'Limpe a busca ou troque o segmento selecionado.',
                        'Clear the search query or switch the selected segment.',
                        'Limpia la búsqueda o cambia el segmento.'
                      )}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {cartas.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => onOpenCarta()}
                    className="px-4 py-2 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{localize('Criar Minha Primeira Carta', 'Build My First Menu', 'Crear Mi Primera Carta')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCartaSearch('');
                      setCartaSegmentFilter('all');
                    }}
                    className="px-4 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] cursor-pointer"
                  >
                    {localize('Limpar filtros', 'Clear filters', 'Limpiar filtros')}
                  </button>
                )}
              </div>

              {cartas.length === 0 && starterTemplates.length > 0 && (
                <div className="pt-4 border-t border-[#EDE3D5] dark:border-[#2E251D] max-w-2xl mx-auto">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] mb-3">
                    {localize('Ou comece a partir de um modelo editorial:', 'Or start from an editorial template:', 'O comienza desde una plantilla:')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    {starterTemplates.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => onOpenCarta(tpl)}
                        className="p-3.5 rounded-xl border border-[#E5DACB] dark:border-[#352C23] bg-[#FAF7F2] dark:bg-[#221C17] hover:border-[#8B2635]/50 transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1E1B18] dark:text-[#FAF8F5] group-hover:text-[#8B2635] dark:group-hover:text-[#E88E9B]">
                            {tpl.name}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B] shrink-0" />
                        </div>
                        <p className="text-[11px] text-[#6E6659] dark:text-[#A89E90] mt-1">
                          {tpl.businessType} · {tpl.itemCount} blends
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-5 space-y-3">
              {/* Desktop Column Labels: Data | Nome da Carta | Status da Proposta | Detalhes & Ações */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] border-b border-[#EDE3D5] dark:border-[#2E251D]">
                <div className="col-span-2">{localize('Data', 'Date', 'Fecha')}</div>
                <div className="col-span-4">{localize('Nome da Carta', 'Menu Name', 'Nombre de Carta')}</div>
                <div className="col-span-3">{localize('Status da Proposta', 'Proposal Status', 'Estado de Propuesta')}</div>
                <div className="col-span-3 text-right">{localize('Detalhes & Ações', 'Details & Actions', 'Detalles')}</div>
              </div>

              {filteredCartas.map((carta) => {
                const { items: resolvedItems } = resolveCartaBlends(carta);
                const blendCount = Math.max(resolvedItems.length, Number(carta.itemCount) || 0);
                const matchedProposal = findMatchingProposalForCarta(carta, proposals);
                const matchedStatusMeta = matchedProposal
                  ? getStatusMeta(matchedProposal.status, localize)
                  : null;
                const isConfirming = confirmDeleteCartaId === carta.id;
                const isExpanded = Boolean(expandedCartaIds[carta.id]);
                const isEditingCarta = editingCartaId === carta.id;

                return (
                  <article
                    key={carta.id}
                    className="rounded-xl border border-[#E5DACB] dark:border-[#352C23] bg-[#FAF7F2]/60 dark:bg-[#211C17] p-4 sm:p-5 space-y-4"
                  >
                    {/* Structured Row: Data | Nome da Carta | Status da Proposta | Detalhes */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start md:items-center">
                      {/* Column 1: Data */}
                      <div className="md:col-span-2 space-y-0.5">
                        <span className="md:hidden text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                          {localize('Data', 'Date', 'Fecha')}
                        </span>
                        <div className="text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] tabular-nums inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#C68A36] shrink-0" />
                          <span>{formatDateShort(carta.createdAt || carta.savedAt || carta.updatedAt, language)}</span>
                        </div>
                        <div className="text-[11px] text-[#70675A] dark:text-[#9E9487]">
                          {carta.source === 'cloud'
                            ? localize('Firestore', 'Firestore', 'Firestore')
                            : localize('Cache Local', 'Local Cache', 'Caché Local')}
                        </div>
                      </div>

                      {/* Column 2: Nome da Carta */}
                      <div className="md:col-span-4 min-w-0 space-y-0.5">
                        <span className="md:hidden text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                          {localize('Nome da Carta', 'Menu Name', 'Nombre de Carta')}
                        </span>
                        <h4 className="font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF8F5] leading-snug truncate">
                          {carta.name}
                        </h4>
                        <p className="text-xs text-[#6E6659] dark:text-[#A89E90] truncate">
                          {carta.establishmentName ? `${carta.establishmentName} · ` : ''}
                          {carta.businessType} · <span className="tabular-nums">{blendCount} blends</span>
                        </p>
                      </div>

                      {/* Column 3: Status da Proposta */}
                      <div className="md:col-span-3 space-y-1">
                        <span className="md:hidden text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                          {localize('Status da Proposta', 'Proposal Status', 'Estado de Propuesta')}
                        </span>
                        {matchedStatusMeta && matchedProposal ? (
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('propostas');
                                setProposalStatusFilter(matchedProposal.status);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap cursor-pointer ${matchedStatusMeta.badgeClass}`}
                            >
                              {matchedStatusMeta.step === 3 ? (
                                <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                              ) : matchedStatusMeta.step === 2 ? (
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <Hourglass className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span>{matchedStatusMeta.label}</span>
                            </button>
                            <div className="text-[11px] text-[#70675A] dark:text-[#9E9487] truncate">
                              {matchedProposal.company}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-[#70675A] dark:text-[#9E9487]">
                              {localize('Sem Proposta', 'No Proposal', 'Sin Propuesta')}
                            </span>
                            <span aria-hidden="true" className="text-[#C68A36]">·</span>
                            <button
                              type="button"
                              onClick={() => onOpenLeadModal('proposta', carta.name)}
                              className="text-xs font-semibold text-[#8B2635] dark:text-[#E88E9B] hover:underline cursor-pointer whitespace-nowrap"
                            >
                              {localize('Solicitar Agora', 'Request Now', 'Solicitar')}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Column 4: Expand / Open Quick Action */}
                      <div className="md:col-span-3 flex flex-wrap md:justify-end items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenCarta(carta)}
                          className="px-3 py-1.5 rounded-lg bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{localize('Abrir Carta', 'Open Menu', 'Abrir Carta')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleCartaDetails(carta.id)}
                          className="px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1A1613] hover:bg-[#F5EFE4] dark:hover:bg-[#29221C] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <span>
                            {isExpanded
                              ? localize('Ocultar', 'Hide', 'Ocultar')
                              : localize('Detalhes', 'Details', 'Detalles')}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ── Expanded Details & Blends Breakdown ── */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-[#E8DEC8] dark:border-[#322921] space-y-4">
                        {isEditingCarta ? (
                          <div className="p-3.5 rounded-xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <label className="block space-y-1">
                                <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                                  {localize('Nome da Carta', 'Menu Name', 'Nombre de Carta')}
                                </span>
                                <input
                                  type="text"
                                  maxLength={140}
                                  value={editCartaName}
                                  onChange={(e) => setEditCartaName(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
                                />
                              </label>
                              <label className="block space-y-1">
                                <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                                  {localize('Estabelecimento', 'Venue Name', 'Establecimiento')}
                                </span>
                                <input
                                  type="text"
                                  maxLength={150}
                                  value={editCartaVenue}
                                  onChange={(e) => setEditCartaVenue(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
                                />
                              </label>
                            </div>
                            <label className="block space-y-1">
                              <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                                {localize('Formato de Serviço à Mesa', 'Tableside Service Format', 'Formato de Servicio')}
                              </span>
                              <input
                                type="text"
                                maxLength={160}
                                value={editCartaService}
                                onChange={(e) => setEditCartaService(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
                              />
                            </label>
                            <label className="block space-y-1">
                              <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                                {localize('Destaques Gastronômicos / Notas', 'Menu Highlights / Notes', 'Notas')}
                              </span>
                              <textarea
                                rows={2}
                                maxLength={500}
                                value={editCartaHighlights}
                                onChange={(e) => setEditCartaHighlights(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
                              />
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveCartaEdit(carta)}
                                disabled={savingCartaId === carta.id}
                                className="px-3 py-1.5 rounded-lg bg-[#8B2635] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                              >
                                {savingCartaId === carta.id
                                  ? localize('Salvando...', 'Saving...', 'Guardando...')
                                  : localize('Salvar no Firestore', 'Save to Firestore', 'Guardar')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCartaId(null)}
                                className="px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] text-xs font-semibold text-[#5C564D] dark:text-[#C7BFB2] cursor-pointer"
                              >
                                {localize('Cancelar', 'Cancel', 'Cancelar')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                                {localize('Público & Perfil', 'Audience Profile', 'Público')}
                              </span>
                              <span className="text-[#1E1B18] dark:text-[#FAF8F5] font-medium">
                                {carta.audienceProfile || localize('Padrão do segmento', 'Segment standard', 'Estándar')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                                {localize('Turno / Operação', 'Operating Hours', 'Horario')}
                              </span>
                              <span className="text-[#1E1B18] dark:text-[#FAF8F5] font-medium">
                                {carta.operatingHours || localize('Serviço contínuo', 'All-day service', 'Servicio continuo')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                                {localize('Atualizada em', 'Updated at', 'Actualizada el')}
                              </span>
                              <span className="text-[#1E1B18] dark:text-[#FAF8F5] font-medium tabular-nums">
                                {formatDateTime(carta.updatedAt || carta.savedAt || carta.createdAt, language)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                                {localize('Documento Firestore', 'Firestore ID', 'ID Firestore')}
                              </span>
                              <span className="font-mono text-[11px] text-[#5C564D] dark:text-[#C7BFB2] truncate block">
                                {carta.id}
                              </span>
                            </div>
                            {carta.serviceFormat && (
                              <div className="sm:col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                                  {localize('Ritual de Serviço à Mesa', 'Tableside Service Format', 'Servicio en Mesa')}
                                </span>
                                <span className="text-[#1E1B18] dark:text-[#FAF8F5] font-medium">
                                  {carta.serviceFormat}
                                </span>
                              </div>
                            )}
                            {carta.menuHighlights && (
                              <div className="sm:col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                                  {localize('Destaques do Cardápio', 'Menu Highlights', 'Notas del Menú')}
                                </span>
                                <span className="text-[#4F4840] dark:text-[#C7BFB2]">{carta.menuHighlights}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {resolvedItems.length > 0 && (
                          <div className="rounded-xl border border-[#E5DACB] dark:border-[#352C23] bg-white dark:bg-[#1A1613] overflow-hidden">
                            <div className="px-3.5 py-2 bg-[#FAF7F2] dark:bg-[#241E19] border-b border-[#E5DACB] dark:border-[#352C23] flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#E88E9B]">
                              <span>
                                {localize('Blends Homologados na Carta', 'Curated Menu Blends', 'Blends Homologados')}
                              </span>
                              <span className="tabular-nums text-[#6E6659] dark:text-[#A89E90]">
                                {resolvedItems.length} {localize('itens', 'items', 'ítems')}
                              </span>
                            </div>
                            <div className="divide-y divide-[#EDE3D5] dark:divide-[#2E251D]">
                              {resolvedItems.map((it, idx) => {
                                const locP = it.blend
                                  ? catalog.localizeProduct(it.blend, language)
                                  : it.blend;
                                return (
                                  <div
                                    key={it.blend?.id || idx}
                                    className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                        <span className="font-semibold text-[#1E1B18] dark:text-[#FAF8F5]">
                                          {String(idx + 1).padStart(2, '0')}. {locP?.name || it.blend?.name || 'Blend'}
                                        </span>
                                        {locP?.category && (
                                          <span className="text-[11px] text-[#70675A] dark:text-[#A89E90]">
                                            · {catalog.localizeCategory(locP.category, language)}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-[#6E6659] dark:text-[#A89E90] mt-0.5">
                                        {it.roleInMenu}
                                        {locP?.foodPairings?.[0] ? ` · ${locP.foodPairings[0]}` : ''}
                                      </p>
                                    </div>

                                    <div className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#2E6B34] dark:text-[#7FE08A] tabular-nums">
                                      <Thermometer className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        {locP?.brewGuide?.tempC || '90°C'} · {locP?.brewGuide?.infusionTime || '3 min'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Expanded Secondary Action Bar */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewCarta(carta)}
                              className="px-3 py-1.5 rounded-lg border border-[#C68A36]/60 bg-white dark:bg-[#1A1613] hover:bg-[#F5EFE4] dark:hover:bg-[#29221C] text-xs font-semibold text-[#8B2635] dark:text-[#F3D78E] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{localize('Prévia PDF', 'Preview PDF', 'Vista Previa')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadCartaPdf(carta)}
                              disabled={downloadingCartaId === carta.id}
                              className="px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1A1613] hover:bg-[#F5EFE4] dark:hover:bg-[#29221C] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                            >
                              <Download className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B]" />
                              <span>
                                {downloadingCartaId === carta.id
                                  ? localize('Gerando...', 'Exporting...', 'Generando...')
                                  : localize('PDF Oficial', 'Official PDF', 'PDF Oficial')}
                              </span>
                            </button>

                            {carta.source === 'local' && firebaseUser?.emailVerified && (
                              <button
                                type="button"
                                onClick={() => handleSyncCartaToCloud(carta)}
                                disabled={syncingCartaId === carta.id}
                                className="px-3 py-1.5 rounded-lg border border-[#2E6B34]/40 bg-[#2E6B34]/10 hover:bg-[#2E6B34]/20 text-xs font-semibold text-[#235428] dark:text-[#7FE08A] inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                              >
                                <CloudUpload className="w-3.5 h-3.5" />
                                <span>
                                  {syncingCartaId === carta.id
                                    ? localize('Enviando...', 'Syncing...', 'Subiendo...')
                                    : localize('Salvar no Firestore', 'Save to Cloud', 'Guardar en Nube')}
                                </span>
                              </button>
                            )}

                            {!isEditingCarta && (
                              <button
                                type="button"
                                onClick={() => startEditCarta(carta)}
                                className="px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1A1613] hover:bg-[#F5EFE4] dark:hover:bg-[#29221C] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <PencilLine className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B]" />
                                <span>{localize('Editar', 'Edit', 'Editar')}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDuplicateCarta(carta)}
                              disabled={syncingCartaId === carta.id}
                              className="px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1A1613] hover:bg-[#F5EFE4] dark:hover:bg-[#29221C] text-xs font-semibold text-[#5C564D] dark:text-[#C7BFB2] inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{localize('Duplicar', 'Duplicate', 'Duplicar')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenLeadModal('proposta', carta.name)}
                              className="px-3 py-1.5 rounded-lg border border-[#C68A36]/50 bg-white dark:bg-[#1A1613] hover:bg-[#FAF4E8] dark:hover:bg-[#29221C] text-xs font-semibold text-[#8F5F14] dark:text-[#F2C374] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{localize('Pedir Proposta', 'Quote', 'Cotizar')}</span>
                            </button>
                          </div>

                          {!isConfirming ? (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCartaId(carta.id)}
                              className="p-1.5 rounded-lg text-[#8A8072] hover:text-[#8B2635] dark:hover:text-[#E88E9B] hover:bg-[#8B2635]/10 transition-colors cursor-pointer"
                              title={localize('Excluir carta', 'Delete menu', 'Eliminar carta')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                              <button
                                type="button"
                                onClick={() => handleDeleteCarta(carta)}
                                className="px-2 py-1 rounded-md bg-[#8B2635] text-white cursor-pointer"
                              >
                                {localize('Confirmar', 'Confirm', 'Confirmar')}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCartaId(null)}
                                className="px-2 py-1 rounded-md border border-[#DFD2BF] dark:border-[#3A3027] text-[#5C564D] dark:text-[#C7BFB2] cursor-pointer"
                              >
                                {localize('Cancelar', 'Cancel', 'Cancelar')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: DETALHES DAS PROPOSTAS COMERCIAIS (PENDENTE / EM ANÁLISE / APROVADA) */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {(activeTab === 'overview' || activeTab === 'propostas') && (
        <section
          aria-labelledby="heading-status-propostas"
          className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 sm:p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EDE3D5] dark:border-[#2E251D]">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#C68A36]">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{localize('Pipeline B2B · Firestore', 'B2B Pipeline · Firestore', 'Seguimiento B2B')}</span>
              </div>
              <h3
                id="heading-status-propostas"
                className="font-serif-editorial text-xl sm:text-2xl font-bold text-[#1E1B18] dark:text-[#FAF8F5] mt-0.5"
              >
                {localize(
                  'Acompanhamento das Propostas Comerciais',
                  'Commercial Proposal Tracking',
                  'Seguimiento de Propuestas Comerciales'
                )}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#8A8072] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={proposalSearch}
                  onChange={(e) => setProposalSearch(e.target.value)}
                  placeholder={localize('Buscar empresa, carta ou nota...', 'Search company, menu or note...', 'Buscar propuesta...')}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5] placeholder:text-[#8A8072] focus:outline-none focus:border-[#8B2635]"
                />
              </div>

              <select
                value={proposalTypeFilter}
                onChange={(e) => setProposalTypeFilter(e.target.value as any)}
                aria-label={localize('Filtrar por tipo', 'Filter by type', 'Filtrar por tipo')}
                className="px-3 py-1.5 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs font-medium text-[#1E1B18] dark:text-[#FAF8F5] focus:outline-none focus:border-[#8B2635] cursor-pointer"
              >
                <option value="all">{localize('Todos os interesses', 'All request types', 'Todos los tipos')}</option>
                <option value="proposta">{localize('Proposta B2B', 'Commercial Proposal', 'Propuesta B2B')}</option>
                <option value="experimentar">{localize('Amostras & Degustação', 'Tasting & Samples', 'Muestras')}</option>
                <option value="carta">{localize('Curadoria de Carta', 'Menu Curation', 'Carta de Té')}</option>
                <option value="especialista">{localize('Especialista Sommelier', 'Sommelier Consulting', 'Especialista')}</option>
                <option value="evento">{localize('Eventos', 'Events', 'Eventos')}</option>
              </select>
            </div>
          </div>

          {/* Interactive Filter Controls (Todas | Pendente | Em Análise | Aprovada) */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#FAF7F2] dark:bg-[#221C17] border border-[#E5DACB] dark:border-[#352C23]">
              {(
                [
                  { id: 'all', label: localize('Todas', 'All', 'Todas'), count: proposals.length },
                  { id: 'novo', label: localize('Pendente', 'Pending', 'Pendiente'), count: kpis.pendingCount },
                  { id: 'em_atendimento', label: localize('Em Análise', 'Under Review', 'En Análisis'), count: kpis.inReviewCount },
                  { id: 'concluido', label: localize('Aprovada', 'Approved', 'Aprobada'), count: kpis.approvedCount },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProposalStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums whitespace-nowrap shrink-0 ${
                    proposalStatusFilter === tab.id
                      ? 'bg-[#8B2635] text-white'
                      : 'text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-white'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onOpenLeadModal('proposta')}
              className="px-3 py-1.5 rounded-xl border border-[#C68A36] text-xs font-semibold text-[#8B2635] dark:text-[#F2C374] hover:bg-[#FAF7F2] dark:hover:bg-[#231D18] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{localize('Nova Proposta B2B', 'New B2B Proposal', 'Nueva Propuesta')}</span>
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 pt-5">
              {[1, 2].map((idx) => (
                <div
                  key={idx}
                  className="h-32 rounded-xl bg-[#FAF7F2] dark:bg-[#231D18] border border-[#EDE3D5] dark:border-[#322921] animate-pulse p-5"
                />
              ))}
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] dark:bg-[#231D18] border border-[#E5DACB] dark:border-[#352C23] flex items-center justify-center mx-auto text-[#C68A36]">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF8F5]">
                  {proposals.length === 0
                    ? localize(
                        'Nenhuma proposta comercial enviada',
                        'No commercial proposals submitted yet',
                        'Aún no hay propuestas comerciales enviadas'
                      )
                    : localize(
                        'Nenhuma proposta corresponde aos filtros',
                        'No proposals match your filters',
                        'Ninguna propuesta coincide con los filtros'
                      )}
                </h4>
                <p className="text-xs text-[#6E6659] dark:text-[#A89E90]">
                  {proposals.length === 0
                    ? localize(
                        'Solicite uma cotação atacado, kit de degustação ou implantação de carta para acompanhar o status (Pendente, Em Análise e Aprovada).',
                        'Request a wholesale quote, tasting kit or menu rollout to track proposal status.',
                        'Solicita una cotización mayorista o kit de degustación para seguir tu propuesta.'
                      )
                    : localize(
                        'Ajuste os filtros de busca ou status para visualizar outras solicitações.',
                        'Adjust the search or status filters to view other requests.',
                        'Ajusta los filtros para ver otras solicitudes.'
                      )}
                </p>
              </div>
              {proposals.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onOpenLeadModal('proposta')}
                  className="px-4 py-2 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{localize('Solicitar Primeira Proposta', 'Request First Proposal', 'Solicitar Primera Propuesta')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setProposalSearch('');
                    setProposalStatusFilter('all');
                    setProposalTypeFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] cursor-pointer"
                >
                  {localize('Limpar filtros', 'Clear filters', 'Limpiar filtros')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 pt-5">
              {filteredProposals.map((lead) => {
                const statusInfo = getStatusMeta(lead.status, localize);
                const isEditing = editingProposalId === lead.id;
                const isConfirmingDelete = confirmDeleteProposalId === lead.id;
                const canEdit = lead.status !== 'concluido';

                const waMessage = encodeURIComponent(
                  localize(
                    `Olá equipe Talchá! Gostaria de acompanhar minha proposta comercial "${lead.company}" (Ref: ${lead.id} · Status atual: ${statusInfo.label}).`,
                    `Hello Talchá team! I would like an update on my commercial proposal for "${lead.company}" (Ref: ${lead.id} · Status: ${statusInfo.label}).`,
                    `¡Hola equipo Talchá! Quisiera consultar el estado de mi propuesta para "${lead.company}" (Ref: ${lead.id}).`
                  )
                );

                return (
                  <article
                    key={lead.id}
                    className="rounded-xl border border-[#E5DACB] dark:border-[#352C23] bg-[#FAF7F2]/60 dark:bg-[#211C17] p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#6E6659] dark:text-[#A89E90]">
                          <span className="font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#E88E9B]">
                            {getInterestLabel(lead.interestType, localize)}
                          </span>
                          <span aria-hidden="true" className="text-[#C68A36]">·</span>
                          <span className="tabular-nums">
                            {formatDateShort(lead.createdAt, language)}
                          </span>
                          {lead.city && (
                            <>
                              <span aria-hidden="true" className="text-[#C68A36]">·</span>
                              <span>{lead.city}</span>
                            </>
                          )}
                          <span aria-hidden="true" className="text-[#C68A36]">·</span>
                          <span className="font-mono text-[10px]">{lead.id}</span>
                        </div>

                        <h4 className="font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF8F5]">
                          {lead.company}
                        </h4>

                        <p className="text-xs text-[#4F4840] dark:text-[#C7BFB2]">
                          <span className="font-semibold">{lead.name}</span>
                          {lead.role ? ` (${lead.role})` : ''} · {lead.email}
                          {lead.whatsapp ? ` · ${lead.whatsapp}` : ''}
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.step === 3 ? (
                            <BadgeCheck className="w-3.5 h-3.5" />
                          ) : statusInfo.step === 2 ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : (
                            <Hourglass className="w-3.5 h-3.5" />
                          )}
                          <span>{statusInfo.label}</span>
                        </span>

                        {user.role === 'admin' && (
                          <select
                            value={lead.status}
                            disabled={updatingStatusId === lead.id}
                            onChange={(e) => handleAdminStatusChange(lead, e.target.value as LeadStatus)}
                            aria-label={localize('Alterar status da proposta', 'Change proposal status', 'Cambiar estado')}
                            className="px-2 py-1 rounded-md border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1A1613] text-[11px] font-semibold text-[#1E1B18] dark:text-[#FAF8F5] cursor-pointer"
                          >
                            <option value="novo">{localize('Pendente', 'Pending', 'Pendiente')}</option>
                            <option value="em_atendimento">{localize('Em Análise', 'Under Review', 'En Análisis')}</option>
                            <option value="concluido">{localize('Aprovada', 'Approved', 'Aprobada')}</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* 3-Step Pipeline Tracker (Pendente -> Em Análise -> Aprovada) */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        {
                          step: 1,
                          title: localize('1. Pendente', '1. Pending', '1. Pendiente'),
                        },
                        {
                          step: 2,
                          title: localize('2. Em Análise', '2. Under Review', '2. En Análisis'),
                        },
                        {
                          step: 3,
                          title: localize('3. Aprovada', '3. Approved', '3. Aprobada'),
                        },
                      ].map((stage) => {
                        const reached = statusInfo.step >= stage.step;
                        return (
                          <div key={stage.step} className="space-y-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-colors ${
                                reached
                                  ? stage.step === 3 && statusInfo.step === 3
                                    ? 'bg-[#2E6B34] dark:bg-[#6FD47B]'
                                    : 'bg-[#8B2635] dark:bg-[#E88E9B]'
                                  : 'bg-[#E5DACB] dark:bg-[#352C23]'
                              }`}
                            />
                            <div
                              className={`text-[11px] font-semibold flex items-center gap-1 ${
                                reached
                                  ? 'text-[#1E1B18] dark:text-[#FAF8F5]'
                                  : 'text-[#8A8072] dark:text-[#786F63]'
                              }`}
                            >
                              {reached && <Check className="w-3 h-3 shrink-0" />}
                              <span className="truncate">{stage.title}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E8DEC8] dark:border-[#322921] text-xs">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                            {localize('Carta / Blend de Interesse', 'Tea / Menu Interest', 'Carta / Blend')}
                          </span>
                          <span className="text-[#1E1B18] dark:text-[#FAF8F5] font-medium">
                            {lead.recommendedTeaName || localize('Portfólio B2B Completo', 'Full B2B Portfolio', 'Portafolio B2B')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                            {localize('Volume Estimado', 'Estimated Volume', 'Volumen Estimado')}
                          </span>
                          <span className="text-[#1E1B18] dark:text-[#FAF8F5] font-medium">
                            {lead.estimatedQuantity || localize('Sob demanda', 'On demand', 'Bajo demanda')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                            {localize('Última Atualização', 'Last Updated', 'Última Actualización')}
                          </span>
                          <span className="text-[#1E1B18] dark:text-[#FAF8F5] font-medium tabular-nums">
                            {formatDateTime(lead.updatedAt || lead.createdAt, language)}
                          </span>
                        </div>
                        {lead.notes && (
                          <div className="sm:col-span-3">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                              {localize('Observações Enviadas', 'Submitted Notes', 'Observaciones')}
                            </span>
                            <p className="text-[#4F4840] dark:text-[#C7BFB2] mt-0.5 leading-relaxed">
                              {lead.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-[#E8DEC8] dark:border-[#322921] space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="block space-y-1">
                            <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                              {localize('Volume Estimado Mensal', 'Estimated Monthly Volume', 'Volumen Mensual')}
                            </span>
                            <input
                              type="text"
                              maxLength={120}
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1A1613] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
                            />
                          </label>
                        </div>
                        <label className="block space-y-1">
                          <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                            {localize('Observações da Proposta', 'Proposal Notes', 'Observaciones')}
                          </span>
                          <textarea
                            rows={2}
                            maxLength={1000}
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1A1613] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
                          />
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveProposalEdit(lead)}
                            disabled={savingProposal}
                            className="px-3 py-1.5 rounded-lg bg-[#8B2635] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                          >
                            {savingProposal
                              ? localize('Salvando...', 'Saving...', 'Guardando...')
                              : localize('Salvar Alterações', 'Save Changes', 'Guardar')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProposalId(null)}
                            className="px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] text-xs font-semibold text-[#5C564D] dark:text-[#C7BFB2] cursor-pointer"
                          >
                            {localize('Cancelar', 'Cancel', 'Cancelar')}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#E8DEC8] dark:border-[#322921] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] text-[#6E6659] dark:text-[#A89E90]">
                        {statusInfo.desc}
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`https://wa.me/${storage.commercialContact.cleanPhone}?text=${waMessage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-[#2E6B34]/12 hover:bg-[#2E6B34]/20 text-[#235428] dark:text-[#7FE08A] font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{localize('Acompanhar no WhatsApp', 'Follow up on WhatsApp', 'Seguir por WhatsApp')}</span>
                        </a>

                        {canEdit && !isEditing && (
                          <button
                            type="button"
                            onClick={() => startEditProposal(lead)}
                            className="px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1A1613] hover:bg-[#F5EFE4] dark:hover:bg-[#29221C] text-[#1E1B18] dark:text-[#FAF8F5] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <PencilLine className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B]" />
                            <span>{localize('Editar', 'Edit', 'Editar')}</span>
                          </button>
                        )}

                        {!isConfirmingDelete ? (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProposalId(lead.id)}
                            className="p-1.5 rounded-lg text-[#8A8072] hover:text-[#8B2635] dark:hover:text-[#E88E9B] hover:bg-[#8B2635]/10 transition-colors cursor-pointer"
                            title={localize('Excluir solicitação', 'Delete request', 'Eliminar solicitud')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                            <button
                              type="button"
                              onClick={() => handleDeleteProposal(lead)}
                              className="px-2 py-1 rounded-md bg-[#8B2635] text-white cursor-pointer"
                            >
                              {localize('Confirmar', 'Confirm', 'Confirmar')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProposalId(null)}
                              className="px-2 py-1 rounded-md border border-[#DFD2BF] dark:border-[#3A3027] text-[#5C564D] dark:text-[#C7BFB2] cursor-pointer"
                            >
                              {localize('Cancelar', 'Cancel', 'Cancelar')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {previewCarta && (() => {
        const { tpl, items } = resolveCartaBlends(previewCarta);
        let clientLogoDataUrl: string | null = null;
        try {
          clientLogoDataUrl = localStorage.getItem('talcha_carta_client_logo') || null;
        } catch {}
        return (
          <CartaPdfPreviewModal
            isOpen={true}
            onClose={() => setPreviewCarta(null)}
            establishmentName={previewCarta.establishmentName || userProfile?.company || previewCarta.name}
            businessType={previewCarta.businessType || 'Restaurante'}
            audienceProfile={previewCarta.audienceProfile || ''}
            operatingHours={previewCarta.operatingHours || ''}
            menuHighlights={previewCarta.menuHighlights || ''}
            serviceFormat={previewCarta.serviceFormat || ''}
            cartaTitle={previewCarta.cartaTitle || tpl?.title || previewCarta.name}
            cartaSubtitle={tpl?.subtitle || ''}
            strategicRationale={tpl?.strategicRationale || ''}
            language={language}
            items={items}
            isDownloading={downloadingCartaId === previewCarta.id}
            onDownloadPdf={async (opts) => {
              if (downloadingCartaId) return;
              setDownloadingCartaId(previewCarta.id);
              try {
                await pdf.downloadCartaPdf({
                  establishmentName:
                    previewCarta.establishmentName || userProfile?.company || previewCarta.name,
                  businessType: previewCarta.businessType || 'Restaurante',
                  audienceProfile: previewCarta.audienceProfile || '',
                  operatingHours: previewCarta.operatingHours || '',
                  menuHighlights: previewCarta.menuHighlights || '',
                  serviceFormat: previewCarta.serviceFormat || '',
                  cartaTitle: previewCarta.cartaTitle || tpl?.title || previewCarta.name,
                  cartaSubtitle: tpl?.subtitle || '',
                  strategicRationale: tpl?.strategicRationale || '',
                  items,
                  language: opts.language,
                  theme: opts.theme,
                  mode: opts.mode,
                  clientLogoDataUrl,
                });
              } finally {
                setDownloadingCartaId(null);
              }
            }}
          />
        );
      })()}
    </div>
  );
}

export function DashboardEstabelecimento(props: DashboardEstabelecimentoProps) {
  const [resetKey, setResetKey] = useState(0);
  return (
    <DashboardErrorBoundary onReset={() => setResetKey((k) => k + 1)}>
      <DashboardEstabelecimentoInner key={resetKey} {...props} />
    </DashboardErrorBoundary>
  );
}

export default DashboardEstabelecimento;
