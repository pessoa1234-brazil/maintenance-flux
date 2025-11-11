import React, { useState, useMemo } from 'react';
import { Search, Calendar, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

const SistemaGarantias = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [habiteSeDate, setHabiteSeDate] = useState('');
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [filtroSistema, setFiltroSistema] = useState('todos');

  // Base de dados completa da norma
  const garantiasData = [
    // SOLIDEZ E SEGURANÇA (5 ANOS - LEGAL)
    {
      id: 1,
      sistema: 'Contenções',
      descricao: 'Muros de arrimo, cortinas de estacas, paredes diafragma',
      falhas: 'Falhas que afetem a segurança',
      prazo: 5,
      tipo: 'legal',
      keywords: ['contenção', 'muro de arrimo', 'cortina', 'estaca', 'diafragma']
    },
    {
      id: 2,
      sistema: 'Fundações',
      descricao: 'Elementos que transmitem cargas para o solo',
      falhas: 'Falhas que afetem a segurança',
      prazo: 5,
      tipo: 'legal',
      keywords: ['fundação', 'sapata', 'estaca', 'radier', 'tubulão']
    },
    {
      id: 3,
      sistema: 'Estrutura',
      descricao: 'Pilares, vigas, lajes, paredes estruturais',
      falhas: 'Falhas que afetem a segurança, deformações e fissuras além dos limites',
      prazo: 5,
      tipo: 'legal',
      keywords: ['estrutura', 'pilar', 'viga', 'laje', 'concreto', 'parede estrutural']
    },
    {
      id: 4,
      sistema: 'Estrutura de Pisos',
      descricao: 'Estruturas de pisos em mezaninos e estruturas auxiliares',
      falhas: 'Falhas que afetem a segurança',
      prazo: 5,
      tipo: 'legal',
      keywords: ['estrutura de piso', 'mezanino', 'laje']
    },
    {
      id: 5,
      sistema: 'Estrutura de Cobertura',
      descricao: 'Estruturas de coberturas de qualquer natureza',
      falhas: 'Falhas que afetem a segurança',
      prazo: 5,
      tipo: 'legal',
      keywords: ['estrutura de cobertura', 'telhado estrutural', 'tesoura']
    },
    
    // PISOS
    {
      id: 6,
      sistema: 'Pisos Internos - Contrapiso',
      descricao: 'Camada de regularização (contrapiso)',
      falhas: 'Dessolidarização, desagregação/pulverulência',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['contrapiso', 'regularização', 'dessolidarização', 'pulverulência']
    },
    {
      id: 7,
      sistema: 'Pisos Internos - Isolamento Acústico',
      descricao: 'Camada isolante acústica incorporada',
      falhas: 'Desintegração/ruptura, dessolidarização',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['isolamento acústico', 'manta acústica', 'piso flutuante']
    },
    {
      id: 8,
      sistema: 'Pisos Internos - Revestimento',
      descricao: 'Camada de revestimento/acabamento',
      falhas: 'Perda de aderência, desgaste',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['piso', 'cerâmica', 'porcelanato', 'vinílico', 'laminado', 'revestimento']
    },
    {
      id: 9,
      sistema: 'Pisos Internos - Rejuntamento',
      descricao: 'Rejuntamento e juntas',
      falhas: 'Desgaste, dessolidarização',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['rejunte', 'junta']
    },
    {
      id: 10,
      sistema: 'Pisos Garagem Coberta',
      descricao: 'Pisos de estacionamentos/garagens cobertos',
      falhas: 'Desgaste, dessolidarização',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['garagem', 'estacionamento', 'piso garagem']
    },
    {
      id: 11,
      sistema: 'Rodapés',
      descricao: 'Rodapés de qualquer natureza',
      falhas: 'Desgaste, dessolidarização, ruptura, deterioração',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['rodapé', 'rodape']
    },

    // VEDAÇÕES VERTICAIS EXTERNAS
    {
      id: 12,
      sistema: 'Vedações Verticais Externas',
      descricao: 'Fachadas, alvenaria, pele de vidro, painéis',
      falhas: 'Perda de integridade, dessolidarização',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['fachada', 'vedação externa', 'alvenaria externa', 'pele de vidro']
    },
    {
      id: 13,
      sistema: 'Vedações Externas - Selantes',
      descricao: 'Selantes e juntas de dilatação',
      falhas: 'Perda de estanqueidade',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['selante', 'junta de dilatação', 'estanqueidade']
    },
    {
      id: 14,
      sistema: 'Revestimento Fachada',
      descricao: 'Revestimento argamassado sobre alvenaria',
      falhas: 'Dessolidarização',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['reboco', 'argamassa', 'emboço', 'revestimento externo']
    },
    {
      id: 15,
      sistema: 'Revestimento Fachada - Degradação',
      descricao: 'Revestimento argamassado',
      falhas: 'Desgaste, empolamento, descascamento, esfarelamento, perda de estanqueidade',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['descascamento', 'empolamento', 'esfarelamento']
    },
    {
      id: 16,
      sistema: 'Acabamento Fachada - Cerâmica/Pedra',
      descricao: 'Revestimentos cerâmicos, pedras naturais',
      falhas: 'Dessolidarização',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['cerâmica externa', 'pedra', 'mármore', 'granito']
    },
    {
      id: 17,
      sistema: 'Pintura Externa - Látex Standard',
      descricao: 'Tinta látex standard',
      falhas: 'Perda de integridade, má aderência, pulverulência, craqueamento, eflorescência, bolhas, bolor',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['pintura externa', 'tinta látex', 'standard']
    },
    {
      id: 18,
      sistema: 'Pintura Externa - Látex Premium',
      descricao: 'Tinta látex premium e super premium',
      falhas: 'Perda de integridade, má aderência, pulverulência, craqueamento, eflorescência, bolhas, bolor',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['pintura premium', 'tinta premium', 'látex premium']
    },
    {
      id: 19,
      sistema: 'Pintura Externa - Esmalte/Óleo',
      descricao: 'Esmalte sintético e tinta a óleo',
      falhas: 'Enrugamento, bolhas, perda de integridade',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['esmalte', 'tinta óleo', 'sintético']
    },
    {
      id: 20,
      sistema: 'Textura Externa',
      descricao: 'Acabamento em textura',
      falhas: 'Perda de integridade, má aderência, pulverulência, craqueamento, bolhas',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['textura', 'texturizado']
    },

    // VEDAÇÕES VERTICAIS INTERNAS
    {
      id: 21,
      sistema: 'Vedações Verticais Internas',
      descricao: 'Paredes internas sem função estrutural',
      falhas: 'Perda de integridade, dessolidarização',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['parede interna', 'alvenaria interna', 'divisória']
    },
    {
      id: 22,
      sistema: 'Revestimento Interno',
      descricao: 'Revestimento argamassado interno',
      falhas: 'Desgaste, empolamento, dessolidarização, descascamento, perda de estanqueidade',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['reboco interno', 'massa corrida', 'gesso']
    },
    {
      id: 23,
      sistema: 'Acabamento Interno - Cerâmica',
      descricao: 'Cerâmicos, pedras naturais',
      falhas: 'Desgaste, dessolidarização',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['azulejo', 'cerâmica interna', 'revestimento banheiro']
    },
    {
      id: 24,
      sistema: 'Pintura Interna - Látex',
      descricao: 'Tinta látex interna',
      falhas: 'Perda de integridade, má aderência, pulverulência, craqueamento, eflorescência, bolhas, bolor',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['pintura interna', 'tinta parede']
    },

    // ESQUADRIAS
    {
      id: 25,
      sistema: 'Esquadrias - Guarnições',
      descricao: 'Guarnições, escovas, elementos de vedação',
      falhas: 'Desencaixe, deslocamento',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['guarnição', 'escova', 'borracha janela']
    },
    {
      id: 26,
      sistema: 'Esquadrias - Vedação',
      descricao: 'Guarnições e elementos de vedação',
      falhas: 'Perda de vedação',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['vedação janela', 'infiltração janela']
    },
    {
      id: 27,
      sistema: 'Esquadrias - Ferragens',
      descricao: 'Fechos, roldanas, parafusos, articulações',
      falhas: 'Desencaixe, deslocamento',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['fecho', 'roldana', 'cremona', 'dobradiça']
    },
    {
      id: 28,
      sistema: 'Esquadrias - Perfis Principais',
      descricao: 'Perfis estrutura da esquadria',
      falhas: 'Ruptura, deformação, flexão, trincas, cavidades',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['perfil janela', 'marco', 'batente']
    },
    {
      id: 29,
      sistema: 'Vidros - Delaminação',
      descricao: 'Vidros',
      falhas: 'Delaminação',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['vidro delaminado', 'vidro laminado']
    },
    {
      id: 30,
      sistema: 'Vidros - Dessolidarização',
      descricao: 'Vidros',
      falhas: 'Dessolidarização da esquadria',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['vidro solto', 'vidro caindo']
    },

    // PORTAS
    {
      id: 31,
      sistema: 'Portas - Marco/Folha Madeira',
      descricao: 'Marcos e folhas de madeira',
      falhas: 'Empenamento, descolamento, falha superficial',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['porta empenada', 'porta madeira', 'folha porta']
    },
    {
      id: 32,
      sistema: 'Portas Corta-Fogo',
      descricao: 'Componentes da porta corta-fogo',
      falhas: 'Mau funcionamento, fixação, corrosão',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['porta corta-fogo', 'pcf', 'mola porta']
    },
    {
      id: 33,
      sistema: 'Portões/Gradis',
      descricao: 'Portões, gradis, grades, portinholas',
      falhas: 'Mau funcionamento, oxidação',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['portão', 'grade', 'gradil', 'portinhola']
    },

    // ELEMENTOS DE PROTEÇÃO
    {
      id: 34,
      sistema: 'Guarda-Corpos/Peitoris',
      descricao: 'Elementos de proteção',
      falhas: 'Ruptura ou perda de estabilidade',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['guarda-corpo', 'peitoril', 'parapeito']
    },
    {
      id: 35,
      sistema: 'Corrimãos',
      descricao: 'Corrimãos',
      falhas: 'Ruptura ou perda de estabilidade',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['corrimão', 'corrimao']
    },
    {
      id: 36,
      sistema: 'Muros Externos',
      descricao: 'Muros de qualquer tipo',
      falhas: 'Ruptura/tombamento',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['muro', 'muro externo']
    },

    // COBERTURAS
    {
      id: 37,
      sistema: 'Forros',
      descricao: 'Forros de qualquer material, sancas',
      falhas: 'Dessolidarização ou ruptura',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['forro', 'sanca', 'forro gesso']
    },
    {
      id: 38,
      sistema: 'Telhamento',
      descricao: 'Telhamento e fixações',
      falhas: 'Dessolidarização ou ruptura',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['telha', 'telhado', 'cobertura']
    },
    {
      id: 39,
      sistema: 'Telhamento - Estanqueidade',
      descricao: 'Telhamento',
      falhas: 'Deformações, permeabilidade, perda de estanqueidade',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['infiltração telhado', 'goteira', 'telha vazando']
    },
    {
      id: 40,
      sistema: 'Rufos e Calhas',
      descricao: 'Rufos e calhas',
      falhas: 'Falha de fixação e perda de estanqueidade',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['rufo', 'calha', 'calha entupida']
    },

    // IMPERMEABILIZAÇÃO
    {
      id: 41,
      sistema: 'Impermeabilização',
      descricao: 'Sistemas em qualquer elemento',
      falhas: 'Perda de estanqueidade',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['impermeabilização', 'infiltração', 'vazamento', 'umidade']
    },

    // SISTEMAS HIDRÁULICOS
    {
      id: 42,
      sistema: 'Hidráulica - Prumadas',
      descricao: 'Tubos e conexões em prumadas, reservatórios',
      falhas: 'Ruptura, dessolidarização, perda de integridade/estanqueidade',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['prumada', 'coluna água', 'reservatório', 'caixa d\'água']
    },
    {
      id: 43,
      sistema: 'Hidráulica - Ramais',
      descricao: 'Ramais e sub-ramais - Produto',
      falhas: 'Falhas dos produtos',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['ramal', 'tubulação', 'cano']
    },
    {
      id: 44,
      sistema: 'Hidráulica - Ramais Instalação',
      descricao: 'Ramais e sub-ramais - Instalação',
      falhas: 'Falhas de instalação',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['instalação hidráulica', 'vazamento cano']
    },
    {
      id: 45,
      sistema: 'Louças Sanitárias',
      descricao: 'Lavatórios, bacias, caixas descarga, tanques',
      falhas: 'Falhas dos produtos',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['louça', 'vaso', 'bacia', 'lavatório', 'tanque']
    },
    {
      id: 46,
      sistema: 'Metais Sanitários',
      descricao: 'Chuveiros, duchas, torneiras, misturadores',
      falhas: 'Falhas dos produtos',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['torneira', 'chuveiro', 'ducha', 'misturador', 'monocomando']
    },

    // SISTEMAS ELÉTRICOS
    {
      id: 47,
      sistema: 'Elétrica - Prumadas Produto',
      descricao: 'Prumadas de distribuição',
      falhas: 'Falhas de produto',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['prumada elétrica', 'quadro distribuição']
    },
    {
      id: 48,
      sistema: 'Elétrica - Prumadas Instalação',
      descricao: 'Prumadas de distribuição',
      falhas: 'Falhas de instalação',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['instalação elétrica prumada']
    },
    {
      id: 49,
      sistema: 'Elétrica - Componentes',
      descricao: 'Disjuntores, tomadas, interruptores, fios, cabos',
      falhas: 'Falhas dos produtos',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['tomada', 'interruptor', 'disjuntor', 'fio', 'cabo']
    },
    {
      id: 50,
      sistema: 'Elétrica - Instalação Componentes',
      descricao: 'Instalação de componentes elétricos',
      falhas: 'Falhas de instalação',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['instalação elétrica']
    },

    // COMBATE A INCÊNDIO
    {
      id: 51,
      sistema: 'Incêndio - Prumadas',
      descricao: 'Prumadas de combate a incêndio',
      falhas: 'Falhas de produtos e instalação',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['hidrante', 'sprinkler', 'combate incêndio']
    },
    {
      id: 52,
      sistema: 'Incêndio - Ramais',
      descricao: 'Tubos e conexões em ramais',
      falhas: 'Falhas de produtos e instalação',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['ramal incêndio']
    },

    // TRANSPORTES
    {
      id: 53,
      sistema: 'Elevadores',
      descricao: 'Infraestrutura, componentes e equipamentos',
      falhas: 'Falhas dos produtos e instalação',
      prazo: 1,
      tipo: 'oferecida',
      keywords: ['elevador', 'ascensor', 'escada rolante']
    },

    // PISCINAS
    {
      id: 54,
      sistema: 'Piscina - Tanque',
      descricao: 'Tanque da piscina',
      falhas: 'Perda de estanqueidade',
      prazo: 5,
      tipo: 'oferecida',
      keywords: ['piscina', 'tanque', 'vazamento piscina']
    },
    {
      id: 55,
      sistema: 'Piscina - Revestimentos',
      descricao: 'Revestimentos da piscina',
      falhas: 'Dessolidarização',
      prazo: 3,
      tipo: 'oferecida',
      keywords: ['azulejo piscina', 'revestimento piscina']
    }
  ];

  // Função para calcular data de vencimento
  const calcularVencimento = (prazoAnos: number) => {
    if (!habiteSeDate) return null;
    
    const dataInicio = new Date(habiteSeDate);
    const dataVencimento = new Date(dataInicio);
    dataVencimento.setFullYear(dataVencimento.getFullYear() + prazoAnos);
    
    return dataVencimento;
  };

  // Função para verificar se garantia está vigente
  const verificarVigencia = (prazoAnos: number) => {
    if (!habiteSeDate) return { status: 'indefinido', texto: 'Informe a data do habite-se' };
    
    const dataVencimento = calcularVencimento(prazoAnos);
    const hoje = new Date();
    
    if (dataVencimento && hoje <= dataVencimento) {
      const diasRestantes = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        status: 'vigente', 
        texto: `Vigente - ${diasRestantes} dias restantes`,
        cor: 'green'
      };
    } else {
      const diasVencidos = dataVencimento ? Math.ceil((hoje.getTime() - dataVencimento.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return { 
        status: 'vencido', 
        texto: `Vencida há ${diasVencidos} dias`,
        cor: 'red'
      };
    }
  };

  // Filtragem de resultados
  const resultadosFiltrados = useMemo(() => {
    let resultados = garantiasData;

    // Filtro por tipo
    if (filtroSistema !== 'todos') {
      resultados = resultados.filter(item => item.tipo === filtroSistema);
    }

    // Filtro por termo de busca
    if (searchTerm) {
      const termoLower = searchTerm.toLowerCase();
      resultados = resultados.filter(item => {
        const matchSistema = item.sistema.toLowerCase().includes(termoLower);
        const matchDescricao = item.descricao.toLowerCase().includes(termoLower);
        const matchFalhas = item.falhas.toLowerCase().includes(termoLower);
        const matchKeywords = item.keywords.some(kw => kw.toLowerCase().includes(termoLower));
        
        return matchSistema || matchDescricao || matchFalhas || matchKeywords;
      });
    }

    return resultados;
  }, [searchTerm, filtroSistema]);

  const formatarData = (data: Date) => {
    if (!data) return '';
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-6 border">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sistema de Consulta de Garantias
          </h1>
          <p className="text-muted-foreground mb-4">ABNT NBR 17170:2022 - Edificações - Garantias</p>
          
          {/* Data do Habite-se */}
          <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-primary" size={20} />
              <label className="font-semibold text-foreground">Data do Habite-se:</label>
            </div>
            <input
              type="date"
              value={habiteSeDate}
              onChange={(e) => setHabiteSeDate(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
            />
            {habiteSeDate && (
              <p className="text-sm text-muted-foreground mt-2">
                ✓ Início das garantias: {new Date(habiteSeDate).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-card rounded-lg shadow-lg p-6 mb-6 border">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Campo de Busca */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Descreva a patologia ou sistema:
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  placeholder="Ex: infiltração, fissura, porta empenada, vazamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                />
              </div>
            </div>

            {/* Filtro por Tipo */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tipo de Garantia:
              </label>
              <select
                value={filtroSistema}
                onChange={(e) => setFiltroSistema(e.target.value)}
                className="w-full px-4 py-3 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
              >
                <option value="todos">Todas</option>
                <option value="legal">Garantia Legal (5 anos)</option>
                <option value="oferecida">Garantia Oferecida</option>
              </select>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="bg-destructive/20 text-destructive px-3 py-1 rounded-full">
              Garantia Legal: 5 itens principais
            </div>
            <div className="bg-primary/20 text-primary px-3 py-1 rounded-full">
              Total de itens catalogados: {garantiasData.length}
            </div>
            <div className="bg-green-600/20 text-green-600 px-3 py-1 rounded-full">
              Resultados encontrados: {resultadosFiltrados.length}
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="space-y-4">
          {resultadosFiltrados.length === 0 ? (
            <div className="bg-card rounded-lg shadow-lg p-8 text-center border">
              <AlertCircle className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">Nenhum resultado encontrado. Tente outro termo de busca.</p>
            </div>
          ) : (
            resultadosFiltrados.map((item) => {
              const vigencia = verificarVigencia(item.prazo);
              const dataVencimento = calcularVencimento(item.prazo);

              return (
                <div
                  key={item.id}
                  className="bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border"
                  onClick={() => setSelectedItem(item.id === selectedItem ? null : item.id)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-foreground">{item.sistema}</h3>
                          {item.tipo === 'legal' && (
                            <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full font-semibold">
                              LEGAL
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">{item.descricao}</p>
                        <p className="text-muted-foreground text-sm italic">Falhas: {item.falhas}</p>
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-3xl font-bold text-primary mb-1">
                          {item.prazo} {item.prazo === 1 ? 'ano' : 'anos'}
                        </div>
                        {habiteSeDate && (
                          <div className={`text-sm font-semibold ${
                            vigencia.status === 'vigente' ? 'text-green-600' : 'text-destructive'
                          }`}>
                            {vigencia.status === 'vigente' ? (
                              <CheckCircle size={16} className="inline mr-1" />
                            ) : (
                              <XCircle size={16} className="inline mr-1" />
                            )}
                            {vigencia.texto}
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedItem === item.id && habiteSeDate && dataVencimento && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-foreground">Início da garantia:</span>
                            <span className="text-foreground">{formatarData(new Date(habiteSeDate))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-foreground">Vencimento:</span>
                            <span className="text-foreground">{formatarData(dataVencimento)}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span className="text-foreground">Status:</span>
                            <span className={vigencia.status === 'vigente' ? 'text-green-600' : 'text-destructive'}>
                              {vigencia.status === 'vigente' ? 'VIGENTE' : 'VENCIDA'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Informações Importantes */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500 rounded-lg p-6 mt-6">
          <div className="flex items-start gap-3">
            <Info className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-foreground mb-2">Condições para Manutenção da Garantia:</h3>
              <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
                <li>Realização da manutenção conforme ABNT NBR 5674</li>
                <li>Uso correto conforme manual de uso, operação e manutenção</li>
                <li>Não realização de reformas sem projeto adequado</li>
                <li>Comprovação das manutenções realizadas</li>
                <li>Ausência de alterações nas condições originais de projeto</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Sistema baseado na ABNT NBR 17170:2022</p>
          <p className="mt-1">Os prazos são recomendações técnicas. Consulte sempre a norma completa e legislação aplicável.</p>
        </div>
      </div>
    </div>
  );
};

export default SistemaGarantias;
