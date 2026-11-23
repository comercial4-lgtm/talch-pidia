/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, useCallback, useEffect, useMemo, useState } from 'react';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Coffee,
  Download,
  ExternalLink,
  Hourglass,
  Layers,
  LogIn,
  LogOut,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import firebaseConfig from '../../firebase-applet-config.json';

// ─────────────────────────────────────────────────────────────────────────────
// Blueprint Validation Constants (synced verbatim with firebase-blueprint.json)
// ─────────────────────────────────────────────────────────────────────────────
export const CARTA_CHA_CONSTRAINTS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  MAX_ID_LEN: 128,
  MAX_NOME_LEN: 140,
  MAX_ESTABELECIMENTO_LEN: 150,
  MAX_SEGMENTO_LEN: 80,
  MAX_FORMATO_LEN: 160,
  MAX_OBS_LEN: 500,
  MAX_BLENDS: 20,
  MAX_BLEND_NAME_LEN: 80,
} as const;

export type PropostaStatus = 'pendente' | 'em_analise' | 'aprovada';

export interface CartaChaDoc {
  id: string;
  uid: string;
  ownerId: string;
  nome: string;
  estabelecimento?: string;
  segmento: string;
  formatoServico?: string;
  itensCount: number;
  blends?: string[];
  statusProposta: PropostaStatus;
  observacoes?: string;
  createdAt?: Timestamp | string | Date | null;
  updatedAt?: Timestamp | string | Date | null;
}

export interface HydratedCartaChaPayload extends CartaChaDoc {
  name?: string;
  establishmentName?: string;
  businessType?: string;
  audienceProfile?: string;
  operatingHours?: string;
  menuHighlights?: string;
  serviceFormat?: string;
  cartaTitle?: string;
  itemCount?: number;
  customBlendIds?: string[];
  _editInCurator?: boolean;
  _loadedFromFirestore?: boolean;
}

export interface DashboardEstabelecimentoProps {
  onOpenCarta?: (carta?: HydratedCartaChaPayload) => void;
  onOpenLeadModal?: (interestType?: string, recommendedTeaName?: string) => void;
  variant?: 'full' | 'embedded';
  hideHeader?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Firebase SDK Initialization (singleton-safe + explicit firestoreDatabaseId)
// ─────────────────────────────────────────────────────────────────────────────
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function initFirestoreClient() {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = initFirestoreClient();
export const auth = getAuth(app);

let connectionTested = false;
async function testConnection(): Promise<void> {
  if (connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Structured Firestore Error Handler (firebase-integration-rpc contract)
// ─────────────────────────────────────────────────────────────────────────────
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Boundary
// ─────────────────────────────────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class CartasChaErrorBoundary extends Component<
  { children: React.ReactNode; onReset?: () => void },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onReset?: () => void }) {
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
            Falha ao carregar Cartas de Chá (cartas_cha)
          </h3>
          <p className="text-xs text-[#6E6659] dark:text-[#A89E90] max-w-md mx-auto break-words">
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
            <span>Tentar novamente</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sanitizers & Formatters
// ─────────────────────────────────────────────────────────────────────────────
function sanitizeId(raw: string, fallback = 'carta_item'): string {
  const cleaned = String(raw || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, CARTA_CHA_CONSTRAINTS.MAX_ID_LEN);
  return cleaned && CARTA_CHA_CONSTRAINTS.ID_PATTERN.test(cleaned) ? cleaned : fallback;
}

function sanitizeText(raw: string | undefined, maxLen: number, fallback = ''): string {
  const cleaned = String(raw || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
  return cleaned || fallback;
}

function toJsDate(val: Timestamp | string | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val;
  if (typeof val === 'string') {
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'object' && typeof (val as Timestamp).toDate === 'function') {
    const d = (val as Timestamp).toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'object' && 'seconds' in (val as any)) {
    const d = new Date(Number((val as any).seconds) * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatDatePt(val: Timestamp | string | Date | null | undefined): string {
  const d = toJsDate(val);
  if (!d) return '—';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTimeCsv(val: Timestamp | string | Date | null | undefined): string {
  const d = toJsDate(val);
  if (!d) return '';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeCsvCell(value: unknown): string {
  let str = String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
  if (/^[=+\-@\t]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

function getStatusMeta(status: PropostaStatus | string) {
  switch (status) {
    case 'aprovada':
      return {
        label: 'Aprovada',
        badgeClass:
          'bg-[#2E6B34]/12 text-[#235428] dark:bg-[#2E6B34]/25 dark:text-[#7FE08A] border border-[#2E6B34]/25',
        icon: BadgeCheck,
      };
    case 'em_analise':
      return {
        label: 'Em Análise',
        badgeClass:
          'bg-[#C68A36]/14 text-[#8F5F14] dark:bg-[#C68A36]/20 dark:text-[#F2C374] border border-[#C68A36]/30',
        icon: Clock,
      };
    case 'pendente':
    default:
      return {
        label: 'Pendente',
        badgeClass:
          'bg-[#8B2635]/10 text-[#8B2635] dark:bg-[#8B2635]/25 dark:text-[#F099A5] border border-[#8B2635]/25',
        icon: Hourglass,
      };
  }
}

const DEFAULT_SEGMENTS = [
  'Restaurante',
  'Hotel & Resort',
  'Cafeteria & Confeitaria',
  'Spa & Wellness',
  'Eventos & Corporativo',
];

const TALCHA_CUP_PRICE_BRL = 16;
const TALCHA_CUP_COST_BRL = 1.45;
export const TALCHA_GROSS_MARGIN_RATE =
  (TALCHA_CUP_PRICE_BRL - TALCHA_CUP_COST_BRL) / TALCHA_CUP_PRICE_BRL;

export function estimateCartaMonthlyRevenue(
  segmento: string | undefined,
  itensCount: number | undefined
): number {
  const seg = String(segmento || '').toLowerCase();
  let baseDailyCups = 18;
  if (seg.includes('hotel') || seg.includes('resort')) {
    baseDailyCups = 24;
  } else if (seg.includes('cafeteria') || seg.includes('confeitaria')) {
    baseDailyCups = 20;
  } else if (seg.includes('evento') || seg.includes('corporativo')) {
    baseDailyCups = 22;
  } else if (seg.includes('spa') || seg.includes('wellness')) {
    baseDailyCups = 14;
  } else if (seg.includes('empório') || seg.includes('emporio')) {
    baseDailyCups = 16;
  }
  const blendCount = Math.max(1, Number(itensCount) || 1);
  const dailyCups = baseDailyCups + blendCount * 2;
  return Math.round(dailyCups * TALCHA_CUP_PRICE_BRL * 30);
}

export interface MonthlyRevenueTrendPoint {
  monthKey: string;
  monthLabel: string;
  receitaPotencialMensal: number;
  receitaNovasCartas: number;
  lucroBrutoEstimado: number;
  cartasNoMes: number;
  cartasAcumuladas: number;
  blendsAcumulados: number;
}

export function buildMonthlyRevenueTrend(
  cartas: Array<{
    segmento?: string;
    businessType?: string;
    itensCount?: number;
    itemCount?: number;
    createdAt?: Timestamp | string | Date | null;
    updatedAt?: Timestamp | string | Date | null;
    savedAt?: Timestamp | string | Date | null;
  }>,
  locale = 'pt-BR'
): MonthlyRevenueTrendPoint[] {
  if (!cartas || cartas.length === 0) return [];

  const monthBuckets = new Map<string, { revenue: number; count: number; blends: number }>();
  let minMonthIndex = Number.POSITIVE_INFINITY;
  let maxMonthIndex = Number.NEGATIVE_INFINITY;

  const now = new Date();
  const currentMonthIndex = now.getFullYear() * 12 + now.getMonth();

  for (const item of cartas) {
    const dt =
      toJsDate(item.createdAt || item.savedAt || item.updatedAt) || now;
    const monthIndex = dt.getFullYear() * 12 + dt.getMonth();
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const rev = estimateCartaMonthlyRevenue(
      item.segmento || item.businessType,
      item.itensCount ?? item.itemCount
    );
    const blends = Math.max(1, Number(item.itensCount ?? item.itemCount) || 1);

    const existing = monthBuckets.get(key) || { revenue: 0, count: 0, blends: 0 };
    monthBuckets.set(key, {
      revenue: existing.revenue + rev,
      count: existing.count + 1,
      blends: existing.blends + blends,
    });

    if (monthIndex < minMonthIndex) minMonthIndex = monthIndex;
    if (monthIndex > maxMonthIndex) maxMonthIndex = monthIndex;
  }

  const endMonthIndex = Math.max(maxMonthIndex, currentMonthIndex);
  const startMonthIndex = Math.min(minMonthIndex, endMonthIndex - 5);

  const points: MonthlyRevenueTrendPoint[] = [];
  let cumulativeRevenue = 0;
  let cumulativeCartas = 0;
  let cumulativeBlends = 0;

  for (let idx = startMonthIndex; idx <= endMonthIndex; idx += 1) {
    const year = Math.floor(idx / 12);
    const monthZeroBased = idx % 12;
    const key = `${year}-${String(monthZeroBased + 1).padStart(2, '0')}`;
    const bucket = monthBuckets.get(key) || { revenue: 0, count: 0, blends: 0 };

    cumulativeRevenue += bucket.revenue;
    cumulativeCartas += bucket.count;
    cumulativeBlends += bucket.blends;

    const labelDate = new Date(year, monthZeroBased, 1);
    const monthLabel = labelDate
      .toLocaleDateString(locale, { month: 'short', year: '2-digit' })
      .replace('.', '');

    points.push({
      monthKey: key,
      monthLabel,
      receitaPotencialMensal: cumulativeRevenue,
      receitaNovasCartas: bucket.revenue,
      lucroBrutoEstimado: Math.round(cumulativeRevenue * TALCHA_GROSS_MARGIN_RATE),
      cartasNoMes: bucket.count,
      cartasAcumuladas: cumulativeCartas,
      blendsAcumulados: cumulativeBlends,
    });
  }

  return points;
}

function formatBrl(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatBrlCompact(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return `R$ ${Number.isInteger(k) ? k : k.toFixed(1).replace('.', ',')}k`;
  }
  return `R$ ${Math.round(value)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component: DashboardEstabelecimento
// ─────────────────────────────────────────────────────────────────────────────
function DashboardEstabelecimentoCore({
  onOpenCarta,
  onOpenLeadModal,
  variant = 'full',
  hideHeader = false,
}: DashboardEstabelecimentoProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authBusy, setAuthBusy] = useState<boolean>(false);

  const [cartas, setCartas] = useState<CartaChaDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | PropostaStatus>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');

  // Create Form State
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newNome, setNewNome] = useState<string>('');
  const [newEstabelecimento, setNewEstabelecimento] = useState<string>('');
  const [newSegmento, setNewSegmento] = useState<string>('Restaurante');
  const [newFormato, setNewFormato] = useState<string>('Infusor Vapt Vupt · Serviço à Mesa');
  const [newBlendsText, setNewBlendsText] = useState<string>(
    'Earl Grey Especial, Cherry Rose, Doce Amêndoa, Gengibre Fresh'
  );
  const [newObservacoes, setNewObservacoes] = useState<string>('');
  const [submittingNew, setSubmittingNew] = useState<boolean>(false);

  // Row Interactions
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState<string>('');
  const [editEstabelecimento, setEditEstabelecimento] = useState<string>('');
  const [editObservacoes, setEditObservacoes] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [loadingCuratorId, setLoadingCuratorId] = useState<string | null>(null);

  const notify = useCallback((type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  }, []);

  // Boot: Validate Firestore connection + Subscribe to Firebase Authentication
  useEffect(() => {
    testConnection();
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isAdminUser = Boolean(
    currentUser?.emailVerified && currentUser?.email === 'comercial4@talcha.com.br'
  );

  // Parse Firestore snapshot documents cleanly
  const mapSnapshotDocs = useCallback((docs: any[]): CartaChaDoc[] => {
    const items: CartaChaDoc[] = docs.map((d) => {
      const data = typeof d.data === 'function' ? d.data() : d;
      const statusRaw = String(data?.statusProposta || 'pendente');
      const statusProposta: PropostaStatus =
        statusRaw === 'aprovada' || statusRaw === 'em_analise' || statusRaw === 'pendente'
          ? statusRaw
          : 'pendente';

      return {
        id: String(data?.id || d.id),
        uid: String(data?.uid || ''),
        ownerId: String(data?.ownerId || ''),
        nome: String(data?.nome || 'Carta de Chás'),
        estabelecimento: data?.estabelecimento ? String(data.estabelecimento) : '',
        segmento: String(data?.segmento || 'Restaurante'),
        formatoServico: data?.formatoServico ? String(data.formatoServico) : '',
        itensCount: Math.max(1, Number(data?.itensCount) || 1),
        blends: Array.isArray(data?.blends) ? data.blends.map(String) : [],
        statusProposta,
        observacoes: data?.observacoes ? String(data.observacoes) : '',
        createdAt: data?.createdAt || null,
        updatedAt: data?.updatedAt || data?.createdAt || null,
      };
    });

    items.sort((a, b) => {
      const ta = toJsDate(a.updatedAt || a.createdAt)?.getTime() || 0;
      const tb = toJsDate(b.updatedAt || b.createdAt)?.getTime() || 0;
      return tb - ta;
    });
    return items;
  }, []);

  // Real-time Firestore listener on `cartas_cha` scoped strictly to logged user
  useEffect(() => {
    if (!authReady) return;
    if (!currentUser) {
      setCartas([]);
      setLoading(false);
      setErrorBanner(null);
      return;
    }

    setLoading(true);
    setErrorBanner(null);

    const cartasRef = collection(db, 'cartas_cha');
    const q = query(
      cartasRef,
      where('ownerId', '==', currentUser.uid),
      where('uid', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCartas(mapSnapshotDocs(snapshot.docs));
        setLoading(false);
        setErrorBanner(null);
      },
      (error) => {
        setLoading(false);
        setErrorBanner(
          error?.message || 'Não foi possível consultar a coleção cartas_cha no Firestore.'
        );
        try {
          handleFirestoreError(error, OperationType.LIST, 'cartas_cha');
        } catch {
          // Structured error logged cleanly to console while keeping UI responsive
        }
      }
    );

    return () => unsubscribe();
  }, [authReady, currentUser, mapSnapshotDocs]);

  // Manual explicit fetch via getDocs
  const handleRefresh = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setErrorBanner(null);
    try {
      const cartasRef = collection(db, 'cartas_cha');
      const q = query(
        cartasRef,
        where('ownerId', '==', currentUser.uid),
        where('uid', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      setCartas(mapSnapshotDocs(snap.docs));
    } catch (error: any) {
      setErrorBanner(error?.message || 'Falha ao atualizar documentos de cartas_cha.');
      try {
        handleFirestoreError(error, OperationType.GET, 'cartas_cha');
      } catch {
        // Logged
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, mapSnapshotDocs]);

  // Auth Sign-In & Sign-Out
  const handleSignInGoogle = async () => {
    setAuthBusy(true);
    setErrorBanner(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      notify('error', error?.message || 'Não foi possível concluir o login com Google.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    try {
      await signOut(auth);
    } catch (error: any) {
      notify('error', error?.message || 'Erro ao encerrar sessão.');
    } finally {
      setAuthBusy(false);
    }
  };

  // Create new CartaCha document in `cartas_cha`
  const handleCreateCartaCha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!currentUser.emailVerified) {
      notify('error', 'Confirme seu e-mail para registrar cartas no Firestore.');
      return;
    }

    const cleanNome = sanitizeText(newNome, CARTA_CHA_CONSTRAINTS.MAX_NOME_LEN);
    if (!cleanNome) {
      notify('error', 'Informe o nome da carta de chás.');
      return;
    }

    setSubmittingNew(true);
    const cartaId = sanitizeId(`carta_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
    const path = `cartas_cha/${cartaId}`;
    const blendList = newBlendsText
      .split(/[,;\n]+/)
      .map((s) => sanitizeText(s, CARTA_CHA_CONSTRAINTS.MAX_BLEND_NAME_LEN))
      .filter(Boolean)
      .slice(0, CARTA_CHA_CONSTRAINTS.MAX_BLENDS);

    try {
      await setDoc(doc(db, 'cartas_cha', cartaId), {
        id: cartaId,
        uid: currentUser.uid,
        ownerId: currentUser.uid,
        nome: cleanNome,
        estabelecimento: sanitizeText(
          newEstabelecimento || currentUser.displayName || 'Estabelecimento Parceiro',
          CARTA_CHA_CONSTRAINTS.MAX_ESTABELECIMENTO_LEN
        ),
        segmento: sanitizeText(newSegmento, CARTA_CHA_CONSTRAINTS.MAX_SEGMENTO_LEN, 'Restaurante'),
        formatoServico: sanitizeText(
          newFormato,
          CARTA_CHA_CONSTRAINTS.MAX_FORMATO_LEN,
          'Serviço de Salão'
        ),
        itensCount: Math.max(1, Math.min(20, blendList.length || 4)),
        blends: blendList,
        statusProposta: 'pendente',
        observacoes: sanitizeText(newObservacoes, CARTA_CHA_CONSTRAINTS.MAX_OBS_LEN),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNewNome('');
      setNewObservacoes('');
      setShowCreateForm(false);
      notify('success', `Carta "${cleanNome}" salva na coleção cartas_cha.`);
    } catch (error: any) {
      notify('error', error?.message || 'Sem permissão para criar documento em cartas_cha.');
      try {
        handleFirestoreError(error, OperationType.CREATE, path);
      } catch {
        // Logged
      }
    } finally {
      setSubmittingNew(false);
    }
  };

  // Update editable fields of a non-approved CartaCha
  const handleSaveEdit = async (carta: CartaChaDoc) => {
    if (!currentUser || savingEdit) return;
    const cleanNome = sanitizeText(editNome, CARTA_CHA_CONSTRAINTS.MAX_NOME_LEN, carta.nome);
    if (!cleanNome) return;

    setSavingEdit(true);
    const path = `cartas_cha/${carta.id}`;
    try {
      await updateDoc(doc(db, 'cartas_cha', carta.id), {
        nome: cleanNome,
        estabelecimento: sanitizeText(
          editEstabelecimento,
          CARTA_CHA_CONSTRAINTS.MAX_ESTABELECIMENTO_LEN
        ),
        observacoes: sanitizeText(editObservacoes, CARTA_CHA_CONSTRAINTS.MAX_OBS_LEN),
        updatedAt: serverTimestamp(),
      });
      setEditingId(null);
      notify('success', 'Carta atualizada com sucesso no Firestore.');
    } catch (error: any) {
      notify('error', error?.message || 'Não foi possível atualizar a carta.');
      try {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } catch {
        // Logged
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Admin-only status update
  const handleAdminStatusChange = async (carta: CartaChaDoc, nextStatus: PropostaStatus) => {
    if (!isAdminUser || updatingStatusId) return;
    setUpdatingStatusId(carta.id);
    const path = `cartas_cha/${carta.id}`;
    try {
      await updateDoc(doc(db, 'cartas_cha', carta.id), {
        statusProposta: nextStatus,
        updatedAt: serverTimestamp(),
      });
      notify('success', `Status da proposta atualizado para ${getStatusMeta(nextStatus).label}.`);
    } catch (error: any) {
      notify('error', error?.message || 'Falha ao atualizar status da proposta.');
      try {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } catch {
        // Logged
      }
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Delete document from `cartas_cha`
  const handleDeleteCarta = async (carta: CartaChaDoc) => {
    if (!currentUser) return;
    const path = `cartas_cha/${carta.id}`;
    try {
      await deleteDoc(doc(db, 'cartas_cha', carta.id));
      setConfirmDeleteId(null);
      notify('success', `"${carta.nome}" removida da coleção cartas_cha.`);
    } catch (error: any) {
      notify('error', error?.message || 'Não foi possível remover o documento.');
      try {
        handleFirestoreError(error, OperationType.DELETE, path);
      } catch {
        // Logged
      }
    }
  };

  // Load saved Firestore state (`cartas_cha` + optional `/users/{uid}/cartas/{id}`) back into Curator
  const handleOpenCartaInCurator = useCallback(
    async (carta?: CartaChaDoc) => {
      if (!onOpenCarta) return;
      if (!carta) {
        onOpenCarta();
        return;
      }

      setLoadingCuratorId(carta.id);
      let latestCarta: CartaChaDoc = { ...carta };
      let extraUserCarta: Record<string, any> | null = null;

      try {
        const path = `cartas_cha/${carta.id}`;
        try {
          const snap = await getDoc(doc(db, 'cartas_cha', carta.id));
          if (snap.exists()) {
            const d = snap.data() as Record<string, any>;
            const rawStatus = String(d.statusProposta || latestCarta.statusProposta || 'pendente');
            latestCarta = {
              id: String(d.id || snap.id),
              uid: String(d.uid || latestCarta.uid || ''),
              ownerId: String(d.ownerId || latestCarta.ownerId || ''),
              nome: String(d.nome || latestCarta.nome || 'Carta de Chás'),
              estabelecimento: d.estabelecimento ? String(d.estabelecimento) : '',
              segmento: String(d.segmento || latestCarta.segmento || 'Restaurante'),
              formatoServico: d.formatoServico ? String(d.formatoServico) : '',
              itensCount: Math.max(1, Number(d.itensCount) || latestCarta.itensCount || 1),
              blends: Array.isArray(d.blends) ? d.blends.map(String) : latestCarta.blends || [],
              statusProposta:
                rawStatus === 'aprovada' || rawStatus === 'em_analise' || rawStatus === 'pendente'
                  ? rawStatus
                  : 'pendente',
              observacoes: d.observacoes ? String(d.observacoes) : '',
              createdAt: d.createdAt || latestCarta.createdAt || null,
              updatedAt: d.updatedAt || d.createdAt || latestCarta.updatedAt || null,
            };
          }
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.GET, path);
          } catch {
            // Fall back cleanly to snapshot row state while logging structured context
          }
        }

        if (currentUser?.emailVerified) {
          try {
            const userCartaSnap = await getDoc(doc(db, 'users', currentUser.uid, 'cartas', carta.id));
            if (userCartaSnap.exists()) {
              extraUserCarta = userCartaSnap.data() as Record<string, any>;
            }
          } catch {
            // Subcollection doc may not exist if carta was created directly inside cartas_cha
          }
        }

        const hydratedPayload: HydratedCartaChaPayload = {
          ...latestCarta,
          name: latestCarta.nome || extraUserCarta?.name || 'Carta de Chás',
          establishmentName:
            latestCarta.estabelecimento || extraUserCarta?.establishmentName || '',
          businessType:
            extraUserCarta?.businessType || latestCarta.segmento || 'Restaurante',
          audienceProfile: extraUserCarta?.audienceProfile
            ? String(extraUserCarta.audienceProfile)
            : '',
          operatingHours: extraUserCarta?.operatingHours
            ? String(extraUserCarta.operatingHours)
            : '',
          menuHighlights:
            latestCarta.observacoes ||
            (extraUserCarta?.menuHighlights ? String(extraUserCarta.menuHighlights) : ''),
          serviceFormat:
            latestCarta.formatoServico ||
            (extraUserCarta?.serviceFormat ? String(extraUserCarta.serviceFormat) : ''),
          cartaTitle: extraUserCarta?.cartaTitle
            ? String(extraUserCarta.cartaTitle)
            : latestCarta.nome,
          itemCount: Math.max(
            1,
            Number(latestCarta.itensCount || extraUserCarta?.itemCount) || 4
          ),
          customBlendIds: Array.isArray(extraUserCarta?.customBlendIds)
            ? extraUserCarta.customBlendIds.map(String)
            : undefined,
          _editInCurator: true,
          _loadedFromFirestore: true,
        };

        onOpenCarta(hydratedPayload);
      } finally {
        setLoadingCuratorId(null);
      }
    },
    [currentUser, onOpenCarta]
  );

  // Derived stats, monthly revenue trend & filtered list
  const stats = useMemo(() => {
    const pendente = cartas.filter((c) => c.statusProposta === 'pendente').length;
    const emAnalise = cartas.filter((c) => c.statusProposta === 'em_analise').length;
    const aprovada = cartas.filter((c) => c.statusProposta === 'aprovada').length;
    const total = cartas.length;
    return { total, pendente, emAnalise, aprovada };
  }, [cartas]);

  const revenueTrend = useMemo(() => buildMonthlyRevenueTrend(cartas, 'pt-BR'), [cartas]);
  const totalMonthlyPotentialRevenue =
    revenueTrend.length > 0
      ? revenueTrend[revenueTrend.length - 1].receitaPotencialMensal
      : 0;
  const totalMonthlyGrossProfit = Math.round(
    totalMonthlyPotentialRevenue * TALCHA_GROSS_MARGIN_RATE
  );
  const totalBlendsHistory = useMemo(
    () => cartas.reduce((acc, c) => acc + Math.max(1, Number(c.itensCount) || 1), 0),
    [cartas]
  );

  const availableSegments = useMemo(() => {
    const set = new Set<string>();
    cartas.forEach((c) => {
      if (c.segmento) set.add(c.segmento);
    });
    return Array.from(set);
  }, [cartas]);

  const filteredCartas = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return cartas.filter((c) => {
      if (statusFilter !== 'all' && c.statusProposta !== statusFilter) return false;
      if (segmentFilter !== 'all' && c.segmento !== segmentFilter) return false;
      if (!q) return true;
      return (
        c.nome.toLowerCase().includes(q) ||
        (c.estabelecimento || '').toLowerCase().includes(q) ||
        c.segmento.toLowerCase().includes(q) ||
        (c.observacoes || '').toLowerCase().includes(q)
      );
    });
  }, [cartas, searchTerm, statusFilter, segmentFilter]);

  const handleExportHistoricoCsv = useCallback(() => {
    const rowsToExport = filteredCartas.length > 0 ? filteredCartas : cartas;
    if (rowsToExport.length === 0) {
      notify('error', 'Nenhuma carta de chá disponível para exportar.');
      return;
    }

    const headers = [
      'ID do Documento',
      'Nome da Carta',
      'Estabelecimento',
      'Segmento',
      'Formato de Serviço',
      'Qtd. Blends',
      'Blends Selecionados',
      'Status da Proposta',
      'Código do Status',
      'Data de Criação',
      'Última Atualização',
      'Observações',
    ];

    const lines = [
      headers.map(escapeCsvCell).join(','),
      ...rowsToExport.map((carta) => {
        const statusLabel = getStatusMeta(carta.statusProposta).label;
        const blendsFormatted =
          Array.isArray(carta.blends) && carta.blends.length > 0
            ? carta.blends.join('; ')
            : '';

        return [
          carta.id,
          carta.nome,
          carta.estabelecimento || '',
          carta.segmento,
          carta.formatoServico || '',
          carta.itensCount,
          blendsFormatted,
          statusLabel,
          carta.statusProposta,
          formatDateTimeCsv(carta.createdAt || carta.updatedAt),
          formatDateTimeCsv(carta.updatedAt || carta.createdAt),
          carta.observacoes || '',
        ]
          .map(escapeCsvCell)
          .join(',');
      }),
    ];

    try {
      const csvContent = '\uFEFF' + lines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const dateStamp = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `talcha_historico_cartas_${dateStamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      notify(
        'success',
        `Histórico exportado em CSV (${rowsToExport.length} ${
          rowsToExport.length === 1 ? 'carta' : 'cartas'
        }).`
      );
    } catch {
      notify('error', 'Não foi possível gerar o arquivo CSV para download.');
    }
  }, [cartas, filteredCartas, notify]);

  // Loading auth state (Skeleton Shell)
  if (!authReady) {
    const authSkeletonRows = [
      { dateW: 'w-24', nameW: 'w-48', subW: 'w-32', segW: 'w-24', itemsW: 'w-16', statusW: 'w-24' },
      { dateW: 'w-20', nameW: 'w-56', subW: 'w-40', segW: 'w-28', itemsW: 'w-14', statusW: 'w-28' },
      { dateW: 'w-24', nameW: 'w-40', subW: 'w-28', segW: 'w-20', itemsW: 'w-16', statusW: 'w-24' },
      { dateW: 'w-20', nameW: 'w-52', subW: 'w-36', segW: 'w-24', itemsW: 'w-14', statusW: 'w-28' },
    ];
    return (
      <div
        role="status"
        aria-label="Verificando sessão autenticada..."
        className={
          variant === 'full'
            ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-pulse'
            : 'space-y-5 animate-pulse'
        }
      >
        <div className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 sm:p-6 space-y-5">
          {!hideHeader && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE3D5] dark:border-[#2E251D]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-neutral-800 shrink-0" />
                <div className="space-y-2">
                  <div className="h-3 w-40 rounded bg-gray-200 dark:bg-neutral-800" />
                  <div className="h-5 w-56 rounded bg-gray-300 dark:bg-neutral-700" />
                  <div className="h-3 w-44 rounded bg-gray-200 dark:bg-neutral-800" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-24 rounded-xl bg-gray-200 dark:bg-neutral-800" />
                <div className="h-9 w-32 rounded-xl bg-gray-200 dark:bg-neutral-800" />
                <div className="h-9 w-28 rounded-xl bg-gray-300 dark:bg-neutral-700" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { labelW: 'w-20', descW: 'w-40' },
              { labelW: 'w-24', descW: 'w-44' },
              { labelW: 'w-20', descW: 'w-36' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#EDE3D5] dark:border-[#322921] bg-[#FAF7F2]/80 dark:bg-[#221C17] p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className={`h-3.5 ${item.labelW} rounded bg-gray-200 dark:bg-neutral-800`} />
                  <div className="h-6 w-8 rounded bg-gray-300 dark:bg-neutral-700" />
                </div>
                <div className={`h-3 ${item.descW} rounded bg-gray-200 dark:bg-neutral-800`} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 sm:p-6 space-y-4">
          <div className="h-5 w-56 rounded bg-gray-300 dark:bg-neutral-700" />
          <div className="overflow-x-auto rounded-xl border border-[#E5DACB] dark:border-[#352C23]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] dark:bg-[#221C17] border-b border-[#E5DACB] dark:border-[#352C23] text-[11px] font-bold uppercase tracking-wider text-[#6E6659] dark:text-[#A89E90]">
                  <th className="py-3 px-4 whitespace-nowrap">Data de Criação</th>
                  <th className="py-3 px-4">Nome da Carta</th>
                  <th className="py-3 px-4 whitespace-nowrap">Segmento & Itens</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status da Proposta</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE3D5] dark:divide-[#2E251D] bg-white dark:bg-[#1A1613]">
                {authSkeletonRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded bg-gray-300 dark:bg-neutral-700 shrink-0" />
                        <div className={`h-3.5 ${row.dateW} rounded bg-gray-200 dark:bg-neutral-800`} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <div className={`h-4 ${row.nameW} max-w-full rounded bg-gray-300 dark:bg-neutral-700`} />
                        <div className={`h-3 ${row.subW} max-w-full rounded bg-gray-200 dark:bg-neutral-800`} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1.5">
                        <div className={`h-3.5 ${row.segW} rounded bg-gray-300 dark:bg-neutral-700`} />
                        <div className={`h-3 ${row.itemsW} rounded bg-gray-200 dark:bg-neutral-800`} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className={`h-6 ${row.statusW} rounded-md bg-gray-200 dark:bg-neutral-800`} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {onOpenCarta && (
                          <div className="h-7 w-28 rounded-lg bg-gray-300 dark:bg-neutral-700" />
                        )}
                        <div className="h-7 w-20 rounded-lg bg-gray-200 dark:bg-neutral-800" />
                        <div className="h-7 w-7 rounded-lg bg-gray-200 dark:bg-neutral-800" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (!currentUser) {
    return (
      <section className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <div className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#8B2635]/10 text-[#8B2635] dark:text-[#E88E9B] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-serif-editorial text-2xl font-bold text-[#1E1B18] dark:text-[#FAF8F5]">
            Dashboard do Estabelecimento
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6659] dark:text-[#A89E90] max-w-md mx-auto">
            Entre com sua conta Google autenticada para visualizar suas cartas de chá da coleção{' '}
            <code className="font-mono text-[#8B2635] dark:text-[#E88E9B]">cartas_cha</code> no
            Firestore e acompanhar o status comercial.
          </p>
          <button
            type="button"
            onClick={handleSignInGoogle}
            disabled={authBusy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            <span>{authBusy ? 'Conectando...' : 'Entrar com Google'}</span>
          </button>
        </div>
      </section>
    );
  }

  const totalPct = Math.max(1, stats.total);
  const pctPendente = Math.round((stats.pendente / totalPct) * 100);
  const pctEmAnalise = Math.round((stats.emAnalise / totalPct) * 100);
  const pctAprovada = stats.total > 0 ? Math.max(0, 100 - pctPendente - pctEmAnalise) : 0;

  return (
    <section
      aria-label="Dashboard do Estabelecimento · Cartas de Chá"
      className={variant === 'full' ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6' : 'space-y-5'}
    >
      {/* ── Header & Auth Identity Bar ───────────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 sm:p-6 space-y-5">
        {!hideHeader && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EDE3D5] dark:border-[#2E251D]">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#8B2635]/10 dark:bg-[#8B2635]/20 border border-[#8B2635]/20 text-[#8B2635] dark:text-[#E88E9B] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#8B2635] dark:text-[#E88E9B]">
                <span>Dashboard do Estabelecimento</span>
                <span aria-hidden="true" className="text-[#C68A36]">·</span>
                <span className="text-[#235428] dark:text-[#7FE08A] inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Firestore · cartas_cha
                </span>
              </div>
              <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-[#1E1B18] dark:text-[#FAF8F5] truncate mt-0.5">
                {currentUser.displayName || 'Estabelecimento Autenticado'}
              </h2>
              <p className="text-xs text-[#6E6659] dark:text-[#A89E90] truncate">
                {currentUser.email || currentUser.uid}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] hover:bg-[#F2EAE0] dark:hover:bg-[#2C241E] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>

            <button
              type="button"
              id="btn-exportar-historico-csv"
              onClick={handleExportHistoricoCsv}
              disabled={loading || cartas.length === 0}
              title="Exportar histórico de cartas de chá e status em CSV para gestão offline"
              className="px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] hover:bg-[#F2EAE0] dark:hover:bg-[#2C241E] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B]" />
              <span>Exportar Histórico</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCreateForm((v) => !v)}
              className="px-3.5 py-2 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showCreateForm ? 'Fechar Formulário' : 'Nova Carta'}</span>
            </button>

            {onOpenCarta && (
              <button
                type="button"
                onClick={() => onOpenCarta()}
                className="px-3.5 py-2 rounded-xl border border-[#C68A36] bg-[#FAF7F2] dark:bg-[#221C17] text-xs font-semibold text-[#8B2635] dark:text-[#F2C374] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Abrir Curador</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              disabled={authBusy}
              className="px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1E1915] hover:bg-[#FDF2F2] dark:hover:bg-[#2E1A1C] text-xs font-semibold text-[#8B2635] dark:text-[#E88E9B] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
          </div>
        )}

        {/* Feedback / Error Banners */}
        {feedback && (
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 ${
              feedback.type === 'success'
                ? 'bg-[#2E6B34]/12 border border-[#2E6B34]/25 text-[#235428] dark:text-[#7FE08A]'
                : 'bg-[#8B2635]/10 border border-[#8B2635]/25 text-[#8B2635] dark:text-[#F099A5]'
            }`}
          >
            <span>{feedback.text}</span>
            <button type="button" onClick={() => setFeedback(null)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorBanner && (
          <div className="px-4 py-2.5 rounded-xl bg-[#C68A36]/12 border border-[#C68A36]/30 text-xs text-[#7D5211] dark:text-[#F2C374] flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorBanner}</span>
            </span>
            <button type="button" onClick={handleRefresh} className="underline font-semibold cursor-pointer">
              Recarregar
            </button>
          </div>
        )}

        {/* ── Quick Commercial Proposal Status Summary (Pendente / Em Análise / Aprovada) ── */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C68A36]">
                Visualização Rápida Comercial
              </span>
              <h3 className="font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF8F5]">
                Status das Cartas & Propostas Comerciais
              </h3>
            </div>
            <span className="text-xs text-[#6E6659] dark:text-[#A89E90] tabular-nums">
              {stats.total} {stats.total === 1 ? 'carta encontrada' : 'cartas encontradas'}
            </span>
          </div>

          {loading ? (
            <div className="h-2 w-full rounded-full overflow-hidden bg-[#EDE3D5] dark:bg-[#2E251D] animate-pulse" />
          ) : (
            stats.total > 0 && (
              <div className="h-2 w-full rounded-full overflow-hidden bg-[#EDE3D5] dark:bg-[#2E251D] flex">
                {stats.pendente > 0 && (
                  <div style={{ width: `${pctPendente}%` }} className="h-full bg-[#8B2635]" />
                )}
                {stats.emAnalise > 0 && (
                  <div style={{ width: `${pctEmAnalise}%` }} className="h-full bg-[#C68A36]" />
                )}
                {stats.aprovada > 0 && (
                  <div style={{ width: `${pctAprovada}%` }} className="h-full bg-[#2E6B34]" />
                )}
              </div>
            )
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                {
                  id: 'pendente' as PropostaStatus,
                  label: 'Pendente',
                  count: stats.pendente,
                  desc: 'Aguardando avaliação comercial',
                  icon: Hourglass,
                  textClass: 'text-[#8B2635] dark:text-[#F099A5]',
                  activeClass: 'border-[#8B2635] bg-[#8B2635]/8 dark:bg-[#8B2635]/18',
                },
                {
                  id: 'em_analise' as PropostaStatus,
                  label: 'Em Análise',
                  count: stats.emAnalise,
                  desc: 'Consultor validando mix e volumes',
                  icon: Clock,
                  textClass: 'text-[#8F5F14] dark:text-[#F2C374]',
                  activeClass: 'border-[#C68A36] bg-[#C68A36]/10 dark:bg-[#C68A36]/18',
                },
                {
                  id: 'aprovada' as PropostaStatus,
                  label: 'Aprovada',
                  count: stats.aprovada,
                  desc: 'Condições comerciais liberadas',
                  icon: BadgeCheck,
                  textClass: 'text-[#235428] dark:text-[#7FE08A]',
                  activeClass: 'border-[#2E6B34] bg-[#2E6B34]/10 dark:bg-[#2E6B34]/18',
                },
              ] as const
            ).map((stage) => {
              const Icon = stage.icon;
              const selected = statusFilter === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setStatusFilter((curr) => (curr === stage.id ? 'all' : stage.id))}
                  className={`text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                    selected
                      ? stage.activeClass
                      : 'border-[#E5DACB] dark:border-[#352C23] bg-[#FAF7F2]/70 dark:bg-[#221C17] hover:border-[#C68A36]/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${stage.textClass}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{stage.label}</span>
                    </span>
                    {loading ? (
                      <span className="h-7 w-9 rounded-md bg-[#E5DACB] dark:bg-[#352C23] animate-pulse inline-block" />
                    ) : (
                      <span className="font-serif-editorial text-2xl font-bold text-[#1E1B18] dark:text-[#FAF8F5] tabular-nums">
                        {stage.count}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#6E6659] dark:text-[#A89E90]">{stage.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Monthly Potential Revenue Trend Line (Recharts · cartas_cha) ─── */}
      <div className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#EDE3D5] dark:border-[#2E251D]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2E6B34] dark:text-[#7FE08A]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Tendência Financeira · Histórico cartas_cha</span>
            </div>
            <h3 className="font-serif-editorial text-xl font-bold text-[#1E1B18] dark:text-[#FAF8F5] mt-0.5">
              Potencial de Receita Mensal das Cartas Salvas
            </h3>
            <p className="text-xs text-[#6E6659] dark:text-[#A89E90]">
              Projeção acumulada mês a mês com base nas cartas salvas, blends selecionados ({totalBlendsHistory}) e ticket médio B2B de R$ 16/xícara.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-xl border border-[#EDE3D5] dark:border-[#322921] bg-[#FAF7F2] dark:bg-[#221C17] px-3.5 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                Receita Potencial / Mês
              </span>
              {loading ? (
                <div className="h-6 w-24 mt-1 rounded bg-gray-300 dark:bg-neutral-700 animate-pulse" />
              ) : (
                <span className="font-serif-editorial text-lg sm:text-xl font-bold text-[#8B2635] dark:text-[#E88E9B] tabular-nums">
                  {formatBrl(totalMonthlyPotentialRevenue)}
                </span>
              )}
            </div>
            <div className="rounded-xl border border-[#2E6B34]/25 bg-[#2E6B34]/8 dark:bg-[#2E6B34]/18 px-3.5 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#235428] dark:text-[#7FE08A] block">
                Lucro Bruto (~89%)
              </span>
              {loading ? (
                <div className="h-6 w-24 mt-1 rounded bg-gray-300 dark:bg-neutral-700 animate-pulse" />
              ) : (
                <span className="font-serif-editorial text-lg sm:text-xl font-bold text-[#235428] dark:text-[#7FE08A] tabular-nums">
                  {formatBrl(totalMonthlyGrossProfit)}
                </span>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div
            role="status"
            aria-label="Carregando tendência de receita potencial mensal..."
            className="h-60 w-full rounded-xl border border-[#EDE3D5] dark:border-[#322921] bg-[#FAF7F2]/70 dark:bg-[#221C17]/70 p-4 flex flex-col justify-between animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-36 rounded bg-gray-200 dark:bg-neutral-800" />
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-neutral-800" />
            </div>
            <div className="flex-1 flex items-end gap-3 py-4">
              <div className="h-10 flex-1 rounded bg-gray-200 dark:bg-neutral-800" />
              <div className="h-16 flex-1 rounded bg-gray-200 dark:bg-neutral-800" />
              <div className="h-24 flex-1 rounded bg-gray-300 dark:bg-neutral-700" />
              <div className="h-28 flex-1 rounded bg-gray-200 dark:bg-neutral-800" />
              <div className="h-36 flex-1 rounded bg-gray-300 dark:bg-neutral-700" />
              <div className="h-40 flex-1 rounded bg-gray-300 dark:bg-neutral-700" />
            </div>
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-3 w-10 rounded bg-gray-200 dark:bg-neutral-800" />
              ))}
            </div>
          </div>
        ) : revenueTrend.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-dashed border-[#DFD2BF] dark:border-[#3A3027] space-y-2">
            <TrendingUp className="w-6 h-6 text-[#C68A36] mx-auto" />
            <p className="text-xs font-medium text-[#6E6659] dark:text-[#A89E90] max-w-md mx-auto">
              Salve sua primeira carta na coleção <span className="font-mono">cartas_cha</span> para acompanhar a curva de tendência de receita potencial mensal do seu estabelecimento.
            </p>
          </div>
        ) : (
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={revenueTrend}
                margin={{ top: 10, right: 16, left: 4, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(198, 138, 54, 0.22)"
                  vertical={false}
                />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: '#70675A' }}
                  axisLine={{ stroke: '#DFD2BF' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => formatBrlCompact(Number(val) || 0)}
                  tick={{ fontSize: 11, fill: '#70675A' }}
                  axisLine={false}
                  tickLine={false}
                  width={68}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const pt = payload[0]?.payload as MonthlyRevenueTrendPoint | undefined;
                    if (!pt) return null;
                    return (
                      <div className="rounded-xl border border-[#E5DACB] dark:border-[#3A3027] bg-white dark:bg-[#1A1613] px-3.5 py-2.5 shadow-md text-xs space-y-1">
                        <div className="font-bold uppercase tracking-wider text-[10px] text-[#C68A36]">
                          {pt.monthLabel}
                        </div>
                        <div className="font-serif-editorial text-base font-bold text-[#8B2635] dark:text-[#E88E9B] tabular-nums">
                          {formatBrl(pt.receitaPotencialMensal)} / mês
                        </div>
                        <div className="text-[11px] text-[#235428] dark:text-[#7FE08A] font-semibold tabular-nums">
                          Lucro Bruto: {formatBrl(pt.lucroBrutoEstimado)}
                        </div>
                        <div className="text-[11px] text-[#6E6659] dark:text-[#A89E90] pt-0.5 border-t border-[#EDE3D5] dark:border-[#2E251D] tabular-nums">
                          {pt.cartasAcumuladas} {pt.cartasAcumuladas === 1 ? 'carta ativa' : 'cartas ativas'} · {pt.blendsAcumulados} blends
                          {pt.cartasNoMes > 0 && ` (+${pt.cartasNoMes} no mês)`}
                        </div>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="receitaPotencialMensal"
                  name="Receita Potencial Mensal"
                  stroke="#8B2635"
                  strokeWidth={2.75}
                  dot={{ r: 4, fill: '#8B2635', stroke: '#FAF7F2', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#C68A36', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Optional Create New CartaCha Form ────────────────────────────── */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateCartaCha}
          className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#C68A36]/50 p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EDE3D5] dark:border-[#2E251D]">
            <h3 className="font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF8F5]">
              Registrar Nova Carta em <span className="font-mono text-sm text-[#8B2635] dark:text-[#E88E9B]">cartas_cha</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-[#6E6659] hover:text-[#1E1B18] cursor-pointer"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                Nome da Carta *
              </span>
              <input
                type="text"
                required
                maxLength={CARTA_CHA_CONSTRAINTS.MAX_NOME_LEN}
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
                placeholder="Ex.: Carta Degustação Verão 2026"
                className="w-full px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                Estabelecimento
              </span>
              <input
                type="text"
                maxLength={CARTA_CHA_CONSTRAINTS.MAX_ESTABELECIMENTO_LEN}
                value={newEstabelecimento}
                onChange={(e) => setNewEstabelecimento(e.target.value)}
                placeholder="Ex.: Dama Cafeteria / Hotel Emiliano"
                className="w-full px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                Segmento
              </span>
              <select
                value={newSegmento}
                onChange={(e) => setNewSegmento(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
              >
                {DEFAULT_SEGMENTS.map((seg) => (
                  <option key={seg} value={seg}>
                    {seg}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1 sm:col-span-2">
              <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                Blends Selecionados (separados por vírgula)
              </span>
              <input
                type="text"
                value={newBlendsText}
                onChange={(e) => setNewBlendsText(e.target.value)}
                placeholder="Earl Grey Especial, Cherry Rose, Doce Amêndoa"
                className="w-full px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                Formato de Serviço
              </span>
              <input
                type="text"
                maxLength={CARTA_CHA_CONSTRAINTS.MAX_FORMATO_LEN}
                value={newFormato}
                onChange={(e) => setNewFormato(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
              Observações de Harmonização / Comercial
            </span>
            <textarea
              rows={2}
              maxLength={CARTA_CHA_CONSTRAINTS.MAX_OBS_LEN}
              value={newObservacoes}
              onChange={(e) => setNewObservacoes(e.target.value)}
              placeholder="Detalhes sobre carta de sobremesas, serviço à mesa ou volume mensal estimado..."
              className="w-full px-3 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
            />
          </label>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] text-xs font-semibold text-[#5C564D] dark:text-[#C7BFB2] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submittingNew}
              className="px-4 py-2 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {submittingNew ? 'Salvando no Firestore...' : 'Salvar Carta no Firestore'}
            </button>
          </div>
        </form>
      )}

      {/* ── Structured Table of Firestore `cartas_cha` Documents ──────────── */}
      <div className="rounded-2xl bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif-editorial text-xl font-bold text-[#1E1B18] dark:text-[#FAF8F5]">
              Cartas de Chá do Estabelecimento
            </h3>
            <p className="text-xs text-[#6E6659] dark:text-[#A89E90]">
              Registros sincronizados em tempo real via Firestore (coleção <span className="font-mono">cartas_cha</span>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#8A8072] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou local..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs text-[#1E1B18] dark:text-[#FAF8F5]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | PropostaStatus)}
              aria-label="Filtrar por status da proposta comercial"
              className="px-3 py-1.5 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs font-medium text-[#1E1B18] dark:text-[#FAF8F5] cursor-pointer"
            >
              <option value="all">Todos os status ({stats.total})</option>
              <option value="pendente">Pendente ({stats.pendente})</option>
              <option value="em_analise">Em Análise ({stats.emAnalise})</option>
              <option value="aprovada">Aprovada ({stats.aprovada})</option>
            </select>

            {availableSegments.length > 0 && (
              <select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                aria-label="Filtrar por segmento"
                className="px-3 py-1.5 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs font-medium text-[#1E1B18] dark:text-[#FAF8F5] cursor-pointer"
              >
                <option value="all">Todos os segmentos</option>
                {availableSegments.map((seg) => (
                  <option key={seg} value={seg}>
                    {seg}
                  </option>
                ))}
              </select>
            )}

            {(statusFilter !== 'all' || segmentFilter !== 'all' || searchTerm.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setSegmentFilter('all');
                  setSearchTerm('');
                }}
                className="px-2.5 py-1.5 rounded-xl border border-[#8B2635]/30 bg-[#8B2635]/8 text-xs font-semibold text-[#8B2635] dark:text-[#E88E9B] cursor-pointer"
              >
                Limpar filtros
              </button>
            )}

            {hideHeader && (
              <button
                type="button"
                id="btn-exportar-historico-csv"
                onClick={handleExportHistoricoCsv}
                disabled={loading || cartas.length === 0}
                title="Exportar histórico de cartas de chá e status em CSV para gestão offline"
                className="px-3 py-1.5 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] hover:bg-[#F2EAE0] dark:hover:bg-[#2C241E] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5 text-[#8B2635] dark:text-[#E88E9B]" />
                <span>Exportar Histórico</span>
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Proposal Status Filter Pills (Todas / Pendente / Em Análise / Aprovada) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 pb-2 border-b border-[#EDE3D5] dark:border-[#2E251D]">
          <div
            role="group"
            aria-label="Filtro de status das propostas comerciais"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#FAF7F2] dark:bg-[#221C17] border border-[#E5DACB] dark:border-[#352C23]"
          >
            {(
              [
                { id: 'all' as const, label: 'Todas', count: stats.total },
                { id: 'pendente' as const, label: 'Pendente', count: stats.pendente },
                { id: 'em_analise' as const, label: 'Em Análise', count: stats.emAnalise },
                { id: 'aprovada' as const, label: 'Aprovada', count: stats.aprovada },
              ] as const
            ).map((opt) => {
              const active = statusFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatusFilter(opt.id)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums whitespace-nowrap ${
                    active
                      ? 'bg-[#8B2635] text-white'
                      : 'text-[#5C564D] dark:text-[#C2B8AA] hover:text-[#1E1B18] dark:hover:text-white'
                  }`}
                >
                  {opt.label} ({loading ? '…' : opt.count})
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-medium text-[#6E6659] dark:text-[#A89E90] tabular-nums">
            {loading
              ? 'Sincronizando registros do Firestore...'
              : `Exibindo ${filteredCartas.length} de ${stats.total} ${stats.total === 1 ? 'registro' : 'registros'}`}
          </span>
        </div>

        {loading ? (
          <div
            role="status"
            aria-label="Carregando cartas de chá do Firestore..."
            className="overflow-x-auto rounded-xl border border-[#E5DACB] dark:border-[#352C23]"
          >
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] dark:bg-[#221C17] border-b border-[#E5DACB] dark:border-[#352C23] text-[11px] font-bold uppercase tracking-wider text-[#6E6659] dark:text-[#A89E90]">
                  <th className="py-3 px-4 whitespace-nowrap">Data de Criação</th>
                  <th className="py-3 px-4">Nome da Carta</th>
                  <th className="py-3 px-4 whitespace-nowrap">Segmento & Itens</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status da Proposta</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE3D5] dark:divide-[#2E251D] bg-white dark:bg-[#1A1613] animate-pulse">
                {[
                  { dateW: 'w-24', titleW: 'w-48', subW: 'w-32', segW: 'w-24', itemsW: 'w-16', statusW: 'w-24' },
                  { dateW: 'w-20', titleW: 'w-56', subW: 'w-40', segW: 'w-28', itemsW: 'w-14', statusW: 'w-28' },
                  { dateW: 'w-24', titleW: 'w-40', subW: 'w-28', segW: 'w-20', itemsW: 'w-16', statusW: 'w-24' },
                  { dateW: 'w-20', titleW: 'w-52', subW: 'w-36', segW: 'w-24', itemsW: 'w-14', statusW: 'w-28' },
                  { dateW: 'w-24', titleW: 'w-44', subW: 'w-24', segW: 'w-28', itemsW: 'w-16', statusW: 'w-24' },
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 rounded bg-gray-300 dark:bg-neutral-700 shrink-0" />
                        <div className={`h-3.5 ${row.dateW} rounded bg-gray-200 dark:bg-neutral-800`} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <div className={`h-4 ${row.titleW} max-w-full rounded bg-gray-300 dark:bg-neutral-700`} />
                        <div className={`h-3 ${row.subW} max-w-full rounded bg-gray-200 dark:bg-neutral-800`} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1.5">
                        <div className={`h-3.5 ${row.segW} rounded bg-gray-300 dark:bg-neutral-700`} />
                        <div className={`h-3 ${row.itemsW} rounded bg-gray-200 dark:bg-neutral-800`} />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className={`h-6 ${row.statusW} rounded-md bg-gray-200 dark:bg-neutral-800`} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {onOpenCarta && (
                          <div className="h-7 w-28 rounded-lg bg-gray-300 dark:bg-neutral-700" />
                        )}
                        <div className="h-7 w-20 rounded-lg bg-gray-200 dark:bg-neutral-800" />
                        <div className="h-7 w-7 rounded-lg bg-gray-200 dark:bg-neutral-800" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredCartas.length === 0 ? (
          <div className="py-10 text-center space-y-3 border border-dashed border-[#DFD2BF] dark:border-[#3A3027] rounded-xl">
            <Layers className="w-7 h-7 text-[#8B2635] dark:text-[#E88E9B] mx-auto" />
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="font-serif-editorial text-lg font-bold text-[#1E1B18] dark:text-[#FAF8F5]">
                {cartas.length === 0
                  ? 'Nenhuma carta encontrada em cartas_cha'
                  : 'Nenhuma carta corresponde aos filtros'}
              </h4>
              <p className="text-xs text-[#6E6659] dark:text-[#A89E90]">
                {cartas.length === 0
                  ? 'Crie sua primeira carta personalizada para acompanhar blends selecionados e o andamento da proposta comercial.'
                  : 'Altere os filtros de busca ou status para exibir os registros salvos.'}
              </p>
            </div>
            {cartas.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Primeira Carta</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setSegmentFilter('all');
                  setSearchTerm('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DFD2BF] dark:border-[#3A3027] text-xs font-semibold text-[#1E1B18] dark:text-[#FAF8F5] cursor-pointer"
              >
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5DACB] dark:border-[#352C23]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] dark:bg-[#221C17] border-b border-[#E5DACB] dark:border-[#352C23] text-[11px] font-bold uppercase tracking-wider text-[#6E6659] dark:text-[#A89E90]">
                  <th className="py-3 px-4 whitespace-nowrap">Data de Criação</th>
                  <th className="py-3 px-4">Nome da Carta</th>
                  <th className="py-3 px-4 whitespace-nowrap">Segmento & Itens</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status da Proposta</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE3D5] dark:divide-[#2E251D] bg-white dark:bg-[#1A1613]">
                {filteredCartas.map((carta) => {
                  const statusMeta = getStatusMeta(carta.statusProposta);
                  const StatusIcon = statusMeta.icon;
                  const isExpanded = expandedRowId === carta.id;
                  const isEditing = editingId === carta.id;
                  const isConfirmDelete = confirmDeleteId === carta.id;

                  return (
                    <React.Fragment key={carta.id}>
                      <tr className="hover:bg-[#FAF7F2]/70 dark:hover:bg-[#221C17]/70 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap tabular-nums text-[#5C564D] dark:text-[#C7BFB2]">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#C68A36] shrink-0" />
                            {formatDatePt(carta.createdAt || carta.updatedAt)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#1E1B18] dark:text-[#FAF8F5]">
                            {carta.nome}
                          </div>
                          {carta.estabelecimento && (
                            <div className="text-[11px] text-[#70675A] dark:text-[#9E9487]">
                              {carta.estabelecimento}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-[#1E1B18] dark:text-[#FAF8F5]">
                            {carta.segmento}
                          </div>
                          <div className="text-[11px] text-[#70675A] dark:text-[#9E9487] tabular-nums">
                            {carta.itensCount} blends
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${statusMeta.badgeClass}`}
                            >
                              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>{statusMeta.label}</span>
                            </span>

                            {isAdminUser && (
                              <select
                                value={carta.statusProposta}
                                disabled={updatingStatusId === carta.id}
                                onChange={(e) =>
                                  handleAdminStatusChange(carta, e.target.value as PropostaStatus)
                                }
                                aria-label="Alterar status da proposta"
                                className="px-2 py-1 rounded-md border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1A1613] text-[11px] font-semibold cursor-pointer"
                              >
                                <option value="pendente">Pendente</option>
                                <option value="em_analise">Em Análise</option>
                                <option value="aprovada">Aprovada</option>
                              </select>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {onOpenCarta && (
                              <button
                                type="button"
                                disabled={loadingCuratorId === carta.id}
                                onClick={() => handleOpenCartaInCurator(carta)}
                                title="Carregar dados salvos do Firestore no curador para edição"
                                className="px-2.5 py-1 rounded-lg bg-[#8B2635] hover:bg-[#721F2B] text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                              >
                                <PencilLine className="w-3 h-3" />
                                <span>
                                  {loadingCuratorId === carta.id ? 'Carregando...' : 'Editar no Curador'}
                                </span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedRowId((curr) => (curr === carta.id ? null : carta.id))
                              }
                              className="px-2.5 py-1 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-[11px] font-semibold text-[#1E1B18] dark:text-[#FAF8F5] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? 'Ocultar' : 'Detalhes'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {!isConfirmDelete ? (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(carta.id)}
                                title="Excluir carta"
                                className="p-1.5 rounded-lg text-[#8A8072] hover:text-[#8B2635] hover:bg-[#8B2635]/10 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCarta(carta)}
                                  className="px-2 py-1 rounded-md bg-[#8B2635] text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 rounded-md border border-[#DFD2BF] dark:border-[#3A3027] text-[11px] cursor-pointer"
                                >
                                  Não
                                </button>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#FAF7F2]/60 dark:bg-[#211C17]/70">
                          <td colSpan={5} className="p-4 sm:p-5 space-y-3">
                            {isEditing ? (
                              <div className="space-y-3 bg-white dark:bg-[#1A1613] p-4 rounded-xl border border-[#E5DACB] dark:border-[#352C23]">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <label className="block space-y-1">
                                    <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                                      Nome da Carta
                                    </span>
                                    <input
                                      type="text"
                                      maxLength={CARTA_CHA_CONSTRAINTS.MAX_NOME_LEN}
                                      value={editNome}
                                      onChange={(e) => setEditNome(e.target.value)}
                                      className="w-full px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs"
                                    />
                                  </label>
                                  <label className="block space-y-1">
                                    <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                                      Estabelecimento
                                    </span>
                                    <input
                                      type="text"
                                      maxLength={CARTA_CHA_CONSTRAINTS.MAX_ESTABELECIMENTO_LEN}
                                      value={editEstabelecimento}
                                      onChange={(e) => setEditEstabelecimento(e.target.value)}
                                      className="w-full px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs"
                                    />
                                  </label>
                                </div>
                                <label className="block space-y-1">
                                  <span className="text-[11px] font-semibold text-[#5C564D] dark:text-[#C7BFB2]">
                                    Observações
                                  </span>
                                  <textarea
                                    rows={2}
                                    maxLength={CARTA_CHA_CONSTRAINTS.MAX_OBS_LEN}
                                    value={editObservacoes}
                                    onChange={(e) => setEditObservacoes(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-[#FAF7F2] dark:bg-[#221C17] text-xs"
                                  />
                                </label>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(carta)}
                                    disabled={savingEdit}
                                    className="px-3 py-1.5 rounded-lg bg-[#8B2635] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                                  >
                                    {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] text-xs font-semibold cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                                      Formato de Serviço
                                    </span>
                                    <span className="text-[#1E1B18] dark:text-[#FAF8F5] font-medium">
                                      {carta.formatoServico || 'Serviço de Salão'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                                      Última Atualização
                                    </span>
                                    <span className="text-[#1E1B18] dark:text-[#FAF8F5] font-medium tabular-nums">
                                      {formatDatePt(carta.updatedAt || carta.createdAt)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                                      ID do Documento
                                    </span>
                                    <span className="font-mono text-[11px] text-[#5C564D] dark:text-[#C7BFB2]">
                                      {carta.id}
                                    </span>
                                  </div>
                                </div>

                                {carta.blends && carta.blends.length > 0 && (
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block mb-1.5">
                                      Blends Selecionados
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {carta.blends.map((blend, idx) => (
                                        <span
                                          key={`${carta.id}-blend-${idx}`}
                                          className="px-2.5 py-1 rounded-md bg-white dark:bg-[#1A1613] border border-[#E5DACB] dark:border-[#352C23] text-[11px] font-medium text-[#1E1B18] dark:text-[#FAF8F5]"
                                        >
                                          {blend}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {carta.observacoes && (
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#70675A] dark:text-[#A89E90] block">
                                      Observações
                                    </span>
                                    <p className="text-xs text-[#4F4840] dark:text-[#C7BFB2]">
                                      {carta.observacoes}
                                    </p>
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  {onOpenCarta && (
                                    <button
                                      type="button"
                                      disabled={loadingCuratorId === carta.id}
                                      onClick={() => handleOpenCartaInCurator(carta)}
                                      className="px-3 py-1.5 rounded-lg bg-[#8B2635] hover:bg-[#721F2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      <span>
                                        {loadingCuratorId === carta.id
                                          ? 'Carregando do Firestore...'
                                          : 'Editar Carta no Curador'}
                                      </span>
                                    </button>
                                  )}

                                  {carta.statusProposta !== 'aprovada' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingId(carta.id);
                                        setEditNome(carta.nome);
                                        setEditEstabelecimento(carta.estabelecimento || '');
                                        setEditObservacoes(carta.observacoes || '');
                                      }}
                                      className="px-3 py-1.5 rounded-lg border border-[#DFD2BF] dark:border-[#3A3027] bg-white dark:bg-[#1A1613] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <PencilLine className="w-3.5 h-3.5 text-[#8B2635]" />
                                      <span>Edição Rápida</span>
                                    </button>
                                  )}

                                  {onOpenLeadModal && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenLeadModal('proposta', carta.nome)}
                                      className="px-3 py-1.5 rounded-lg border border-[#C68A36] bg-white dark:bg-[#1A1613] text-xs font-semibold text-[#8F5F14] dark:text-[#F2C374] cursor-pointer"
                                    >
                                      Solicitar Proposta Comercial
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export function DashboardEstabelecimento(props: DashboardEstabelecimentoProps) {
  const [resetKey, setResetKey] = useState(0);
  return (
    <CartasChaErrorBoundary onReset={() => setResetKey((k) => k + 1)}>
      <DashboardEstabelecimentoCore key={resetKey} {...props} />
    </CartasChaErrorBoundary>
  );
}

export default DashboardEstabelecimento;
