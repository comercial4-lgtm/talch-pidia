import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// In-memory / file-backed persistent stores
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'newsletter.json');
const CARTAS_FILE = path.join(DATA_DIR, 'cartas.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
  }
}

// Log audit events
function logAudit(action: string, details: Record<string, unknown> = {}) {
  const logs = readJsonFile<any[]>(AUDIT_FILE, []);
  const entry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    details,
  };
  logs.unshift(entry);
  if (logs.length > 200) logs.length = 200;
  writeJsonFile(AUDIT_FILE, logs);
}

// Gemini AI Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// CSRF & Session Endpoints
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const sid = crypto.randomBytes(24).toString('hex');
  res.cookie('talcha_csrf_sid', sid, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 28800000,
  });
  res.json({
    csrfToken,
    headerName: 'X-CSRF-Token',
    fieldName: '_csrf',
    expiresAt: new Date(Date.now() + 28800000).toISOString(),
  });
});

app.get('/api/auth/session', (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.json({
    authenticated: false,
    csrfToken,
    appleProviderConfigured: false,
  });
});

app.post('/api/auth/logout', (req, res) => {
  logAudit('AUTH_LOGOUT');
  res.json({ ok: true });
});

app.post('/api/auth/revoke-all', (req, res) => {
  logAudit('AUTH_REVOKE_ALL');
  res.json({ ok: true });
});

// Leads (Propostas e Solicitações Comerciais B2B)
app.post('/api/leads', (req, res) => {
  const leads = readJsonFile<any[]>(LEADS_FILE, []);
  const leadData = req.body || {};
  const newLead = {
    ...leadData,
    id: leadData.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: leadData.createdAt || new Date().toISOString(),
    status: leadData.status || 'novo',
  };
  leads.unshift(newLead);
  writeJsonFile(LEADS_FILE, leads);
  logAudit('LEAD_CREATED', { leadId: newLead.id, company: newLead.company, email: newLead.email });
  res.json({ success: true, lead: newLead });
});

app.get('/api/leads', (req, res) => {
  const leads = readJsonFile<any[]>(LEADS_FILE, []);
  res.json({ leads });
});

app.get('/api/leads/mine', (req, res) => {
  const leads = readJsonFile<any[]>(LEADS_FILE, []);
  res.json({ leads });
});

app.delete('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  let leads = readJsonFile<any[]>(LEADS_FILE, []);
  leads = leads.filter(l => l.id !== id);
  writeJsonFile(LEADS_FILE, leads);
  logAudit('LEAD_DELETED', { leadId: id });
  res.json({ success: true });
});

// Newsletter
app.post('/api/newsletter', (req, res) => {
  const { email, segment, language } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email inválido' });
  }
  const cleanEmail = email.trim().toLowerCase();
  const subscribers = readJsonFile<any[]>(SUBSCRIBERS_FILE, []);
  const exists = subscribers.find(s => s.email?.toLowerCase() === cleanEmail);
  if (!exists) {
    subscribers.push({
      email: cleanEmail,
      segment: segment || 'geral',
      language: language || 'pt',
      subscribedAt: new Date().toISOString(),
    });
    writeJsonFile(SUBSCRIBERS_FILE, subscribers);
    logAudit('NEWSLETTER_SUBSCRIBED', { email: cleanEmail, segment });
  }
  res.json({ success: true });
});

app.get('/api/newsletter', (req, res) => {
  const subscribers = readJsonFile<any[]>(SUBSCRIBERS_FILE, []);
  res.json({ subscribers });
});

// Cartas B2B Salvas
app.post('/api/cartas', (req, res) => {
  const cartas = readJsonFile<any[]>(CARTAS_FILE, []);
  const carta = req.body || {};
  const id = carta.id || `carta_${Date.now()}`;
  const idx = cartas.findIndex(c => c.id === id);
  const updated = {
    ...carta,
    id,
    updatedAt: new Date().toISOString(),
    createdAt: carta.createdAt || new Date().toISOString(),
  };
  if (idx >= 0) {
    cartas[idx] = updated;
  } else {
    cartas.unshift(updated);
  }
  writeJsonFile(CARTAS_FILE, cartas);
  logAudit('CARTA_SAVED', { cartaId: id, name: carta.name });
  res.json({ success: true, carta: updated });
});

app.delete('/api/cartas/:id', (req, res) => {
  const { id } = req.params;
  let cartas = readJsonFile<any[]>(CARTAS_FILE, []);
  cartas = cartas.filter(c => c.id !== id);
  writeJsonFile(CARTAS_FILE, cartas);
  logAudit('CARTA_DELETED', { cartaId: id });
  res.json({ success: true });
});

// Security / Audit Logs
app.get('/api/security/audit-logs', (req, res) => {
  const logs = readJsonFile<any[]>(AUDIT_FILE, []);
  res.json({ logs });
});

// IA Sommelier - Harmonização de Cardápio com Gemini 3.8 Flash
const TALCHA_CORE_TEAS = [
  { id: 'earl-grey', name: 'Earl Grey', category: 'chá preto', notes: 'Encorpado, bergamota cítrica de alta intensidade. Harmoniza com carnes nobres, massas densas, queijos curados e sobremesas de chocolate amargo.' },
  { id: 'cherry-rose', name: 'Cherry Rose', category: 'chá verde', notes: 'Sencha japonês com cereja selvagem e pétalas de rosa. Frescor vegetal, antioxidante. Harmoniza com sushi, peixes brancos, frutos do mar, saladas e sobremesas delicadas.' },
  { id: 'doce-amendoa', name: 'Doce Amêndoa', category: 'infusão', notes: 'Pedaços de maçã, amêndoas laminadas, canela e beterraba. Perfil aveludado, adocicado e sem cafeína. Harmoniza com sobremesas quentes, tortas e fondues.' },
  { id: 'gengibre-fresh', name: 'Gengibre Fresh', category: 'infusão', notes: 'Gengibre, capim-limão, hortelã e pimenta-rosa. Picante, refrescante e altamente digestivo. Harmoniza com culinária tailandesa, ceviches e pós-refeição.' },
  { id: 'rooibos-equilibrio', name: 'Rooibos Equilíbrio', category: 'rooibos', notes: 'Arbusto sul-africano com notas amadeiradas, mel e sem teína. Harmoniza com risotos, aves grelhadas e café da manhã relaxante.' },
  { id: 'vermelho-intenso', name: 'Vermelho Intenso', category: 'infusão', notes: 'Hibisco, morango, framboesa e maçã. Acidez marcante e cor rubi vibrante. Perfeito para coquetelaria, drinks gelados e queijos de cabra.' },
];

app.post('/api/analyze-menu', async (req, res) => {
  const { menuText, language = 'pt' } = req.body || {};
  if (!menuText || typeof menuText !== 'string' || menuText.trim().length === 0) {
    return res.status(400).json({ error: 'Texto do cardápio não informado' });
  }

  // Attempt Gemini API call
  if (ai) {
    try {
      const prompt = `Você é o Master Sommelier da Talchá (pioneira de chás especiais no Brasil).
Analise o seguinte menu de restaurante/hotel e recomende harmonizações elegantes com chás da Talchá.

Menu recebido:
"""
${menuText.slice(0, 4000)}
"""

Chás disponíveis no catálogo Talchá para harmonizar:
${TALCHA_CORE_TEAS.map(t => `- ID: "${t.id}", Nome: "${t.name}" (${t.category}): ${t.notes}`).join('\n')}

Retorne EXCLUSIVAMENTE um JSON com o seguinte formato:
{
  "categories": [
    {
      "categoryName": "Nome da seção ou grupo de pratos",
      "itemsFound": ["Prato 1", "Prato 2"],
      "suggestedTeaId": "id-do-cha-escolhido",
      "suggestedTeaName": "Nome do Chá",
      "pairingNotes": "Justificativa sensorial e narrativa do sommelier para a combinação",
      "serviceRitual": "Recomendação de temperatura, tempo e serviço (ex: infusor Vapt Vupt transparente à mesa)"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
          logAudit('MENU_ANALYZED_AI', { itemCount: parsed.categories.length });
          return res.json({ aiUsed: true, categories: parsed.categories });
        }
      }
    } catch (err: any) {
      console.warn('Gemini menu analysis fallback triggered:', err?.message || err);
    }
  }

  // Fallback heuristic sommelier algorithm
  const text = menuText.toLowerCase();
  const categories: any[] = [];

  // Fish & Seafood -> Cherry Rose
  if (text.includes('peixe') || text.includes('salmão') || text.includes('ceviche') || text.includes('frutos do mar') || text.includes('camarão') || text.includes('sushi')) {
    categories.push({
      categoryName: language === 'en' ? 'Seafood & Light Fare' : language === 'es' ? 'Pescados y Mariscos' : 'Pescados & Frutos do Mar',
      itemsFound: ['Salmão / Pescados Nobres / Ceviches'],
      suggestedTeaId: 'cherry-rose',
      suggestedTeaName: 'Cherry Rose (Chá Verde)',
      pairingNotes: language === 'en'
        ? 'Vegetal crispness and floral cherry notes elevate delicate seafood acidity without overpowering the palate.'
        : 'O frescor vegetal do Sencha japonês e as notas sutis de flor de cerejeira limpam o paladar e elevam a acidez natural dos pescados.',
      serviceRitual: '75°C · 2 minutos no infusor Vapt Vupt transparente com copo de vidro duplo.',
    });
  }

  // Meats & Pasta -> Earl Grey
  if (text.includes('carne') || text.includes('filé') || text.includes('costela') || text.includes('massa') || text.includes('risoto') || text.includes('queijo') || text.includes('hambúrguer')) {
    categories.push({
      categoryName: language === 'en' ? 'Rich Mains & Meats' : language === 'es' ? 'Platos Fuertes y Carnes' : 'Pratos Principais & Carnes',
      itemsFound: ['Carnes Nobres / Massas / Queijos'],
      suggestedTeaId: 'earl-grey',
      suggestedTeaName: 'Earl Grey (Chá Preto)',
      pairingNotes: language === 'en'
        ? 'Robust Ceylon black tea with cold-pressed bergamot oil cuts through fatty profiles with timeless elegance.'
        : 'Estrutura tânica robusta com bergamota cítrica pura que corta a untuosidade de pratos ricos e proporciona finalização equilibrada.',
      serviceRitual: '95°C · 3 a 4 minutos à mesa, servido com infusor Vapt Vupt.',
    });
  }

  // Desserts -> Doce Amêndoa
  if (text.includes('sobremesa') || text.includes('chocolate') || text.includes('torta') || text.includes('doce') || text.includes('pudim') || text.includes('sorvete')) {
    categories.push({
      categoryName: language === 'en' ? 'Desserts & Sweets' : language === 'es' ? 'Postres y Dulces' : 'Sobremesas & Confeitaria',
      itemsFound: ['Sobremesas / Tortas / Chocolates'],
      suggestedTeaId: 'doce-amendoa',
      suggestedTeaName: 'Doce Amêndoa (Infusão)',
      pairingNotes: language === 'en'
        ? 'Warm baked apple, cinnamon, and toasted almonds wrap sweet finishes in comforting dessert indulgence.'
        : 'Maçã assada com amêndoas tostadas e canela em infusão rubi aveludada, sem cafeína para fechar a noite com conforto.',
      serviceRitual: '100°C · 5 a 8 minutos, ideal servido na xícara de vidro duplo.',
    });
  }

  // General / Digestif -> Gengibre Fresh
  if (categories.length === 0 || text.includes('café') || text.includes('chá') || text.includes('digestivo')) {
    categories.push({
      categoryName: language === 'en' ? 'Signature Tea Pairing' : language === 'es' ? 'Armonización de Autor' : 'Harmonização de Assinatura',
      itemsFound: ['Carta Geral & Pós-Refeição'],
      suggestedTeaId: 'gengibre-fresh',
      suggestedTeaName: 'Gengibre Fresh (Infusão)',
      pairingNotes: language === 'en'
        ? 'Zesty ginger, lemongrass, and mint deliver an invigorating digestive experience.'
        : 'Ação digestiva intensa com frescor de hortelã e capim-limão sobre base de gengibre nobre.',
      serviceRitual: '100°C · 5 a 6 minutos no Vapt Vupt transparente.',
    });
  }

  logAudit('MENU_ANALYZED_HEURISTIC', { categoriesCount: categories.length });
  res.json({ aiUsed: false, categories });
});

// IA Sommelier Chat Widget Endpoint (Gemini 3.8 Flash)
app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Mensagem vazia' });
  }

  logAudit('CHAT_MESSAGE_RECEIVED', { length: message.length });

  const systemInstruction = `Você é o Sommelier Consultor B2B da Talchá (marca pioneira em chás especiais e blends autorais no Brasil desde 2010).
Seu papel é orientar proprietários, sommeliers, gerentes e chefs de restaurantes, hotéis, confeitarias e eventos sobre:
1. Catálogo de Chás Nobres Talchá:
   - Chás Pretos: Earl Grey (bergamota cítrica prensada a frio, Ceilão; harmoniza com carnes nobres, massas densas, chocolates amargos).
   - Chás Verdes: Cherry Rose (Sencha japonês com cereja selvagem e pétalas de rosa; frescor vegetal ideal para sushis, peixes, ceviches, saladas).
   - Infusões sem cafeína: Doce Amêndoa (maçã, amêndoas caramelizadas, canela; ideal para sobremesas quentes e fondue), Gengibre Fresh (digestivo revigorante com hortelã e capim-limão), Vermelho Intenso (hibisco, morango, framboesa; excelente para coquetelaria e drinks gelados).
   - Linha Longevidade: Ritual do Sono (camomila, melissa, lavanda), Relaxa, Foco, Energia, Imunidade, Desinflama, Spice Detox.
   - Linha RTD: Chás especiais gaseificados em lata 269ml de baixa caloria.
2. Equipamentos e Rituais de Serviço:
   - Preparador Vapt Vupt patenteado (Tritan BPA free 500ml): liberação automática sem pingar ao apoiar no copo.
   - Copos de Vidro Duplo borossilicato térmico: mantêm a temperatura e revelam a cor límpida da infusão.
   - Display de Amostra Olfativa com tubos de vidro: para o cliente cheirar e escolher à mesa.
3. Lucratividade e Negócio B2B:
   - Custo médio por xícara: cerca de R$ 1,45 (com 2g de folha inteira a granel).
   - Preço de venda sugerido: R$ 14,00 a R$ 20,00.
   - Margem bruta: superior a 700% (728%+).
   - Logística ágil para todo o Brasil, MOQ acessível (embalagens de 250g e 500g) e treinamento de brigada incluso.
4. Contato Comercial:
   - WhatsApp Comercial: (11) 92596-3961 (ou wa.me/5511925963961).
   - Flagship física: Shopping Pátio Higienópolis, São Paulo.

Responda sempre em português, de forma concisa (máximo 2 a 3 parágrafos ou tópicos curtos), elegante e profissional. Recomende rituais de temperatura e tempo de infusão quando cabível.`;

  if (ai) {
    try {
      const formattedContents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item && item.text) {
            formattedContents.push({
              role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: String(item.text) }],
            });
          }
        }
      }
      formattedContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: formattedContents,
        config: {
          systemInstruction,
        },
      });

      const replyText = response.text;
      if (replyText) {
        logAudit('CHAT_AI_REPLY_SUCCESS');
        return res.json({ reply: replyText, aiUsed: true });
      }
    } catch (err: any) {
      console.warn('Gemini chat API fallback triggered:', err?.message || err);
    }
  }

  // Smart Sommelier Heuristic Fallback
  const q = message.toLowerCase();
  let fallbackReply = `Olá! Sou o Sommelier Virtual da **Talchá**. Como posso auxiliar na curadoria ou na carta de chás do seu restaurante ou hotel?`;

  if (q.includes('preço') || q.includes('custo') || q.includes('margem') || q.includes('lucro') || q.includes('rentabilidade')) {
    fallbackReply = `A carta de chás especiais da **Talchá** entrega uma das maiores rentabilidades da operação gastronômica:\n\n• **Custo por infusão:** cerca de **R$ 1,45** (base 2g de folha nobre a granel).\n• **Preço sugerido no salão:** R$ 14,00 a R$ 18,00.\n• **Margem líquida:** superior a **700%**.\n\nVocê pode testar seus números na nossa aba **Calculadora** ou falar com nossa equipe comercial no WhatsApp: **(11) 92596-3961**.`;
  } else if (q.includes('vapt') || q.includes('preparador') || q.includes('infusor') || q.includes('ritual') || q.includes('copo')) {
    fallbackReply = `O **Preparador Vapt Vupt** é o padrão de serviço da Talchá à mesa:\n\n• Produzido em **Tritan BPA-free (500ml)**.\n• **Válvula patenteada:** após a infusão, basta apoiá-lo sobre a xícara ou copo de vidro duplo para liberar o chá límpido sem pingar.\n• Junto aos **Copos de Vidro Duplo Borossilicato**, valoriza a apresentação e proporciona retenção térmica impecável.`;
  } else if (q.includes('japonês') || q.includes('sushi') || q.includes('peixe') || q.includes('salmão') || q.includes('ceviche')) {
    fallbackReply = `Para peixes brancos, sushis e frutos do mar, a indicação sommelier é o **Cherry Rose** (Chá Verde Sencha japonês com pétalas de rosa e flor de cerejeira).\n\nPossui frescor vegetal e acidez delicada que limpam as papilas gustativas entre cada bocado. Temperatura ideal: **75°C por 2 a 3 minutos**.`;
  } else if (q.includes('carne') || q.includes('massa') || q.includes('risoto') || q.includes('queijo')) {
    fallbackReply = `Para carnes nobres, massas e pratos mais untuosos, o destaque é o clássico **Earl Grey Especial** (Chá Preto do Ceilão aromatizado com óleo essencial de bergamota prensada a frio).\n\nSua estrutura tânica corta a gordura do prato com refinamento. Serviço sugerido: **95°C por 3 a 4 minutos**.`;
  } else if (q.includes('sobremesa') || q.includes('doce') || q.includes('chocolate') || q.includes('torta')) {
    fallbackReply = `Para sobremesas e confeitaria, a infusão **Doce Amêndoa** é insuperável (maçã desidratada, amêndoas laminadas, canela e beterraba natural).\n\nSem cafeína, traz notas caramelizadas aveludadas que casam perfeitamente com sobremesas quentes e chocolates. Infusão: **100°C por 5 a 8 minutos**.`;
  } else if (q.includes('pedido') || q.includes('comprar') || q.includes('moq') || q.includes('mínimo') || q.includes('entrega') || q.includes('atacado')) {
    fallbackReply = `Nosso modelo B2B foi desenhado para facilitar a operação gastronômica:\n\n• **Pedido Mínimo Flexível:** embalagens de 250g e 500g para salão sem imobilizar capital.\n• **Pronta Entrega:** logística ágil com envios para todo o Brasil.\n• **Fale Conosco:** chame nossa equipe no WhatsApp **(11) 92596-3961** para receber a tabela atacado.`;
  }

  res.json({ reply: fallbackReply, aiUsed: false });
});

// Helper: Extract structured HTTP status & actionable error message from @google/genai errors
function handleGeminiApiError(res: express.Response, err: any, modelName: string) {
  const rawMessage = String(err?.message || err || 'Erro desconhecido na API Gemini');
  const status =
    typeof err?.status === 'number'
      ? err.status
      : rawMessage.includes('403') || rawMessage.includes('PERMISSION_DENIED')
      ? 403
      : rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED')
      ? 429
      : rawMessage.includes('404') || rawMessage.includes('NOT_FOUND')
      ? 404
      : rawMessage.includes('400') || rawMessage.includes('API_KEY_INVALID')
      ? 400
      : 500;

  let friendlyMessage = rawMessage;
  if (status === 403 || status === 400) {
    friendlyMessage =
      `Chave API ausente ou sem permissão para o modelo ${modelName}. Verifique ou selecione uma chave de API com faturamento ativo no painel Settings > Secrets.`;
  } else if (status === 429) {
    friendlyMessage =
      `Cota excedida ao acessar ${modelName}. Se estiver usando o plano gratuito, selecione uma chave de API com faturamento ativo no painel Settings > Secrets.`;
  }

  return res.status(status).json({
    error: friendlyMessage,
    details: rawMessage,
    model: modelName,
    status,
  });
}

// Public runtime config (non-secret browser client configuration)
app.get('/api/config/public-maps', (_req, res) => {
  const mapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
  res.json({
    mapsApiKey,
    hasMapsKey: Boolean(mapsApiKey),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Google Search Grounding (gemini-4-hydrogen)
app.post('/api/gemini/search-grounding', async (req, res) => {
  const { query, teaFocus, language = 'pt' } = req.body || {};
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Informe uma pergunta ou tema de pesquisa.' });
  }
  if (!ai) {
    return res.status(400).json({
      error: 'GEMINI_API_KEY não configurada no servidor. Adicione sua chave em Settings > Secrets.',
      code: 'API_KEY_MISSING',
    });
  }

  try {
    const langInstruction =
      language === 'en'
        ? 'Answer in English.'
        : language === 'es'
        ? 'Responde en español.'
        : 'Responda em português do Brasil.';
    const contextPrefix = teaFocus ? `Foco de curadoria B2B Talchá: ${teaFocus}. ` : '';

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `${contextPrefix}${query.trim()}`,
      config: {
        systemInstruction: `Você é o Master Sommelier e Pesquisador Gastronômico da Talchá B2B. Use o Google Search para trazer dados reais e atualizados sobre terroirs de chá, tendências de hospitalidade, harmonizações gastronômicas e mercado de bebidas artesanais. ${langInstruction} Formate em Markdown limpo e conciso.`,
        tools: [{ googleSearch: {} }],
      },
    });

    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: Array<{ title: string; uri: string }> = [];
    const seen = new Set<string>();
    for (const chunk of rawChunks) {
      if (chunk?.web?.uri && !seen.has(chunk.web.uri)) {
        seen.add(chunk.web.uri);
        sources.push({
          title: chunk.web.title || chunk.web.uri,
          uri: chunk.web.uri,
        });
      }
    }

    logAudit('GEMINI_SEARCH_GROUNDING', { query: query.slice(0, 80), sourcesCount: sources.length });
    return res.json({
      text: response.text || '',
      sources,
      model: 'gemini-4-hydrogen',
    });
  } catch (err: any) {
    return handleGeminiApiError(res, err, 'gemini-4-hydrogen');
  }
});

// Google Maps Grounding (gemini-4-hydrogen)
app.post('/api/gemini/maps-grounding', async (req, res) => {
  const { query, latitude, longitude, language = 'pt' } = req.body || {};
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Informe o tipo de estabelecimento ou região para buscar.' });
  }
  if (!ai) {
    return res.status(400).json({
      error: 'GEMINI_API_KEY não configurada no servidor. Adicione sua chave em Settings > Secrets.',
      code: 'API_KEY_MISSING',
    });
  }

  try {
    const hasCoords =
      typeof latitude === 'number' &&
      Number.isFinite(latitude) &&
      typeof longitude === 'number' &&
      Number.isFinite(longitude);

    const langHint =
      language === 'en'
        ? 'Respond in English.'
        : language === 'es'
        ? 'Responde en español.'
        : 'Responda em português do Brasil.';

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `${langHint} Como consultor B2B da Talchá Chás Especiais, ajude a localizar estabelecimentos reais e referências gastronômicas para a busca: ${query.trim()}`,
      config: {
        tools: [{ googleMaps: {} }],
        ...(hasCoords
          ? {
              toolConfig: {
                retrievalConfig: {
                  latLng: { latitude, longitude },
                },
              },
            }
          : {}),
      },
    });

    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const places: Array<{
      title: string;
      uri: string;
      placeId?: string;
      reviewSnippets: Array<{ title?: string; uri?: string }>;
    }> = [];
    const seen = new Set<string>();

    for (const chunk of rawChunks) {
      const m = (chunk as any)?.maps;
      if (m && (m.uri || m.title)) {
        const key = m.uri || m.title;
        if (!seen.has(key)) {
          seen.add(key);
          const snippetsRaw = m.placeAnswerSources?.reviewSnippets || [];
          const reviewSnippets = Array.isArray(snippetsRaw)
            ? snippetsRaw.map((s: any) => ({
                title: s?.title || s?.text || undefined,
                uri: s?.uri || undefined,
              }))
            : [];
          places.push({
            title: m.title || 'Local no Google Maps',
            uri: m.uri || '',
            placeId: m.placeId,
            reviewSnippets,
          });
        }
      }
    }

    logAudit('GEMINI_MAPS_GROUNDING', { query: query.slice(0, 80), placesCount: places.length });
    return res.json({
      text: response.text || '',
      places,
      model: 'gemini-4-hydrogen',
    });
  } catch (err: any) {
    return handleGeminiApiError(res, err, 'gemini-4-hydrogen');
  }
});

// Image Creation & Editing (gemini-nano-banana-2.1)
app.post('/api/gemini/image', async (req, res) => {
  const {
    prompt,
    aspectRatio = '1:1',
    imageSize = '1K',
    useWebSearch = false,
    useImageSearch = false,
    sourceImageBase64,
    sourceMimeType = 'image/png',
  } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Descreva a cena ou edição desejada para gerar a imagem.' });
  }
  if (!ai) {
    return res.status(400).json({
      error: 'GEMINI_API_KEY não configurada no servidor. Selecione uma chave de API paga em Settings > Secrets para usar gemini-nano-banana-2.1.',
      code: 'API_KEY_MISSING',
    });
  }

  const allowedRatios = new Set(['1:1', '3:4', '4:3', '9:16', '16:9', '1:4', '1:8', '4:1', '8:1']);
  const safeRatio = allowedRatios.has(aspectRatio) ? aspectRatio : '1:1';
  const allowedSizes = new Set(['1K', '2K', '4K']);
  const safeSize = allowedSizes.has(imageSize) ? imageSize : '1K';

  try {
    const parts: any[] = [];
    if (sourceImageBase64 && typeof sourceImageBase64 === 'string') {
      const cleanB64 = sourceImageBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanB64,
          mimeType: sourceMimeType || 'image/png',
        },
      });
    }
    parts.push({ text: prompt.trim() });

    const tools: any[] = [];
    if (useWebSearch || useImageSearch) {
      tools.push({
        googleSearch: {
          searchTypes: {
            ...(useWebSearch ? { webSearch: {} } : {}),
            ...(useImageSearch ? { imageSearch: {} } : {}),
          },
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-nano-banana-2.1',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: safeRatio,
          imageSize: safeSize,
        },
        ...(tools.length > 0 ? { tools } : {}),
      },
    });

    let imageDataUrl = '';
    let captionText = '';
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType ?? 'image/png';
        imageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        captionText += (captionText ? '\n' : '') + part.text;
      }
    }

    if (!imageDataUrl) {
      return res.status(502).json({
        error: 'O modelo não retornou uma imagem para este prompt. Tente ajustar a descrição.',
        text: captionText,
      });
    }

    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: Array<{ title: string; uri: string }> = [];
    for (const chunk of rawChunks) {
      if (chunk?.web?.uri) {
        sources.push({ title: chunk.web.title || chunk.web.uri, uri: chunk.web.uri });
      }
    }

    logAudit('GEMINI_IMAGE_GENERATED', {
      model: 'gemini-nano-banana-2.1',
      aspectRatio: safeRatio,
      imageSize: safeSize,
      isEdit: Boolean(sourceImageBase64),
    });

    return res.json({
      imageDataUrl,
      text: captionText,
      sources,
      model: 'gemini-nano-banana-2.1',
    });
  } catch (err: any) {
    return handleGeminiApiError(res, err, 'gemini-nano-banana-2.1');
  }
});

// Music Generation (lyria-3-clip-preview / lyria-3-pro-preview)
app.post('/api/gemini/music', async (req, res) => {
  const {
    prompt,
    mode = 'clip',
    sourceImageBase64,
    sourceMimeType = 'image/jpeg',
  } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Descreva a atmosfera sonora ou estilo musical desejado.' });
  }

  const model = mode === 'pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';
  if (!ai) {
    return res.status(400).json({
      error: `GEMINI_API_KEY não configurada no servidor. Selecione uma chave de API paga em Settings > Secrets para usar ${model}.`,
      code: 'API_KEY_MISSING',
    });
  }

  try {
    const contents: any =
      sourceImageBase64 && typeof sourceImageBase64 === 'string'
        ? {
            parts: [
              { text: prompt.trim() },
              {
                inlineData: {
                  data: sourceImageBase64.replace(/^data:[^;]+;base64,/, ''),
                  mimeType: sourceMimeType || 'image/jpeg',
                },
              },
            ],
          }
        : prompt.trim();

    const response = await ai.models.generateContentStream({
      model,
      contents,
    });

    const audioChunks: Buffer[] = [];
    let lyrics = '';
    let mimeType = 'audio/mpeg';

    for await (const chunk of response) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (audioChunks.length === 0 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioChunks.push(Buffer.from(part.inlineData.data, 'base64'));
        }
        if (part.text) {
          lyrics += part.text;
        }
      }
    }

    if (audioChunks.length === 0) {
      return res.status(502).json({
        error: 'Nenhuma faixa de áudio foi retornada pelo modelo. Tente ajustar o prompt musical.',
        lyrics,
      });
    }

    const audioBase64 = Buffer.concat(audioChunks).toString('base64');
    const audioDataUrl = `data:${mimeType};base64,${audioBase64}`;

    logAudit('GEMINI_MUSIC_GENERATED', { model, bytes: audioBase64.length });
    return res.json({
      audioDataUrl,
      mimeType,
      lyrics,
      model,
    });
  } catch (err: any) {
    return handleGeminiApiError(res, err, model);
  }
});

// Static files and Vite integration
async function startServer() {
  const isNoCachePath = (p: string) =>
    p === '/' ||
    p === '/index.html' ||
    p === '/sw.js' ||
    p.endsWith('/index-B-h_qskT.js') ||
    p.endsWith('index-B-h_qskT.js') ||
    p.endsWith('index-xYMwszd6.css') ||
    p.includes('logo_talcha_');

  const applyNoCacheHeaders = (res: express.Response) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  };

  // Enforce fresh no-store headers on entry shell, SW, logos, and patched app bundle
  app.use((req, res, next) => {
    if (isNoCachePath(req.path)) {
      applyNoCacheHeaders(res);
    }
    next();
  });

  // Explicitly serve static assets from public/ and public/assets/
  const publicDir = path.resolve(process.cwd(), 'public');
  app.use(express.static(publicDir, {
    setHeaders: (res, filePath) => {
      if (isNoCachePath(filePath)) applyNoCacheHeaders(res);
    }
  }));
  app.use('/assets', express.static(path.join(publicDir, 'assets'), {
    setHeaders: (res, filePath) => {
      if (isNoCachePath(filePath)) applyNoCacheHeaders(res);
    }
  }));

  if (isDev) {
    const vitePromise = import('vite')
      .then(({ createServer: createViteServer }) =>
        createViteServer({
          server: {
            middlewareMode: true,
            hmr: false,
          },
          appType: 'spa',
        })
      )
      .catch((err) => {
        console.error('[Talchápidia B2B Server] Vite dev middleware initialization failed:', err);
        return null;
      });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        if (vite) {
          return vite.middlewares(req, res, next);
        }
      } catch (err) {
        return next(err);
      }
      return next();
    });

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      applyNoCacheHeaders(res);
      return res.sendFile(path.resolve(process.cwd(), 'index.html'));
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (isNoCachePath(filePath)) applyNoCacheHeaders(res);
      }
    }));
    app.get('*', (req, res) => {
      applyNoCacheHeaders(res);
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Talchápidia B2B Server] Running at http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('[Talchápidia B2B Server] Listen error:', err);
    process.exitCode = 1;
  });
}

startServer();
