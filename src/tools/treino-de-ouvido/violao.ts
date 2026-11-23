// Onde as notas ficam no violão. Puro (sem tela).
/** MIDI das cordas soltas, da 1ª (mais fina) à 6ª: e B G D A E. */
export const ABERTAS = [64, 59, 55, 50, 45, 40] as const;
export const CASAS = 12;
export type Pos = { corda: number; casa: number; midi: number };

/** Todas as posições de uma nota nas primeiras casas, da mais à frente para trás. */
export function posicoesDe(midi: number): Pos[] {
  const out: Pos[] = [];
  ABERTAS.forEach((solta, corda) => { const casa = midi - solta; if (casa >= 0 && casa <= CASAS) out.push({ corda, casa, midi }); });
  return out.sort((a, b) => a.casa - b.casa);
}

/** A posição mais à frente do braço (menor casa), ou null se a nota não cabe nas 12 primeiras casas. */
export const melhorPosicao = (midi: number): Pos | null => posicoesDe(midi)[0] ?? null;

/**
 * Um acorde no violão: **uma nota por corda**, as mais graves nas cordas mais grossas, numa forma que cabe na mão (casas
 * apertadas num espaço de até 4) e o mais à frente do braço possível. Ex.: C maior (C3 E3 G3) vira corda 5 casa 3, corda 4
 * casa 2, corda 3 solta. Se o acorde não cabe nesta oitava (as notas pedem casas além da 12), a mesma forma é buscada uma oitava
 * abaixo (ou acima): no violão é o mesmo acorde, só mais grave. Devolve null se não cabe em nenhuma.
 */
export function acordeNoBraco(midis: readonly number[]): Pos[] | null {
  for (const desloca of [0, -12, 12, -24]) {
    const f = formaDoAcorde(midis.map((m) => m + desloca));
    if (f) return f;
  }
  return null;
}

function formaDoAcorde(midis: readonly number[]): Pos[] | null {
  const notas = [...new Set(midis)].sort((a, b) => a - b);
  const opcoes = notas.map(posicoesDe);
  if (opcoes.some((o) => o.length === 0)) return null;
  let melhor: Pos[] | null = null, custoMelhor = Infinity;
  const escolhe = (i: number, atual: Pos[]) => {
    if (i === notas.length) {
      const apertadas = atual.filter((p) => p.casa > 0).map((p) => p.casa);
      const vao = apertadas.length ? Math.max(...apertadas) - Math.min(...apertadas) : 0;
      const custo = (vao > 4 ? 100 : 0) + vao * 10 + atual.reduce((s, p) => s + p.casa, 0);
      if (custo < custoMelhor) { custoMelhor = custo; melhor = [...atual]; }
      return;
    }
    // da mais grave para a mais aguda, a corda só pode ficar mais fina (índice menor) e nunca repetir
    for (const p of opcoes[i]!) if (i === 0 || p.corda < atual[i - 1]!.corda) escolhe(i + 1, [...atual, p]);
  };
  escolhe(0, []);
  return melhor;
}

/** A forma de um arpejo: todas as posições das notas dele (qualquer oitava) numa janela de 5 casas, a mais à frente possível. */
export type Forma = { posicoes: (Pos & { raiz: boolean })[]; de: number; ate: number };
export function formaDoArpejo(midis: readonly number[]): Forma | null {
  if (midis.length === 0) return null;
  const classes = new Set(midis.map((m) => ((m % 12) + 12) % 12));
  const raiz = ((midis[0]! % 12) + 12) % 12;
  for (let de = 0; de <= CASAS - 4; de++) {
    const ate = de + 4;
    const posicoes: Forma["posicoes"] = [];
    ABERTAS.forEach((solta, corda) => {
      for (let casa = de === 0 ? 0 : de; casa <= ate; casa++) {
        const midi = solta + casa, pc = midi % 12;
        if (classes.has(pc)) posicoes.push({ corda, casa, midi, raiz: pc === raiz });
      }
    });
    if ([...classes].every((c) => posicoes.some((p) => p.midi % 12 === c))) return { posicoes, de, ate };
  }
  return null;
}
