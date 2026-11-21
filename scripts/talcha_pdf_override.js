/**
 * Official Talchá Editorial PDF Brand System (Shared Helpers + PM + j9)
 * Injected into public/assets/index-B-h_qskT.js via scripts/build_patched_bundle.cjs.
 * Matches Talchá's authentic brand palette (#FAF7F2 Warm Cream, #8B2635 Deep Burgundy,
 * #C68A36 Brushed Gold, #2E6B34 Botanical Green, #1E1B18 Charcoal Ink) and embeds the
 * official Talchá PNG wordmark + teacup emblem alongside optional Client Co-Branding.
 */

function talchaGetClientLogo(explicitUrl) {
  let lg = explicitUrl || null;
  if (!lg && typeof localStorage !== 'undefined') {
    try {
      lg = localStorage.getItem('talcha_carta_client_logo');
    } catch {}
  }
  return typeof lg === 'string' && lg.startsWith('data:image/') ? lg : null;
}

function talchaDrawCheckDot(doc, cx, cy, radius, bgCol) {
  doc.setFillColor(bgCol[0] ?? bgCol.r, bgCol[1] ?? bgCol.g, bgCol[2] ?? bgCol.b);
  doc.circle(cx, cy, radius, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.line(cx - radius * 0.42, cy + radius * 0.05, cx - radius * 0.1, cy + radius * 0.36);
  doc.line(cx - radius * 0.1, cy + radius * 0.36, cx + radius * 0.45, cy - radius * 0.32);
}

function talchaAddAspectLogo(doc, imgData, fmt, x, y, boxW, boxH) {
  try {
    let natW = 300;
    let natH = 150;
    if (typeof doc.getImageProperties === 'function') {
      const props = doc.getImageProperties(imgData);
      if (props && props.width > 0 && props.height > 0) {
        natW = props.width;
        natH = props.height;
      }
    }
    const scale = Math.min(boxW / natW, boxH / natH);
    const drawW = natW * scale;
    const drawH = natH * scale;
    const drawX = x + (boxW - drawW) / 2;
    const drawY = y + (boxH - drawH) / 2;
    doc.addImage(imgData, fmt, drawX, drawY, drawW, drawH, undefined, 'FAST');
    return true;
  } catch {
    return false;
  }
}

function talchaDrawClientCrest(doc, clientLogo, x, y, w, h, darkHeader, borderCol) {
  if (!clientLogo) return;
  try {
    const fmt = clientLogo.includes('image/png')
      ? 'PNG'
      : clientLogo.includes('image/webp')
        ? 'WEBP'
        : 'JPEG';
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, h, 1.8, 1.8, 'F');
    doc.setDrawColor(
      darkHeader ? 198 : (borderCol?.r ?? 198),
      darkHeader ? 138 : (borderCol?.g ?? 138),
      darkHeader ? 54 : (borderCol?.b ?? 54)
    );
    doc.setLineWidth(0.32);
    doc.roundedRect(x, y, w, h, 1.8, 1.8, 'S');
    talchaAddAspectLogo(doc, clientLogo, fmt, x + 2, y + 1.2, w - 4, h - 2.4);
  } catch {}
}

function talchaDrawEditorialBanner(doc, options = {}) {
  const {
    subtitle = 'CHÁS ESPECIAIS & ALTA GASTRONOMIA',
    curationTag = 'Curadoria Oficial B2B · Origens Nobres desde 2010',
    badge = 'DOCUMENTO OFICIAL B2B',
    venueName = '',
    clientLogo = null,
    cleanPrint = false,
    darkTheme = false,
    issuedDate = '',
  } = options;

  const lg = talchaGetClientLogo(clientLogo);

  if (darkTheme) {
    // Noir editorial masthead for printed Noir table menus
    doc.setFillColor(24, 21, 18);
    doc.rect(0, 0, 210, 31, 'F');
    doc.setFillColor(198, 138, 54);
    doc.rect(0, 31, 210, 0.7, 'F');

    if (!talchaAddAspectLogo(doc, TALCHA_LOGO_WHITE, 'PNG', 14, 7, 32, 16)) {
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(248, 246, 242);
      doc.text('talchá', 14, 17);
    }

    doc.setDrawColor(198, 138, 54);
    doc.setLineWidth(0.3);
    doc.line(49, 8.2, 49, 22.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.1);
    doc.setTextColor(212, 172, 126);
    doc.text(subtitle, 53, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(196, 188, 176);
    doc.text(venueName ? `${venueName} · www.talcha.com.br` : curationTag, 53, 18);

    if (lg) {
      talchaDrawClientCrest(doc, lg, 154, 5.4, 42, 16.5, true);
      if (issuedDate) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(180, 172, 160);
        doc.text(issuedDate, 196, 26.2, { align: 'right' });
      }
    } else {
      doc.setFillColor(139, 38, 53);
      doc.roundedRect(148, 8, 48, 7, 1.3, 1.3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.4);
      doc.setTextColor(255, 255, 255);
      doc.text(String(badge).toUpperCase(), 172, 12.5, { align: 'center' });
      if (issuedDate) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(180, 172, 160);
        doc.text(issuedDate, 196, 20.8, { align: 'right' });
      }
    }
    return 37;
  }

  if (!cleanPrint) {
    // Signature Talchá Warm Cream + Deep Burgundy (#8B2635) + Gold (#C68A36) Official Masthead
    doc.setFillColor(139, 38, 53);
    doc.rect(0, 0, 210, 3.6, 'F');
    doc.setFillColor(198, 138, 54);
    doc.rect(0, 3.6, 210, 0.7, 'F');

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 4.3, 210, 25.5, 'F');
    doc.setDrawColor(229, 218, 203);
    doc.setLineWidth(0.35);
    doc.line(0, 29.8, 210, 29.8);

    if (!talchaAddAspectLogo(doc, TALCHA_LOGO_BLACK, 'PNG', 14, 8.2, 32, 16)) {
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 27, 24);
      doc.text('talchá', 14, 18);
    }

    doc.setDrawColor(198, 138, 54);
    doc.setLineWidth(0.32);
    doc.line(49, 9.2, 49, 23.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(139, 38, 53);
    doc.text(subtitle, 53, 13.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(105, 98, 86);
    doc.text(venueName ? `${venueName} · www.talcha.com.br` : curationTag, 53, 18.6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.1);
    doc.setTextColor(148, 98, 28);
    doc.text('www.talcha.com.br  ·  Alta Gastronomia & Hotelaria', 53, 22.9);

    if (lg) {
      talchaDrawClientCrest(doc, lg, 154, 6.6, 42, 16.4, false);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.6);
      doc.setTextColor(148, 98, 28);
      doc.text(
        issuedDate ? `CO-BRANDING OFICIAL  ·  ${issuedDate}` : 'CO-BRANDING OFICIAL TALCHÁ',
        196,
        26.8,
        { align: 'right' }
      );
    } else {
      doc.setFillColor(139, 38, 53);
      doc.roundedRect(148, 8.8, 48, 6.8, 1.4, 1.4, 'F');
      doc.setDrawColor(198, 138, 54);
      doc.setLineWidth(0.26);
      doc.roundedRect(148, 8.8, 48, 6.8, 1.4, 1.4, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.3);
      doc.setTextColor(255, 255, 255);
      doc.text(String(badge).toUpperCase(), 172, 13.1, { align: 'center' });
      if (issuedDate) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.3);
        doc.setTextColor(105, 98, 86);
        doc.text(issuedDate, 196, 21.6, { align: 'right' });
      }
    }
    return 36;
  }

  // Clean Print mode (economical ink on pure white)
  doc.setFillColor(139, 38, 53);
  doc.rect(0, 0, 210, 1.8, 'F');
  if (!talchaAddAspectLogo(doc, TALCHA_LOGO_BLACK, 'PNG', 14, 5.8, 30, 15)) {
    doc.setFont('times', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(30, 27, 24);
    doc.text('talchá', 14, 15);
  }
  doc.setDrawColor(210, 202, 192);
  doc.setLineWidth(0.28);
  doc.line(47, 7, 47, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(139, 38, 53);
  doc.text(subtitle, 51, 11.8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.3);
  doc.setTextColor(105, 98, 86);
  doc.text(venueName ? `${venueName} · www.talcha.com.br` : curationTag, 51, 16.5);
  if (lg) {
    talchaDrawClientCrest(doc, lg, 154, 4.6, 42, 15.6, false);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.6);
    doc.setTextColor(139, 38, 53);
    doc.text(String(badge).toUpperCase(), 196, 12, { align: 'right' });
    if (issuedDate) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.3);
      doc.setTextColor(105, 98, 86);
      doc.text(issuedDate, 196, 17, { align: 'right' });
    }
  }
  doc.setDrawColor(139, 38, 53);
  doc.setLineWidth(0.32);
  doc.line(14, 24.5, 196, 24.5);
  return 31;
}

function talchaDrawContinuationHeader(doc, options = {}) {
  const {
    subtitle = 'TALCHÁ · DOCUMENTO OFICIAL B2B',
    venueName = '',
    clientLogo = null,
    cleanPrint = false,
    darkTheme = false,
  } = options;

  const lg = talchaGetClientLogo(clientLogo);

  if (darkTheme) {
    doc.setFillColor(24, 21, 18);
    doc.rect(0, 0, 210, 14.5, 'F');
    doc.setFillColor(198, 138, 54);
    doc.rect(0, 14.5, 210, 0.5, 'F');
    talchaAddAspectLogo(doc, TALCHA_LOGO_WHITE, 'PNG', 14, 2.5, 19, 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(212, 172, 126);
    doc.text(`·  ${subtitle}`, 35.5, 8.7);
    if (lg) {
      talchaDrawClientCrest(doc, lg, 168, 2.2, 28, 10, true);
    } else if (venueName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(248, 246, 242);
      doc.text(venueName.toUpperCase(), 196, 8.7, { align: 'right' });
    }
    return 21;
  }

  if (!cleanPrint) {
    doc.setFillColor(139, 38, 53);
    doc.rect(0, 0, 210, 2.2, 'F');
    doc.setFillColor(198, 138, 54);
    doc.rect(0, 2.2, 210, 0.5, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 2.7, 210, 13.8, 'F');
    doc.setDrawColor(229, 218, 203);
    doc.setLineWidth(0.3);
    doc.line(0, 16.5, 210, 16.5);

    talchaAddAspectLogo(doc, TALCHA_LOGO_BLACK, 'PNG', 14, 4.6, 20, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.1);
    doc.setTextColor(139, 38, 53);
    doc.text(`·  ${subtitle}`, 36.5, 11);

    if (lg) {
      talchaDrawClientCrest(doc, lg, 168, 3.8, 28, 11, false);
    } else if (venueName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.1);
      doc.setTextColor(105, 98, 86);
      doc.text(venueName.toUpperCase(), 196, 11, { align: 'right' });
    }
    return 23;
  }

  talchaAddAspectLogo(doc, TALCHA_LOGO_BLACK, 'PNG', 14, 4.5, 19, 9.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(139, 38, 53);
  doc.text(`·  ${subtitle}`, 35.5, 10.6);
  if (lg) {
    talchaDrawClientCrest(doc, lg, 168, 3.5, 28, 10.5, false);
  } else if (venueName) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 27, 24);
    doc.text(venueName.toUpperCase(), 196, 10.6, { align: 'right' });
  }
  doc.setDrawColor(215, 212, 206);
  doc.setLineWidth(0.3);
  doc.line(14, 16, 196, 16);
  return 22;
}

function PM(doc, cx, topY, opts = {}) {
  const {
    scale = 1,
    showSubtext = true,
    venueName = '',
    primaryColor = [139, 38, 53],
    accentColor = [198, 138, 54],
    textColor = [30, 27, 24],
    theme = 'marfim',
    language = 'pt',
    clientLogoDataUrl = null,
  } = opts;

  const isNoir = theme === 'noir';
  const isLeftAligned = cx < 60;
  const logoW = 34 * scale;
  const logoH = 17 * scale;
  const clientLogo = talchaGetClientLogo(clientLogoDataUrl);
  const logoSrc = isNoir ? TALCHA_LOGO_WHITE : TALCHA_LOGO_BLACK;

  let curY = topY + logoH + 3 * scale;

  if (!isLeftAligned && clientLogo) {
    const gap = 8 * scale;
    const crestW = 38 * scale;
    const crestH = 15 * scale;
    const totalW = logoW + gap + crestW;
    const startX = cx - totalW / 2;

    if (!talchaAddAspectLogo(doc, logoSrc, 'PNG', startX, topY, logoW, logoH)) {
      doc.setFont('times', 'bold');
      doc.setFontSize(16 * scale);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('talchá', startX, topY + 10 * scale);
    }

    const divX = startX + logoW + gap / 2;
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.35 * scale);
    doc.line(divX, topY + 2 * scale, divX, topY + logoH - 2 * scale);

    talchaDrawClientCrest(
      doc,
      clientLogo,
      startX + logoW + gap,
      topY + (logoH - crestH) / 2,
      crestW,
      crestH,
      isNoir
    );
  } else {
    const logoX = isLeftAligned ? 14 : cx - logoW / 2;
    if (!talchaAddAspectLogo(doc, logoSrc, 'PNG', logoX, topY, logoW, logoH)) {
      doc.setFont('times', 'bold');
      doc.setFontSize(16 * scale);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('talchá', isLeftAligned ? 14 : cx, topY + 10 * scale, {
        align: isLeftAligned ? 'left' : 'center',
      });
    }
  }

  const alignOpt = isLeftAligned ? { align: 'left' } : { align: 'center' };
  const textX = isLeftAligned ? 14 : cx;

  if (showSubtext) {
    const sub =
      language === 'en'
        ? 'SPECIALTY TEAS & FINE HOSPITALITY'
        : language === 'es'
          ? 'TÉS ESPECIALES & ALTA GASTRONOMÍA'
          : 'CHÁS ESPECIAIS • ALTA GASTRONOMIA';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5 * scale);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(sub, textX, curY, alignOpt);
    curY += 3.8 * scale;
  }

  if (venueName && venueName.trim().length > 0) {
    const venueLine =
      language === 'en'
        ? `CURATED FOR ${venueName.trim().toUpperCase()}`
        : language === 'es'
          ? `CURADURÍA PARA ${venueName.trim().toUpperCase()}`
          : `CURADORIA PARA ${venueName.trim().toUpperCase()}`;
    doc.setFont('times', 'italic');
    doc.setFontSize(8 * scale);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(venueLine, textX, curY, alignOpt);
    curY += 3.8 * scale;

    if (!isLeftAligned) {
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.3 * scale);
      doc.line(cx - 22 * scale, curY, cx + 22 * scale, curY);
      curY += 3 * scale;
    }
  }

  return curY;
}

function j9(e) {
  const t = e.language || 'pt';
  const isCleanPrint = (e.theme || 'editorial') === 'clean_print';
  const mode = e.mode || 'executive';
  const doc = new VA({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Authentic Talchá Brand Palette
  const inkBlack = { r: 30, g: 27, b: 24 };
  const inkCharcoal = { r: 42, g: 37, b: 33 };
  const inkMuted = { r: 105, g: 98, b: 86 };
  const gold = { r: 198, g: 138, b: 54 };
  const goldDeep = { r: 148, g: 98, b: 28 };
  const wine = { r: 139, g: 38, b: 53 };
  const green = { r: 23, g: 51, b: 34 };
  const greenBright = { r: 46, g: 107, b: 52 };
  const spice = { r: 160, g: 92, b: 44 };

  const paperBg = isCleanPrint ? { r: 255, g: 255, b: 255 } : { r: 250, g: 247, b: 242 };
  const cardBg = { r: 255, g: 255, b: 255 };
  const borderCol = isCleanPrint ? { r: 215, g: 212, b: 206 } : { r: 229, g: 218, b: 203 };
  const softFill = isCleanPrint ? { r: 248, g: 248, b: 248 } : { r: 245, g: 239, b: 228 };

  const m = {
    pt: {
      brandSub: 'CHÁS ESPECIAIS & ALTA GASTRONOMIA',
      officialBadge: 'Documento Oficial B2B',
      customerMenuBadge: 'Carta de Chás Especiais',
      issuedOn: 'Emissão',
      curationTag: 'Curadoria Sensorial & Arquitetura de Salão',
      partnerVenue: 'Estabelecimento Parceiro',
      segment: 'Segmento',
      audience: 'Perfil do Salão',
      operationalParams: 'Parâmetros de Serviço',
      peakHours: 'Operação',
      baseMenu: 'Destaques',
      vaptVuptDesc: 'Serviço no Infusor Vapt Vupt com amostra olfativa à mesa',
      strategicRationale: 'Conceito Gastronômico da Carta',
      selectedBlends: 'Seleção de Blends Nobres',
      itemsCount: 'chás selecionados',
      extractionAndService: 'Ritual de Infusão',
      temp: 'Temp.',
      time: 'Tempo',
      pairings: 'Harmoniza com',
      ingredients: 'Notas Botânicas',
      page: 'Página',
      of: 'de',
      footerContact: `Talchá Chás Especiais · www.talcha.com.br · ${aC.email} · ${aC.phone}`,
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
      ritual1Title: '1. Amostra Olfativa',
      ritual1Desc: 'Apresentação dos tubos olfativos para o cliente sentir o aroma seco das folhas.',
      ritual2Title: '2. Dosagem 2g',
      ritual2Desc: '1 colher dosadora (2g) de folhas inteiras depositada no infusor cristalino.',
      ritual3Title: '3. Extração Precisa',
      ritual3Desc: 'Água na temperatura ideal permitindo expansão livre sem amargor.',
      ritual4Title: '4. Serviço por Gravidade',
      ritual4Desc: 'Ao apoiar sobre a xícara, o chá filtra instantaneamente por gravidade.',
      sec3Title: '3. Diferenciais da Parceria Talchá B2B',
      comodatoTitle: 'Infusores em Comodato',
      comodatoDesc: 'Equipamentos Vapt Vupt e tubos olfativos fornecidos conforme volume mensal.',
      trainingTitle: 'Treinamento da Brigada',
      trainingDesc: 'Capacitação presencial ou online de garçons, maîtres e baristas do salão.',
      certificationTitle: 'Origem & Certificações',
      certificationDesc: 'Colheitas de alta altitude, lotes frescos e parcerias Rainforest & Fairtrade.',
      partnersTitle: 'Presente nos Maiores Nomes da Alta Gastronomia e Hotelaria',
      supportTitle: 'Atendimento Comercial B2B Dedicado',
      supportSub: 'Consultoria de Contas · Kit de Amostras & Tabela Corporativa',
      supportDesc: 'Solicite prova sensorial sem compromisso, condições para rede e enxoval personalizado.',
    },
    en: {
      brandSub: 'SPECIALTY TEAS & FINE HOSPITALITY',
      officialBadge: 'Official B2B Dossier',
      customerMenuBadge: 'Specialty Tea Menu',
      issuedOn: 'Issued',
      curationTag: 'Sensory Curation & Dining Room Architecture',
      partnerVenue: 'Partner Establishment',
      segment: 'Segment',
      audience: 'Guest Profile',
      operationalParams: 'Service Parameters',
      peakHours: 'Service Hours',
      baseMenu: 'Highlights',
      vaptVuptDesc: 'Tableside Vapt Vupt Gravity Brewer with dry-leaf aroma display',
      strategicRationale: 'Gastronomic Curation Concept',
      selectedBlends: 'Curated Noble Blends',
      itemsCount: 'selected teas',
      extractionAndService: 'Steeping Ritual',
      temp: 'Temp.',
      time: 'Time',
      pairings: 'Pairs with',
      ingredients: 'Botanical Notes',
      page: 'Page',
      of: 'of',
      footerContact: `Talchá Specialty Teas · www.talcha.com.br · ${aC.email} · ${aC.phone}`,
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
      ritual1Title: '1. Aroma Display',
      ritual1Desc: 'Dry-leaf aroma vials presented tableside for sensory discovery.',
      ritual2Title: '2. Precision 2g Scoop',
      ritual2Desc: '1 calibrated scoop (2g) placed inside the clear gravity steeping chamber.',
      ritual3Title: '3. Calibrated Steep',
      ritual3Desc: 'Temperature-calibrated water lets whole leaves unfurl without bitterness.',
      ritual4Title: '4. Gravity Pour',
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
      supportSub: 'Commercial Specialist · Tasting Kit & Wholesale Tiers',
      supportDesc: 'Complimentary tasting samples, group pricing, and branded menu support.',
    },
    es: {
      brandSub: 'TÉS ESPECIALES & ALTA GASTRONOMÍA',
      officialBadge: 'Dossier Oficial B2B',
      customerMenuBadge: 'Carta de Tés Especiales',
      issuedOn: 'Emisión',
      curationTag: 'Curaduría Sensorial & Arquitectura de Sala',
      partnerVenue: 'Establecimiento Asociado',
      segment: 'Segmento',
      audience: 'Perfil de Sala',
      operationalParams: 'Parámetros de Servicio',
      peakHours: 'Operación',
      baseMenu: 'Destacados',
      vaptVuptDesc: 'Servicio en Infusor Vapt Vupt con muestra olfativa en mesa',
      strategicRationale: 'Concepto Gastronómico de la Carta',
      selectedBlends: 'Selección de Blends Nobles',
      itemsCount: 'tés seleccionados',
      extractionAndService: 'Ritual de Infusión',
      temp: 'Temp.',
      time: 'Tiempo',
      pairings: 'Marida con',
      ingredients: 'Notas Botánicas',
      page: 'Página',
      of: 'de',
      footerContact: `Talchá Tés Especiales · www.talcha.com.br · ${aC.email} · ${aC.phone}`,
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
      ritual1Title: '1. Muestra Olfativa',
      ritual1Desc: 'Tubos aromáticos para que el comensal aprecie el perfume de las hojas.',
      ritual2Title: '2. Dosificación 2g',
      ritual2Desc: '1 cuchara dosificadora (2g) de hebras enteras en el infusor transparente.',
      ritual3Title: '3. Extracción Exacta',
      ritual3Desc: 'Agua a temperatura calibrada para liberar aceites sin astringencia.',
      ritual4Title: '4. Vertido por Gravedad',
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
      supportSub: 'Asesor Comercial · Kit de Cata & Lista Corporativa',
      supportDesc: 'Envío de muestras de cata, tarifas por volumen y carta personalizada.',
    },
  }[t] || {};

  const localeStr = t === 'en' ? 'en-US' : t === 'es' ? 'es-ES' : 'pt-BR';
  const issuedDate = new Date().toLocaleDateString(localeStr, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const venueName =
    (e.establishmentName || '').trim() ||
    (t === 'en'
      ? 'Partner Establishment'
      : t === 'es'
        ? 'Establecimiento Asociado'
        : 'Estabelecimento Parceiro');

  const safeFilename = `${
    t === 'en' ? 'Talcha_Tea_Menu_' : t === 'es' ? 'Talcha_Carta_de_Te_' : 'Talcha_Carta_de_Chas_'
  }${venueName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

  const clientLogo = talchaGetClientLogo(e.clientLogoDataUrl);

  const getCategoryAccent = (category) => {
    const raw = (category || '').toLowerCase();
    if (raw.includes('verde') || raw.includes('green') || raw.includes('branco') || raw.includes('white') || raw.includes('oolong')) {
      return greenBright;
    }
    if (raw.includes('hibisc') || raw.includes('misto') || raw.includes('matcha') || raw.includes('preto') || raw.includes('black') || raw.includes('negro')) {
      return wine;
    }
    if (raw.includes('rooibos') || raw.includes('infus') || raw.includes('herbal')) {
      return spice;
    }
    return goldDeep;
  };

  const paintPageBg = () => {
    doc.setFillColor(paperBg.r, paperBg.g, paperBg.b);
    doc.rect(0, 0, 210, 297, 'F');
  };

  const applyAllFooters = () => {
    const finalCount =
      typeof doc.getNumberOfPages === 'function'
        ? doc.getNumberOfPages()
        : doc.internal.getNumberOfPages();
    for (let pg = 1; pg <= finalCount; pg++) {
      doc.setPage(pg);
      doc.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
      doc.setLineWidth(0.28);
      doc.line(14, 284, 196, 284);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(inkMuted.r, inkMuted.g, inkMuted.b);
      doc.text(m.footerContact, 14, 289);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(wine.r, wine.g, wine.b);
      doc.text(`${m.page} ${pg} ${m.of} ${finalCount}`, 196, 289, { align: 'right' });
    }
  };

  paintPageBg();
  let y = talchaDrawEditorialBanner(doc, {
    subtitle: m.brandSub,
    curationTag: m.curationTag,
    badge: mode === 'executive' ? m.officialBadge : m.customerMenuBadge,
    venueName,
    clientLogo,
    cleanPrint: isCleanPrint,
    issuedDate: `${m.issuedOn}: ${issuedDate}`,
  }) + 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(wine.r, wine.g, wine.b);
  doc.text(m.curationTag.toUpperCase(), 14, y);
  y += 5.5;

  doc.setFont('times', 'bold');
  doc.setFontSize(17.5);
  doc.setTextColor(inkBlack.r, inkBlack.g, inkBlack.b);
  const titleLines = doc.splitTextToSize(
    e.cartaTitle || `${m.customerMenuBadge} — ${venueName}`,
    182
  );
  doc.text(titleLines, 14, y);
  y += titleLines.length * 6.2;

  if (e.cartaSubtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(inkMuted.r, inkMuted.g, inkMuted.b);
    const subLines = doc.splitTextToSize(e.cartaSubtitle, 182);
    doc.text(subLines.slice(0, 2), 14, y);
    y += Math.min(2, subLines.length) * 4.2 + 2.5;
  } else {
    y += 2;
  }

  const segLabel =
    t === 'en'
      ? e.businessType === 'Restaurante'
        ? 'Restaurant / Bistro'
        : e.businessType === 'Cafeteria'
          ? 'Coffee Shop & Bakery'
          : e.businessType === 'Hotel'
            ? 'Hotel & Hospitality'
            : e.businessType === 'Spa'
              ? 'Spa & Wellness'
              : e.businessType === 'Empório'
                ? 'Gourmet Retail'
                : e.businessType || 'Hospitality'
      : t === 'es'
        ? e.businessType === 'Cafeteria'
          ? 'Cafetería & Panadería'
          : e.businessType === 'Empório'
            ? 'Tienda Gourmet'
            : e.businessType || 'Gastronomía'
        : e.businessType || 'Hospitalidade';

  const defaultPeak =
    t === 'en' ? 'Lunch & Dinner' : t === 'es' ? 'Almuerzo & Cena' : 'Almoço & Jantar';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  const leftMetaLines = doc.splitTextToSize(
    `${m.segment}: ${segLabel}  ·  ${m.audience}: ${e.audienceProfile || '-'}`,
    78
  );
  const peakLines = doc.splitTextToSize(
    `${m.peakHours}: ${e.operatingHours || defaultPeak}`,
    82
  );
  const hlLines = doc.splitTextToSize(
    `${m.baseMenu}: ${e.menuHighlights || 'Folhas Inteiras & Infusões'}`,
    82
  );
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const ritualLines = doc.splitTextToSize(m.vaptVuptDesc, 78);

  const leftColH = 12 + leftMetaLines.length * 3.6;
  const rightColH = 7 + (peakLines.length + hlLines.length) * 3.5 + ritualLines.length * 3.5 + 3;
  const infoBoxH = Math.max(24, leftColH, rightColH);

  doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
  doc.roundedRect(14, y, 182, infoBoxH, 2, 2, 'F');
  doc.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, 182, infoBoxH, 2, 2, 'S');
  doc.setFillColor(wine.r, wine.g, wine.b);
  doc.rect(14, y + 2, 1.5, infoBoxH - 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(wine.r, wine.g, wine.b);
  doc.text(m.partnerVenue.toUpperCase(), 19, y + 5.2);

  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(inkBlack.r, inkBlack.g, inkBlack.b);
  const venueLines = doc.splitTextToSize(venueName, 80);
  doc.text(venueLines[0] || venueName, 19, y + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(inkMuted.r, inkMuted.g, inkMuted.b);
  doc.text(leftMetaLines.slice(0, 2), 19, y + 15.2);

  doc.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
  doc.setLineWidth(0.25);
  doc.line(103, y + 3.5, 103, y + infoBoxH - 3.5);

  let ry = y + 5.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(wine.r, wine.g, wine.b);
  doc.text(m.operationalParams.toUpperCase(), 107, ry);
  ry += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(inkCharcoal.r, inkCharcoal.g, inkCharcoal.b);
  doc.text(peakLines.slice(0, 1), 107, ry);
  ry += 4;

  doc.setTextColor(inkMuted.r, inkMuted.g, inkMuted.b);
  doc.text(hlLines.slice(0, 2), 107, ry);
  ry += Math.min(2, hlLines.length) * 3.6 + 1;

  talchaDrawCheckDot(doc, 109, ry - 0.8, 1.7, greenBright);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(green.r, green.g, green.b);
  doc.text(ritualLines.slice(0, 2), 112.5, ry);

  y += infoBoxH + 5;

  if (e.strategicRationale) {
    doc.setFont('times', 'italic');
    doc.setFontSize(8.2);
    const ratLines = doc.splitTextToSize(e.strategicRationale, 170).slice(0, 3);
    const ratH = Math.max(13, 7 + ratLines.length * 3.8);
    doc.setFillColor(softFill.r, softFill.g, softFill.b);
    doc.roundedRect(14, y, 182, ratH, 1.6, 1.6, 'F');
    doc.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
    doc.setLineWidth(0.28);
    doc.roundedRect(14, y, 182, ratH, 1.6, 1.6, 'S');
    doc.setFillColor(gold.r, gold.g, gold.b);
    doc.rect(14, y, 1.8, ratH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(goldDeep.r, goldDeep.g, goldDeep.b);
    doc.text(`${m.strategicRationale.toUpperCase()}:`, 19.5, y + 4.5);

    doc.setFont('times', 'italic');
    doc.setFontSize(8.2);
    doc.setTextColor(inkCharcoal.r, inkCharcoal.g, inkCharcoal.b);
    doc.text(ratLines, 19.5, y + 8.8);

    y += ratH + 6;
  }

  const items = Array.isArray(e.items) ? e.items : [];
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(wine.r, wine.g, wine.b);
  doc.text(m.selectedBlends, 14, y);
  const titleW = doc.getTextWidth(m.selectedBlends);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(inkMuted.r, inkMuted.g, inkMuted.b);
  doc.text(`(${items.length} ${m.itemsCount})`, 14 + titleW + 3, y);
  y += 3;
  doc.setDrawColor(wine.r, wine.g, wine.b);
  doc.setLineWidth(0.35);
  doc.line(14, y, 196, y);
  y += 4.5;

  items.forEach((item, idx) => {
    const blend = NM(item.blend, t);
    const catCol = getCategoryAccent(blend.category);
    const catLabel = DM(blend.category, t).toUpperCase();
    const caffLabel = OM(blend.caffeine, t);

    const roleMeta = `${item.roleInMenu ? item.roleInMenu + '  ·  ' : ''}${caffLabel}${
      blend.keyIngredient ? '  ·  ' + blend.keyIngredient : ''
    }`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.1);
    const roleMetaLines = doc.splitTextToSize(roleMeta, 112).slice(0, 2);

    const descStr = `${blend.profileHeadline || ''}${
      blend.foodPairings && blend.foodPairings.length > 0
        ? `  ·  ${m.pairings}: ${blend.foodPairings.slice(0, 2).join(', ')}`
        : ''
    }`;
    doc.setFont('times', 'italic');
    doc.setFontSize(7.9);
    const descLines = doc.splitTextToSize(descStr, 112).slice(0, 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.1);
    const tipLines = doc.splitTextToSize(item.serviceTip || '', 41.5).slice(0, 2);
    const leftNeedH = 11.5 + roleMetaLines.length * 3.5 + descLines.length * 3.6 + 2.4;
    const rightNeedH = 14.5 + tipLines.length * 3.2;
    const cardH = Math.max(23.5, leftNeedH, rightNeedH);

    if (y + cardH > 276) {
      doc.addPage();
      paintPageBg();
      const contSub =
        t === 'en'
          ? `${m.selectedBlends} (Continuation)`
          : t === 'es'
            ? `${m.selectedBlends} (Continuación)`
            : `${m.selectedBlends} (Continuação)`;
      y = talchaDrawContinuationHeader(doc, {
        subtitle: contSub,
        venueName,
        clientLogo,
        cleanPrint: isCleanPrint,
      });
    }

    doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
    doc.roundedRect(14, y, 182, cardH, 1.6, 1.6, 'F');
    doc.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
    doc.setLineWidth(0.28);
    doc.roundedRect(14, y, 182, cardH, 1.6, 1.6, 'S');

    doc.setFillColor(catCol.r, catCol.g, catCol.b);
    doc.rect(14, y + 1.5, 1.6, cardH - 3, 'F');

    doc.setFillColor(wine.r, wine.g, wine.b);
    doc.circle(20.5, y + 6.2, 3.1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(idx < 9 ? `0${idx + 1}` : `${idx + 1}`, 20.5, y + 7.2, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(inkBlack.r, inkBlack.g, inkBlack.b);
    const maxNameW = 86;
    const fittedName = doc.splitTextToSize(blend.name, maxNameW)[0] || blend.name;
    doc.text(fittedName, 26.5, y + 6.4);
    const nameW = doc.getTextWidth(fittedName);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.7);
    const pillW = Math.min(34, doc.getTextWidth(catLabel) + 5);
    const pillX = Math.min(26.5 + nameW + 3, 143 - pillW);
    doc.setFillColor(softFill.r, softFill.g, softFill.b);
    doc.roundedRect(pillX, y + 2.8, pillW, 4.4, 1, 1, 'F');
    doc.setDrawColor(catCol.r, catCol.g, catCol.b);
    doc.setLineWidth(0.22);
    doc.roundedRect(pillX, y + 2.8, pillW, 4.4, 1, 1, 'S');
    doc.setTextColor(catCol.r, catCol.g, catCol.b);
    doc.text(catLabel, pillX + pillW / 2, y + 5.8, { align: 'center' });

    let cy = y + 11.2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.1);
    doc.setTextColor(catCol.r, catCol.g, catCol.b);
    doc.text(roleMetaLines, 26.5, cy);
    cy += roleMetaLines.length * 3.4 + 0.6;

    doc.setFont('times', 'italic');
    doc.setFontSize(7.9);
    doc.setTextColor(inkCharcoal.r, inkCharcoal.g, inkCharcoal.b);
    doc.text(descLines, 26.5, cy);

    const boxX = 147;
    const boxY = y + 2.2;
    const boxW = 46.5;
    const boxH = cardH - 4.4;
    doc.setFillColor(softFill.r, softFill.g, softFill.b);
    doc.roundedRect(boxX, boxY, boxW, boxH, 1.2, 1.2, 'F');
    doc.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
    doc.setLineWidth(0.22);
    doc.roundedRect(boxX, boxY, boxW, boxH, 1.2, 1.2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.1);
    doc.setTextColor(wine.r, wine.g, wine.b);
    doc.text(m.extractionAndService.toUpperCase(), boxX + 2.5, boxY + 4.1);

    const tempVal = blend.brewGuide?.tempC || '90°C';
    const timeVal = blend.brewGuide?.infusionTime || '3 min';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.1);
    doc.setTextColor(inkBlack.r, inkBlack.g, inkBlack.b);
    doc.text(`${tempVal}  ·  ${timeVal}`, boxX + 2.5, boxY + 8.3);

    if (tipLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.1);
      doc.setTextColor(inkMuted.r, inkMuted.g, inkMuted.b);
      doc.text(tipLines, boxX + 2.5, boxY + 12.1);
    }

    y += cardH + 3.2;
  });

  if (mode === 'executive') {
    doc.addPage();
    paintPageBg();
    y = talchaDrawContinuationHeader(doc, {
      subtitle: m.page2Header,
      venueName,
      clientLogo,
      cleanPrint: isCleanPrint,
    });

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(inkBlack.r, inkBlack.g, inkBlack.b);
    doc.text(m.sec1Title, 14, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(inkMuted.r, inkMuted.g, inkMuted.b);
    const sec1Lines = doc.splitTextToSize(m.sec1Desc, 182);
    doc.text(sec1Lines, 14, y);
    y += sec1Lines.length * 3.6 + 3;

    const kpiW = 176 / 3;
    const drawKpi = (x, label, val, sub, isHighlight) => {
      if (isHighlight) {
        doc.setFillColor(green.r, green.g, green.b);
        doc.roundedRect(x, y, kpiW, 22, 1.8, 1.8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(222, 185, 118);
        doc.text(label.toUpperCase(), x + kpiW / 2, y + 5.2, { align: 'center' });
        doc.setFont('times', 'bold');
        doc.setFontSize(14.5);
        doc.setTextColor(255, 255, 255);
        doc.text(val, x + kpiW / 2, y + 12.5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.4);
        doc.setTextColor(218, 232, 220);
        doc.text(sub, x + kpiW / 2, y + 17.5, { align: 'center' });
      } else {
        doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
        doc.roundedRect(x, y, kpiW, 22, 1.8, 1.8, 'F');
        doc.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, kpiW, 22, 1.8, 1.8, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(inkMuted.r, inkMuted.g, inkMuted.b);
        doc.text(label.toUpperCase(), x + kpiW / 2, y + 5.2, { align: 'center' });
        doc.setFont('times', 'bold');
        doc.setFontSize(14.5);
        doc.setTextColor(wine.r, wine.g, wine.b);
        doc.text(val, x + kpiW / 2, y + 12.5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.4);
        doc.setTextColor(inkMuted.r, inkMuted.g, inkMuted.b);
        doc.text(sub, x + kpiW / 2, y + 17.5, { align: 'center' });
      }
    };

    drawKpi(14, m.costPerCup, 'R$ 1,45', m.costPerCupSub, false);
    drawKpi(14 + kpiW + 3, m.suggestedPrice, 'R$ 14 a R$ 18', m.suggestedPriceSub, false);
    drawKpi(14 + (kpiW + 3) * 2, m.profitability, m.profitabilityVal, m.profitabilitySub, true);

    y += 26;

    doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
    doc.roundedRect(14, y, 182, 12, 1.5, 1.5, 'F');
    doc.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
    doc.setLineWidth(0.28);
    doc.roundedRect(14, y, 182, 12, 1.5, 1.5, 'S');

    [
      { text: m.teaMargin, highlight: true },
      { text: m.espressoMargin, highlight: false },
      { text: m.wineMargin, highlight: false },
      { text: m.beerMargin, highlight: false },
    ].forEach((b, idx) => {
      const bx = 16 + idx * 45;
      if (b.highlight) {
        doc.setFillColor(wine.r, wine.g, wine.b);
        doc.roundedRect(bx, y + 2, 43, 8, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(b.text, bx + 21.5, y + 6.9, { align: 'center' });
      } else {
        doc.setFillColor(softFill.r, softFill.g, softFill.b);
        doc.roundedRect(bx, y + 2, 43, 8, 1, 1, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(inkCharcoal.r, inkCharcoal.g, inkCharcoal.b);
        doc.text(b.text, bx + 21.5, y + 6.9, { align: 'center' });
      }
    });

    y += 18;

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(inkBlack.r, inkBlack.g, inkBlack.b);
    doc.text(m.sec2Title, 14, y);
    y += 5;

    const ritW = 173 / 4;
    [
      { num: '1', title: m.ritual1Title, desc: m.ritual1Desc },
      { num: '2', title: m.ritual2Title, desc: m.ritual2Desc },
      { num: '3', title: m.ritual3Title, desc: m.ritual3Desc },
      { num: '4', title: m.ritual4Title, desc: m.ritual4Desc },
    ].forEach((step, idx) => {
      const sx = 14 + idx * (ritW + 3);
      doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
      doc.roundedRect(sx, y, ritW, 27, 1.5, 1.5, 'F');
      doc.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
      doc.setLineWidth(0.28);
      doc.roundedRect(sx, y, ritW, 27, 1.5, 1.5, 'S');

      doc.setFillColor(idx === 3 ? greenBright.r : wine.r, idx === 3 ? greenBright.g : wine.g, idx === 3 ? greenBright.b : wine.b);
      doc.circle(sx + 5, y + 5.2, 2.4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(step.num, sx + 5, y + 6.1, { align: 'center' });

      const cleanTitle = step.title.replace(/^\d+\.\s*/, '');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(inkBlack.r, inkBlack.g, inkBlack.b);
      doc.text(cleanTitle, sx + 9, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(inkMuted.r, inkMuted.g, inkMuted.b);
      const rLines = doc.splitTextToSize(step.desc, ritW - 6);
      doc.text(rLines.slice(0, 4), sx + 3, y + 11.2);
    });

    y += 33;

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(inkBlack.r, inkBlack.g, inkBlack.b);
    doc.text(m.sec3Title, 14, y);
    y += 5;

    const benW = 176 / 3;
    [
      { title: m.comodatoTitle, desc: m.comodatoDesc },
      { title: m.trainingTitle, desc: m.trainingDesc },
      { title: m.certificationTitle, desc: m.certificationDesc },
    ].forEach((b, idx) => {
      const bx = 14 + idx * (benW + 3);
      doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
      doc.roundedRect(bx, y, benW, 21, 1.5, 1.5, 'F');
      doc.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
      doc.setLineWidth(0.28);
      doc.roundedRect(bx, y, benW, 21, 1.5, 1.5, 'S');

      talchaDrawCheckDot(doc, bx + 5, y + 5, 1.7, greenBright);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.1);
      doc.setTextColor(inkBlack.r, inkBlack.g, inkBlack.b);
      doc.text(b.title, bx + 8.5, y + 5.7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.1);
      doc.setTextColor(inkMuted.r, inkMuted.g, inkMuted.b);
      const bLines = doc.splitTextToSize(b.desc, benW - 6);
      doc.text(bLines.slice(0, 3), bx + 3, y + 10.5);
    });

    y += 27;

    doc.setFillColor(softFill.r, softFill.g, softFill.b);
    doc.roundedRect(14, y, 182, 16, 1.5, 1.5, 'F');
    doc.setDrawColor(borderCol.r, borderCol.g, borderCol.b);
    doc.roundedRect(14, y, 182, 16, 1.5, 1.5, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.7);
    doc.setTextColor(wine.r, wine.g, wine.b);
    doc.text(m.partnersTitle.toUpperCase(), 105, y + 5.2, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(inkBlack.r, inkBlack.g, inkBlack.b);
    doc.text(
      'Fasano  ·  A Casa do Porco  ·  D.O.M.  ·  Palácio Tangará  ·  Hotel Emiliano  ·  Rosewood',
      105,
      y + 11.4,
      { align: 'center' }
    );

    y += 22;

    doc.setFillColor(wine.r, wine.g, wine.b);
    doc.roundedRect(14, y, 182, 26, 2, 2, 'F');
    doc.setDrawColor(gold.r, gold.g, gold.b);
    doc.setLineWidth(0.35);
    doc.roundedRect(14, y, 182, 26, 2, 2, 'S');

    if (!talchaAddAspectLogo(doc, TALCHA_LOGO_WHITE, 'PNG', 19, y + 5.5, 27, 13.5)) {
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('talchá', 19, y + 14);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(250, 247, 242);
    doc.text(m.supportTitle, 52, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(246, 232, 204);
    doc.text(m.supportSub, 52, y + 13.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(245, 238, 234);
    doc.text(m.supportDesc, 52, y + 19);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(255, 255, 255);
    doc.text(`${aC.phone}`, 191, y + 11, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(246, 232, 204);
    doc.text(`${aC.email}`, 191, y + 16.5, { align: 'right' });
  }

  applyAllFooters();
  return { filename: safeFilename, blob: doc.output('blob'), doc };
}
