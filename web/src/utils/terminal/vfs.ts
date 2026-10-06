import {
  VFSNode,
  VFSFileNode,
  VFSDirectoryNode,
  VFSSymlinkNode,
  AutocompleteResult,
} from '../../types/terminal';

export const DEFAULT_MTIME = 'Oct 06 12:00';
export const DEFAULT_CWD = '/root/atrio_central';

export interface SpellMetadata {
  damage: number;
  category: 'arcano' | 'runico' | 'etereo' | 'primal' | 'umbral';
}

export const ARCHIVE_SPELLS: Record<string, SpellMetadata> = {
  // Zona de Quarentena
  'Umbra Flagellum': { damage: 15, category: 'umbral' },
  'Noctis Morsus': { damage: 20, category: 'umbral' },
  'Caligo Tenebrarum': { damage: 20, category: 'umbral' },
  'Inanis Sectum': { damage: 40, category: 'umbral' },
  'Chaos Involucrum': { damage: 50, category: 'arcano' },

  // Agência de Cifras
  'Carcer Angularis': { damage: 15, category: 'runico' },
  'Sigillum Ponderis': { damage: 15, category: 'runico' },
  'Glyphos Dementiae': { damage: 20, category: 'runico' },
  'Maledictio Scripta': { damage: 35, category: 'runico' },
  'Stigma Ignotum': { damage: 50, category: 'runico' },

  // Ala de Risco Biológico
  'Visceralis Diruptio': { damage: 25, category: 'primal' },
  'Ossea Eruptio': { damage: 25, category: 'primal' },
  'Sporae Profundae': { damage: 30, category: 'primal' },

  // Inteligência de Sinais
  'Spiritus Gelidus': { damage: 15, category: 'etereo' },
  'Spectra Ululatus': { damage: 20, category: 'etereo' },
  'Corpus Evanesco': { damage: 35, category: 'etereo' },
  'Umbra Astralis': { damage: 45, category: 'etereo' },

  // Mecânica Temporal
  'Stella Cadens': { damage: 20, category: 'etereo' },
  'Ignis Coloris': { damage: 20, category: 'primal' },
  'Lumen Abyssale': { damage: 30, category: 'arcano' },
  'Arcana Mutatio': { damage: 55, category: 'arcano' },
};

export function createFile(
  name: string,
  content: string,
  options?: {
    isExecutable?: boolean;
    spellName?: string;
    category?: string;
    damage?: number;
    permissions?: string;
  }
): VFSFileNode {
  return {
    type: 'file',
    name,
    content,
    isExecutable: options?.isExecutable ?? false,
    spellName: options?.spellName,
    category: options?.category,
    damage: options?.damage,
    permissions: options?.permissions ?? (options?.isExecutable ? '-rwxr-xr-x' : '-rw-r--r--'),
    owner: 'mage',
    group: 'mage',
    size: content.length,
    mtime: DEFAULT_MTIME,
  };
}

export function createDir(
  name: string,
  children: Record<string, VFSNode> = {},
  permissions = 'drwxr-xr-x'
): VFSDirectoryNode {
  return {
    type: 'dir',
    name,
    children,
    permissions,
    owner: 'mage',
    group: 'mage',
    size: 4096,
    mtime: DEFAULT_MTIME,
  };
}

export function createSymlink(name: string, target: string): VFSSymlinkNode {
  return {
    type: 'link',
    name,
    target,
    permissions: 'lrwxrwxrwx',
    owner: 'mage',
    group: 'mage',
    size: target.length,
    mtime: DEFAULT_MTIME,
  };
}

type RawVFSItem =
  | { type: 'dir'; contents: Record<string, RawVFSItem> }
  | { type: 'file'; content: string }
  | { type: 'symlink'; target: string };

const RAW_VFS: Record<string, RawVFSItem> = {
  root: {
    type: 'dir',
    contents: {
      atrio_central: {
        type: 'dir',
        contents: {
          'mapa_diretorios.txt': {
            type: 'file',
            content:
              'Bem-vindo aos Arquivos.\nzona_quarentena: Contenção.\nagencia_cifras: Léxico.\ninteligencia_sinais: Linhas de Ley.\nala_risco_biologico: Biologia.\nmecanica_temporal: Teoria.',
          },
          pesquisa_atual: {
            type: 'symlink',
            target: '/root/setores/agencia_cifras/lexico/dialetos/linguas_esquecidas/fragmentos_pergaminho',
          },
        },
      },
      setores: {
        type: 'dir',
        contents: {
          zona_quarentena: {
            type: 'dir',
            contents: {
              blocos_de_contencao: {
                type: 'dir',
                contents: {
                  nivel_superficie: {
                    type: 'dir',
                    contents: {
                      'relatorio_incidente.txt': {
                        type: 'file',
                        content: 'Pequeno vazamento de sombra. Feitiço: Umbra Flagellum',
                      },
                    },
                  },
                  subnivel_1: {
                    type: 'dir',
                    contents: {
                      'vazio.txt': {
                        type: 'file',
                        content: 'Nada aqui.',
                      },
                      registros_celas: {
                        type: 'dir',
                        contents: {
                          'registro_01.txt': {
                            type: 'file',
                            content: 'Cobaia sem resposta.',
                          },
                          'registro_02.txt': {
                            type: 'file',
                            content: 'Feitiço: Noctis Morsus manifestado na cela 4.',
                          },
                          'registro_03.txt': {
                            type: 'file',
                            content: 'Feitiço: Caligo Tenebrarum requer escuridão.',
                          },
                        },
                      },
                    },
                  },
                  subnivel_2: {
                    type: 'dir',
                    contents: {
                      quarentena: {
                        type: 'dir',
                        contents: {
                          'especificacoes_contencao.txt': {
                            type: 'file',
                            content:
                              'As paredes devem ser revestidas com 10 centímetros de chumbo e cobertas de prata para evitar infiltração abissal.',
                          },
                          '.confidencial': {
                            type: 'dir',
                            contents: {
                              'pesquisa_vazio.txt': {
                                type: 'file',
                                content: 'Teste bem-sucedido. Feitiço: Inanis Sectum',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  profundezas_abissais: {
                    type: 'dir',
                    contents: {
                      'aviso.txt': {
                        type: 'file',
                        content: 'NÃO PROSSIGA.',
                      },
                      '.zona_restrita': {
                        type: 'dir',
                        contents: {
                          '.contencao_alfa': {
                            type: 'dir',
                            contents: {
                              corredor_1: {
                                type: 'dir',
                                contents: {
                                  corredor_2: {
                                    type: 'dir',
                                    contents: {
                                      cofre: {
                                        type: 'file',
                                        content: 'O cofre está vazio. Contenção violada.',
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          '.contencao_gama': {
                            type: 'dir',
                            contents: {
                              descida_a: {
                                type: 'dir',
                                contents: {
                                  descida_b: {
                                    type: 'dir',
                                    contents: {
                                      'cinzas.txt': {
                                        type: 'file',
                                        content: 'Apenas poeira de sombras.',
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          '.contencao_omega': {
                            type: 'dir',
                            contents: {
                              'nota_limpeza.txt': {
                                type: 'file',
                                content: 'Quem deixou o balde do esfregão perto do selo? - Gerência',
                              },
                              'selo_final.txt': {
                                type: 'file',
                                content: 'CRÍTICO: A realidade está falhando. Feitiço: Chaos Involucrum',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          agencia_cifras: {
            type: 'dir',
            contents: {
              lexico: {
                type: 'dir',
                contents: {
                  dialetos: {
                    type: 'dir',
                    contents: {
                      tabuas_de_pedra: {
                        type: 'dir',
                        contents: {
                          'tabua_1.txt': {
                            type: 'file',
                            content: 'Feitiço: Carcer Angularis',
                          },
                          'tabua_2.txt': {
                            type: 'file',
                            content: 'Feitiço: Sigillum Ponderis',
                          },
                        },
                      },
                      linguas_esquecidas: {
                        type: 'dir',
                        contents: {
                          fragmentos_pergaminho: {
                            type: 'dir',
                            contents: {
                              'fragmento_A.txt': {
                                type: 'file',
                                content: 'Feitiço: Glyphos Dementiae',
                              },
                              'traducao_runica_v1.txt': {
                                type: 'file',
                                content:
                                  'OS ARQUIVOS DA LÍNGUA ESQUECIDA - VOLUME IV\n\nSeção 1: A Fonética da Angústia\nA articulação de vogais rúnicas requer uma respiração constante e um desapego das preocupações mortais. Falar a palavra \'Aethel\' é sentir o frio do vazio nos dentes. Documentamos exatamente 3.402 permutações distintas dos glifos centrais.\n\nSeção 2: A Sintaxe dos Condenados\nAo combinar um substantivo de ligação com um verbo de desvendar, o conjurador deve empregar uma amarra de aterramento. Sem isso, o ciclo de feedback rúnico consumirá invariavelmente a memória de curto prazo do conjurador.\n\nSeção 3: Traduções Contestadas\nO debate acadêmico continua sobre a interpretação da 7ª tábua. O Arquimago Vaelan argumenta que ela descreve um mecanismo de controle climático, enquanto a teoria predominante sugere que é um ritual para selar fendas.\n\nSeção 4: A Anomalia Scripta\nDurante a escavação das catacumbas inferiores, um fragmento foi descoberto que desafiava a análise convencional. A transcrição principal diz o seguinte: \'O sangue deve fluir, a tinta deve secar, a palavra deve prender.\'\n\nSeção 5: Aplicações Práticas\nRecomenda-se cautela ao utilizar qualquer tradução derivada deste volume. A ressonância etérea da palavra falada é altamente volátil. Por favor, consulte o manual de segurança no átrio central.',
                              },
                              'traducao_runica_v2.txt': {
                                type: 'file',
                                content:
                                  'OS ARQUIVOS DA LÍNGUA ESQUECIDA - VOLUME IV\n\nSeção 1: A Fonética da Angústia\nA articulação de vogais rúnicas requer uma respiração constante e um desapego das preocupações mortais. Falar a palavra \'Aethel\' é sentir o frio do vazio nos dentes. Documentamos exatamente 3.402 permutações distintas dos glifos centrais.\n\nSeção 2: A Sintaxe dos Condenados\nAo combinar um substantivo de ligação com um verbo de desvendar, o conjurador deve empregar uma amarra de aterramento. Sem isso, o ciclo de feedback rúnico consumirá invariavelmente a memória de curto prazo do conjurador.\n\nSeção 3: Traduções Contestadas\nO debate acadêmico continua sobre a interpretação da 7ª tábua. O Arquimago Vaelan argumenta que ela descreve um mecanismo de controle climático, enquanto a teoria predominante sugere que é um ritual para selar fendas.\n\nSeção 4: A Anomalia Scripta\nFeitiço: Maledictio Scripta\n\nSeção 5: Aplicações Práticas\nRecomenda-se cautela ao utilizar qualquer tradução derivada deste volume. A ressonância etérea da palavra falada é altamente volátil. Por favor, consulte o manual de segurança no átrio central.',
                              },
                            },
                          },
                        },
                      },
                      runas_de_sangue: {
                        type: 'dir',
                        contents: {
                          '.falso_altar_norte': {
                            type: 'dir',
                            contents: {
                              santuario_interno: {
                                type: 'dir',
                                contents: {
                                  relicario: {
                                    type: 'dir',
                                    contents: {
                                      'po_de_osso.txt': {
                                        type: 'file',
                                        content: 'Os restos de um estudioso que falhou.',
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          '.falso_altar_sul': {
                            type: 'dir',
                            contents: {
                              catacumbas: {
                                type: 'dir',
                                contents: {
                                  cripta: {
                                    type: 'dir',
                                    contents: {
                                      'urna.txt': {
                                        type: 'file',
                                        content: 'Vazia.',
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          '.altar_oculto': {
                            type: 'dir',
                            contents: {
                              '.cifra_proibida.txt': {
                                type: 'file',
                                content: 'A verdade final: Feitiço: Stigma Ignotum',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          ala_risco_biologico: {
            type: 'dir',
            contents: {
              botanica: {
                type: 'dir',
                contents: {
                  estufa: {
                    type: 'dir',
                    contents: {
                      terrario_fungos: {
                        type: 'dir',
                        contents: {
                          raiz_profunda: {
                            type: 'dir',
                            contents: {
                              'amostra_toxica.txt': {
                                type: 'file',
                                content: 'Altamente volátil. Feitiço: Sporae Profundae',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              vivario: {
                type: 'dir',
                contents: {
                  relatorios_autopsia: {
                    type: 'dir',
                    contents: {
                      'registro_temperatura_44.txt': {
                        type: 'file',
                        content: 'Temperatura da incubadora nominal a 37C. Sem anomalias.',
                      },
                      'cultura_falha_A.txt': {
                        type: 'file',
                        content: 'Espécime dissolvido em pasta nutritiva. Descartado.',
                      },
                      'anatomia_padrao.txt': {
                        type: 'file',
                        content: 'Apêndice A: A densidade média da cavidade torácica de um goblin menor.',
                      },
                      'cobaia_01.txt': {
                        type: 'file',
                        content: 'Causa da morte: ruptura interna. Feitiço: Visceralis Diruptio',
                      },
                      'cobaia_02.txt': {
                        type: 'file',
                        content: 'Crescimento ósseo excessivo. Feitiço: Ossea Eruptio',
                      },
                    },
                  },
                },
              },
            },
          },
          inteligencia_sinais: {
            type: 'dir',
            contents: {
              malha_linhas_ley: {
                type: 'dir',
                contents: {
                  frequencias: {
                    type: 'dir',
                    contents: {
                      banda_alfa: {
                        type: 'dir',
                        contents: {
                          'sinal.txt': {
                            type: 'file',
                            content: 'Feitiço: Spiritus Gelidus',
                          },
                        },
                      },
                      banda_beta: {
                        type: 'dir',
                        contents: {
                          'ecos.log': {
                            type: 'file',
                            content: 'Feitiço: Spectra Ululatus',
                          },
                          '.mudanca_fase': {
                            type: 'dir',
                            contents: {
                              'desaparecimento.txt': {
                                type: 'file',
                                content: 'Feitiço: Corpus Evanesco',
                              },
                            },
                          },
                        },
                      },
                      banda_omega: {
                        type: 'dir',
                        contents: {
                          '.expansao_vazio': {
                            type: 'dir',
                            contents: {
                              camada_1: {
                                type: 'dir',
                                contents: {
                                  camada_2: {
                                    type: 'dir',
                                    contents: {
                                      'estatica.log': {
                                        type: 'file',
                                        content: 'Conexão expirada.',
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          '.regiao_inferior': {
                            type: 'dir',
                            contents: {
                              profundidade_a: {
                                type: 'dir',
                                contents: {
                                  profundidade_b: {
                                    type: 'dir',
                                    contents: {
                                      'eco.txt': {
                                        type: 'file',
                                        content: 'Olá? ...lá? ...á?',
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          '.plano_astral': {
                            type: 'dir',
                            contents: {
                              '.nucleo_projecao.txt': {
                                type: 'file',
                                content: 'Alma separada. Feitiço: Umbra Astralis',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          mecanica_temporal: {
            type: 'dir',
            contents: {
              teorica: {
                type: 'dir',
                contents: {
                  mecanica_celeste: {
                    type: 'dir',
                    contents: {
                      observatorio: {
                        type: 'dir',
                        contents: {
                          'analise_poeira.txt': {
                            type: 'file',
                            content:
                              'A espectroscopia revela altas concentrações de ferro e silicato. Completamente mundano.',
                          },
                          'cronograma_limpeza_lentes.txt': {
                            type: 'file',
                            content:
                              'Lembre-se de limpar o espelho primário às terças-feiras usando APENAS seda de microfibra.',
                          },
                          'rastreamento_meteoros.txt': {
                            type: 'file',
                            content: 'Feitiço: Stella Cadens',
                          },
                          'analise_nebulosas.txt': {
                            type: 'file',
                            content: 'Feitiço: Ignis Coloris',
                          },
                        },
                      },
                      espaco_profundo: {
                        type: 'dir',
                        contents: {
                          'dados_buraco_negro.txt': {
                            type: 'file',
                            content: 'Feitiço: Lumen Abyssale',
                          },
                          fenda_abissal: {
                            type: 'symlink',
                            target: '/root/setores/zona_quarentena/blocos_de_contencao/profundezas_abissais',
                          },
                        },
                      },
                    },
                  },
                  manipulacao_quantica: {
                    type: 'dir',
                    contents: {
                      motor_paradoxo: {
                        type: 'dir',
                        contents: {
                          '.horizonte_eventos_a': {
                            type: 'dir',
                            contents: {
                              dilatacao_temporal: {
                                type: 'dir',
                                contents: {
                                  fim_loop: {
                                    type: 'dir',
                                    contents: {
                                      'nada.txt': {
                                        type: 'file',
                                        content: 'Você já esteve aqui antes.',
                                      },
                                      proxima_camada: {
                                        type: 'symlink',
                                        target:
                                          '/root/setores/mecanica_temporal/manipulacao_quantica/motor_paradoxo/.horizonte_eventos_a',
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          '.horizonte_eventos_b': {
                            type: 'dir',
                            contents: {
                              poco_gravitacional: {
                                type: 'dir',
                                contents: {
                                  profundidade_esmagamento: {
                                    type: 'dir',
                                    contents: {
                                      'erro.log': {
                                        type: 'file',
                                        content: 'Pressão fatal.',
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          '.singularidade': {
                            type: 'dir',
                            contents: {
                              'erro_calibracao.log': {
                                type: 'file',
                                content:
                                  'Sensores sobrecarregados por onda gravitacional. Dados corrompidos.',
                              },
                              '.particula_deus.txt': {
                                type: 'file',
                                content: 'Realidade reescrita. Feitiço: Arcana Mutatio',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

function convertRawNode(name: string, raw: RawVFSItem): VFSNode {
  if (raw.type === 'dir') {
    const children: Record<string, VFSNode> = {};
    for (const [childName, childRaw] of Object.entries(raw.contents)) {
      children[childName] = convertRawNode(childName, childRaw);
    }
    return createDir(name, children);
  }

  if (raw.type === 'symlink') {
    return createSymlink(name, raw.target);
  }

  if (raw.type === 'file') {
    let spellInfo: { spellName: string; damage: number; category: string } | undefined;
    for (const [spellName, meta] of Object.entries(ARCHIVE_SPELLS)) {
      if (raw.content.includes(spellName)) {
        spellInfo = { spellName, damage: meta.damage, category: meta.category };
        break;
      }
    }

    return createFile(name, raw.content, spellInfo ? {
      isExecutable: true,
      spellName: spellInfo.spellName,
      damage: spellInfo.damage,
      category: spellInfo.category,
    } : undefined);
  }

  throw new Error(`Tipo de nó inválido: ${(raw as any).type}`);
}

export function createInitialVFS(): VFSDirectoryNode {
  const rootDirNode = convertRawNode('root', RAW_VFS.root) as VFSDirectoryNode;

  return createDir('/', {
    root: rootDirNode,
    atrio_central: createSymlink('atrio_central', '/root/atrio_central'),
    setores: createSymlink('setores', '/root/setores'),
    home: createDir('home', {
      mage: createSymlink('mage', '/root/atrio_central'),
    }),
  });
}

// ============================================================================
// PATH UTILITIES
// ============================================================================

export function normalizePath(path: string): string {
  if (!path) return '/';

  const segments = path.split('/').filter(Boolean);
  const resolvedSegments: string[] = [];

  for (const seg of segments) {
    if (seg === '.') continue;
    if (seg === '..') {
      resolvedSegments.pop();
    } else {
      resolvedSegments.push(seg);
    }
  }

  return '/' + resolvedSegments.join('/');
}

export function getAbsolutePath(cwd: string, targetPath: string): string {
  let trimmed = targetPath.trim().replace(/^['"]|['"]$/g, '');
  if (trimmed === '~' || trimmed.startsWith('~/')) {
    trimmed = '/root' + trimmed.slice(1);
  }

  if (trimmed.startsWith('/')) {
    return normalizePath(trimmed);
  }

  return normalizePath(cwd + '/' + trimmed);
}

export function getDisplayPath(cwd: string): string {
  if (cwd === '/root') return '~';
  if (cwd.startsWith('/root/')) {
    return '~/' + cwd.slice('/root/'.length);
  }
  return cwd;
}

export function resolvePath(
  root: VFSDirectoryNode,
  cwd: string,
  targetPath: string,
  followFinalSymlink = true,
  maxHops = 20
): { node: VFSNode; canonicalPath: string } | null {
  const absPath = getAbsolutePath(cwd, targetPath);
  const segments = absPath.split('/').filter(Boolean);

  let current: VFSNode = root;
  let currentCanonicalPath = '/';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isLast = i === segments.length - 1;

    if (current.type === 'link') {
      if (maxHops <= 0) return null;
      const targetAbs = current.target.startsWith('/')
        ? current.target
        : normalizePath(currentCanonicalPath + '/../' + current.target);
      const resolvedTarget = resolvePath(root, '/', targetAbs, true, maxHops - 1);
      if (!resolvedTarget) return null;
      current = resolvedTarget.node;
      currentCanonicalPath = resolvedTarget.canonicalPath;
    }

    if (current.type !== 'dir') {
      return null;
    }

    const nextNode: VFSNode | undefined = current.children[seg];
    if (!nextNode) {
      return null;
    }

    currentCanonicalPath = normalizePath(currentCanonicalPath + '/' + seg);
    current = nextNode;

    if (current.type === 'link' && (!isLast || followFinalSymlink)) {
      if (maxHops <= 0) return null;
      const targetAbs = current.target.startsWith('/')
        ? current.target
        : normalizePath(currentCanonicalPath + '/../' + current.target);
      const resolvedTarget = resolvePath(root, '/', targetAbs, isLast ? followFinalSymlink : true, maxHops - 1);
      if (!resolvedTarget) return null;
      current = resolvedTarget.node;
      currentCanonicalPath = resolvedTarget.canonicalPath;
    }
  }

  return { node: current, canonicalPath: currentCanonicalPath };
}

export function changeDirectory(
  root: VFSDirectoryNode,
  cwd: string,
  targetPath: string,
  oldPwd?: string
): { newCwd?: string; error?: string } {
  let dest = targetPath ? targetPath.trim() : DEFAULT_CWD;

  if (dest === '-') {
    if (!oldPwd) {
      return { error: 'bash: cd: OLDPWD not set' };
    }
    dest = oldPwd;
  }

  const resolved = resolvePath(root, cwd, dest, true);
  if (!resolved) {
    return { error: `bash: cd: ${dest}: No such file or directory` };
  }

  if (resolved.node.type !== 'dir') {
    return { error: `bash: cd: ${dest}: Not a directory` };
  }

  return { newCwd: resolved.canonicalPath };
}

export interface ListDirEntry {
  name: string;
  type: 'file' | 'dir' | 'link';
  permissions: string;
  owner: string;
  group: string;
  size: number;
  mtime: string;
  isExecutable?: boolean;
  isSpell?: boolean;
  target?: string;
}

export function listDirectory(
  root: VFSDirectoryNode,
  cwd: string,
  targetPath: string,
  flags: { showAll: boolean; longFormat: boolean; humanReadable: boolean; classify: boolean }
): { entries?: ListDirEntry[]; totalBlocks?: number; error?: string; isSingleFile?: boolean; singleFileName?: string } {
  const path = targetPath ? targetPath.trim() : '.';
  const resolved = resolvePath(root, cwd, path, false);

  if (!resolved) {
    return { error: `ls: cannot access '${targetPath}': No such file or directory` };
  }

  let node = resolved.node;
  if (node.type === 'link') {
    const targetResolved = resolvePath(root, cwd, path, true);
    if (targetResolved && targetResolved.node.type === 'dir') {
      node = targetResolved.node;
    }
  }

  if (node.type !== 'dir') {
    const entry: ListDirEntry = {
      name: node.name,
      type: node.type,
      permissions: node.permissions,
      owner: node.owner,
      group: node.group,
      size: node.size,
      mtime: node.mtime,
      isExecutable: node.type === 'file' ? (node as VFSFileNode).isExecutable : false,
      isSpell: node.type === 'file' ? !!(node as VFSFileNode).spellName : false,
      target: node.type === 'link' ? (node as VFSSymlinkNode).target : undefined,
    };
    return { entries: [entry], totalBlocks: 1, isSingleFile: true, singleFileName: node.name };
  }

  const dir = node as VFSDirectoryNode;
  const rawEntries: ListDirEntry[] = [];

  if (flags.showAll) {
    rawEntries.push({
      name: '.',
      type: 'dir',
      permissions: 'drwxr-xr-x',
      owner: dir.owner,
      group: dir.group,
      size: 4096,
      mtime: dir.mtime,
    });
    rawEntries.push({
      name: '..',
      type: 'dir',
      permissions: 'drwxr-xr-x',
      owner: 'mage',
      group: 'mage',
      size: 4096,
      mtime: dir.mtime,
    });
  }

  const childKeys = Object.keys(dir.children).sort((a, b) => a.localeCompare(b));

  for (const name of childKeys) {
    const child = dir.children[name];
    const isHidden = name.startsWith('.');

    if (isHidden && !flags.showAll) {
      continue;
    }

    rawEntries.push({
      name,
      type: child.type,
      permissions: child.permissions,
      owner: child.owner,
      group: child.group,
      size: child.size,
      mtime: child.mtime,
      isExecutable: child.type === 'file' ? (child as VFSFileNode).isExecutable : false,
      isSpell: child.type === 'file' ? !!(child as VFSFileNode).spellName : false,
      target: child.type === 'link' ? (child as VFSSymlinkNode).target : undefined,
    });
  }

  const totalBlocks = Math.ceil(
    rawEntries.reduce((acc, e) => acc + (e.type === 'dir' ? 4 : Math.max(1, Math.ceil(e.size / 1024))), 0)
  );

  return { entries: rawEntries, totalBlocks };
}

export function readFile(
  root: VFSDirectoryNode,
  cwd: string,
  targetPath: string
): { content?: string; error?: string; spellName?: string; damage?: number; category?: string } {
  if (!targetPath) {
    return { error: 'cat: missing operand' };
  }

  const resolved = resolvePath(root, cwd, targetPath.trim(), true);
  if (!resolved) {
    const spellMatch = findSpellFile(root, cwd, targetPath.trim());
    if (spellMatch) {
      return {
        content: spellMatch.node.content,
        spellName: spellMatch.node.spellName,
        damage: spellMatch.node.damage,
        category: spellMatch.node.category,
      };
    }
    return { error: `cat: ${targetPath}: No such file or directory` };
  }

  if (resolved.node.type === 'dir') {
    return { error: `cat: ${targetPath}: Is a directory` };
  }

  const file = resolved.node as VFSFileNode;
  return {
    content: file.content,
    spellName: file.spellName,
    damage: file.damage,
    category: file.category,
  };
}

export function treeDirectory(
  root: VFSDirectoryNode,
  cwd: string,
  targetPath = '.',
  flags: { showAll: boolean; maxDepth?: number }
): { lines?: string[]; error?: string; dirsCount: number; filesCount: number } {
  const resolved = resolvePath(root, cwd, targetPath.trim(), true);
  if (!resolved) {
    return { error: `tree: '${targetPath}': No such file or directory`, dirsCount: 0, filesCount: 0 };
  }

  if (resolved.node.type !== 'dir') {
    return {
      lines: [resolved.node.name],
      dirsCount: 0,
      filesCount: 1,
    };
  }

  const lines: string[] = [targetPath];
  let dirsCount = 0;
  let filesCount = 0;

  function walk(dir: VFSDirectoryNode, prefix: string, depth: number) {
    if (flags.maxDepth !== undefined && depth > flags.maxDepth) return;

    let names = Object.keys(dir.children).sort((a, b) => a.localeCompare(b));
    if (!flags.showAll) {
      names = names.filter((n) => !n.startsWith('.'));
    }

    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const child = dir.children[name];
      const isLast = i === names.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const subPrefix = isLast ? '    ' : '│   ';

      let display = name;
      if (child.type === 'link') {
        display = `${name} -> ${(child as VFSSymlinkNode).target}`;
        filesCount++;
      } else if (child.type === 'dir') {
        dirsCount++;
      } else {
        filesCount++;
      }

      lines.push(`${prefix}${connector}${display}`);

      if (child.type === 'dir') {
        walk(child as VFSDirectoryNode, `${prefix}${subPrefix}`, depth + 1);
      }
    }
  }

  walk(resolved.node as VFSDirectoryNode, '', 1);

  return { lines, dirsCount, filesCount };
}

export function diffFiles(
  root: VFSDirectoryNode,
  cwd: string,
  path1: string,
  path2: string
): {
  lines?: Array<{ text: string; type: 'diff-header' | 'diff-add' | 'diff-del' | 'output' }>;
  error?: string;
  identical: boolean;
} {
  if (!path1 || !path2) {
    return { error: 'diff: missing operand', identical: false };
  }

  const res1 = resolvePath(root, cwd, path1.trim(), true);
  if (!res1) return { error: `diff: ${path1}: No such file or directory`, identical: false };
  if (res1.node.type === 'dir') return { error: `diff: ${path1}: Is a directory`, identical: false };

  const res2 = resolvePath(root, cwd, path2.trim(), true);
  if (!res2) return { error: `diff: ${path2}: No such file or directory`, identical: false };
  if (res2.node.type === 'dir') return { error: `diff: ${path2}: Is a directory`, identical: false };

  const file1 = res1.node as VFSFileNode;
  const file2 = res2.node as VFSFileNode;

  if (file1.content === file2.content) {
    return { identical: true, lines: [] };
  }

  const lines1 = file1.content.split('\n');
  const lines2 = file2.content.split('\n');

  const n = lines1.length;
  const m = lines2.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (lines1[i] === lines2[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  interface DiffItem {
    type: 'same' | 'del' | 'add';
    text: string;
  }
  const diffItems: DiffItem[] = [];

  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      diffItems.unshift({ type: 'same', text: lines1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffItems.unshift({ type: 'add', text: lines2[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diffItems.unshift({ type: 'del', text: lines1[i - 1] });
      i--;
    }
  }

  const output: Array<{ text: string; type: 'diff-header' | 'diff-add' | 'diff-del' | 'output' }> = [
    { text: `--- ${path1}`, type: 'diff-header' },
    { text: `+++ ${path2}`, type: 'diff-header' },
  ];

  for (const item of diffItems) {
    if (item.type === 'add') {
      output.push({ text: `+ ${item.text}`, type: 'diff-add' });
    } else if (item.type === 'del') {
      output.push({ text: `- ${item.text}`, type: 'diff-del' });
    } else {
      output.push({ text: `  ${item.text}`, type: 'output' });
    }
  }

  return { identical: false, lines: output };
}

export function findSpellFile(
  root: VFSDirectoryNode,
  cwd: string,
  target: string
): { spellName: string; node: VFSFileNode } | null {
  const clean = target.trim().replace(/^['"]|['"]$/g, '');

  const resolved = resolvePath(root, cwd, clean, true);
  if (resolved && resolved.node.type === 'file') {
    const file = resolved.node as VFSFileNode;
    if (file.spellName) {
      return { spellName: file.spellName, node: file };
    }
  }

  let found: { spellName: string; node: VFSFileNode } | null = null;
  function search(node: VFSNode) {
    if (found) return;
    if (node.type === 'file') {
      const f = node as VFSFileNode;
      if (f.spellName) {
        const matchesSpellName = f.spellName.toLowerCase() === clean.toLowerCase();
        const matchesFileName = f.name.toLowerCase() === clean.toLowerCase();
        const baseNameWithoutExt = f.name.toLowerCase().replace(/^\./, '').split('.')[0];
        const matchesBaseName = baseNameWithoutExt === clean.toLowerCase();

        if (matchesSpellName || matchesFileName || matchesBaseName) {
          found = { spellName: f.spellName, node: f };
        }
      }
    } else if (node.type === 'dir') {
      const d = node as VFSDirectoryNode;
      for (const k of Object.keys(d.children)) {
        search(d.children[k]);
        if (found) return;
      }
    }
  }

  search(root);
  return found;
}

export function getAutocompleteSuggestions(
  root: VFSDirectoryNode,
  cwd: string,
  linePrefix: string
): AutocompleteResult {
  const trimmed = linePrefix.trimStart();
  const tokens = trimmed.split(/\s+/);
  const isCommandToken = tokens.length <= 1 && !linePrefix.includes(' ');

  const KNOWN_COMMANDS = [
    'cd',
    'ls',
    'pwd',
    'tree',
    'diff',
    'cat',
    'cast',
    'clear',
    'help',
    'history',
    'echo',
    'whoami',
    'uname',
    'find',
  ];

  if (isCommandToken) {
    const query = tokens[0] || '';
    const suggestions = KNOWN_COMMANDS.filter((cmd) => cmd.startsWith(query));
    if (suggestions.length === 1) {
      return { completedText: suggestions[0] + ' ', suggestions };
    }
    return { completedText: linePrefix, suggestions };
  }

  if (tokens[0] === 'cast') {
    return { completedText: linePrefix, suggestions: [] };
  }

  const lastToken = tokens[tokens.length - 1] || '';
  const cleanToken = lastToken.replace(/^['"]/, '');

  let lookupDir = cwd;
  let prefix = cleanToken;

  if (cleanToken.includes('/')) {
    const lastSlash = cleanToken.lastIndexOf('/');
    const dirPart = cleanToken.slice(0, lastSlash + 1);
    prefix = cleanToken.slice(lastSlash + 1);
    lookupDir = getAbsolutePath(cwd, dirPart);
  }

  const resolved = resolvePath(root, cwd, lookupDir, true);
  if (!resolved || resolved.node.type !== 'dir') {
    return { completedText: linePrefix, suggestions: [] };
  }

  const dir = resolved.node as VFSDirectoryNode;

  const childNames = Object.keys(dir.children);

  const matches = childNames.filter((name) => name.toLowerCase().startsWith(prefix.toLowerCase()));

  if (matches.length === 0) {
    return { completedText: linePrefix, suggestions: [] };
  }

  if (matches.length === 1) {
    const match = matches[0];
    const isDir = dir.children[match].type === 'dir';
    const trailing = isDir ? '/' : ' ';
    const needsQuotes = match.includes(' ');

    let completion = match + trailing;
    if (needsQuotes) {
      completion = `"${match}"` + trailing;
    }

    const base = linePrefix.slice(0, linePrefix.length - lastToken.length);
    if (cleanToken.includes('/')) {
      const dirPart = cleanToken.slice(0, cleanToken.lastIndexOf('/') + 1);
      completion = needsQuotes ? `"${dirPart}${match}"${trailing}` : `${dirPart}${match}${trailing}`;
    }

    return { completedText: base + completion, suggestions: matches };
  }

  let common = matches[0];
  for (let k = 1; k < matches.length; k++) {
    while (!matches[k].toLowerCase().startsWith(common.toLowerCase()) && common.length > 0) {
      common = common.slice(0, -1);
    }
  }

  if (common.length > prefix.length) {
    const base = linePrefix.slice(0, linePrefix.length - lastToken.length);
    if (cleanToken.includes('/')) {
      const dirPart = cleanToken.slice(0, cleanToken.lastIndexOf('/') + 1);
      common = `${dirPart}${common}`;
    }
    return { completedText: base + common, suggestions: matches };
  }

  return { completedText: linePrefix, suggestions: matches };
}
