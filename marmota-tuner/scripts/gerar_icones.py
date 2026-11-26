#!/usr/bin/env python3
"""Gera os ícones dos dois apps a partir da marmota em pixel do site (public/marmota-52x42.png).

Cada pixel da marmota vale 1 dp num ícone adaptativo de 108 dp: ela (52×42) senta no pé do ícone, como na home do site, e o
ícone 16×16 da ferramenta (os mesmos de src/components/ToolIcon.tsx) fica em cima, a 2×, dentro da área segura de 66 dp. O fundo
muda por app (verde no Tuner, roxo no Trainer): de relance, a cor e o desenho grande dizem qual é qual.
Tudo vira VectorDrawable (um path por cor, pixels juntos em faixas por linha): nítido em toda densidade, sem PNG por dpi.

Escreve, em app/ (Tuner) e trainer/ (Trainer):
  res/drawable/ic_launcher_foreground.xml   marmota colorida + ícone da ferramenta em marfim
  res/drawable/ic_launcher_monochrome.xml   ícone temático (Android 13+): o pelo cheio, os traços escuros vazados
  res/values/icone.xml                      a cor de fundo do app

Uso, na pasta marmota-tuner/:  python3 scripts/gerar_icones.py   (precisa de Pillow)
"""
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
MARMOTA = RAIZ.parent / "public" / "marmota-52x42.png"

# Um fundo por app, para não abrir o errado: verde no Tuner (o "afinado" do app, como no ícone antigo) e roxo no Trainer.
FUNDO = {"app": "#FF17543A", "trainer": "#FF3A2A86"}
MARFIM = "#FFDBDCD6"  # --ink do site
# Os dois tons mais escuros da arte são os traços (olho, bigodes, contorno de dentro): no ícone temático ficam vazados.
TRACOS = {(0x1E, 0x28, 0x27), (0x36, 0x32, 0x2E)}

MX, MY = 28, 56  # canto da marmota: centrada, com a base passando do círculo visível (a máscara corta, como um busto)
IE = 2  # o ícone da ferramenta a 2× (cada pixel dele = 2 dp): é o que diferencia os apps de relance
IX, IY = 38, 21  # canto do ícone (32×32 dp), centrado em cima da cabeça, dentro do círculo seguro de 66 dp

ICONES = {
    # Mostrador com a agulha (afinador).
    "app": """
................
................
.....######.....
...##......##...
..#..........#..
.#.#........#.#.
.#............#.
#..........##..#
#.........##...#
#........##....#
#.......##.....#
#......###.....#
......####......
.......##.......
................
................""",
    # Fone de ouvido (treino de ouvido e de voz).
    "trainer": """
................
.....######.....
...##......##...
..#..........#..
.#............#.
.#............#.
#..............#
#..............#
#..............#
###..........###
####........####
####........####
####........####
####........####
.##..........##.
................""",
}


def faixas(pontos):
    """Junta pixels (x, y) em faixas horizontais e devolve o pathData."""
    por_linha = {}
    for x, y in pontos:
        por_linha.setdefault(y, []).append(x)
    partes = []
    for y in sorted(por_linha):
        xs = sorted(por_linha[y])
        ini = ant = xs[0]
        for x in xs[1:] + [None]:
            if x is not None and x == ant + 1:
                ant = x
                continue
            w = ant - ini + 1
            partes.append(f"M{ini},{y}h{w}v1h-{w}z")
            if x is not None:
                ini = ant = x
    return "".join(partes)


def vetor(caminhos, comentario):
    corpo = "\n".join(f'    <path android:fillColor="{cor}" android:pathData="{d}" />' for cor, d in caminhos)
    return f"""<?xml version="1.0" encoding="utf-8"?>
<!-- {comentario} Gerado por scripts/gerar_icones.py; não edite à mão. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
{corpo}
</vector>
"""


def main():
    arte = Image.open(MARMOTA).convert("RGBA")
    w, h = arte.size
    por_cor, pelo = {}, []
    for y in range(h):
        for x in range(w):
            r, g, b, a = arte.getpixel((x, y))
            if a == 0:
                continue
            por_cor.setdefault((r, g, b), []).append((MX + x, MY + y))
            if (r, g, b) not in TRACOS:
                pelo.append((MX + x, MY + y))
    for modulo, grade in ICONES.items():
        linhas = grade.strip("\n").split("\n")
        ferramenta = [(IX + x * IE + i, IY + y * IE + j) for y, l in enumerate(linhas) for x, c in enumerate(l) if c == "#"
                      for j in range(IE) for i in range(IE)]
        res = RAIZ / modulo / "src" / "main" / "res"
        cores = [(f"#FF{r:02X}{g:02X}{b:02X}", faixas(p)) for (r, g, b), p in sorted(por_cor.items())]
        (res / "drawable" / "ic_launcher_foreground.xml").write_text(vetor(
            cores + [(MARFIM, faixas(ferramenta))],
            "A marmota em pixel do site (public/marmota-52x42.png), 1 pixel = 1 dp, e o ícone da ferramenta."))
        (res / "drawable" / "ic_launcher_monochrome.xml").write_text(vetor(
            [("#FFFFFFFF", faixas(pelo + ferramenta))],
            "Ícone temático (Android 13+): o launcher pinta o alfa; o pelo é cheio e os traços escuros ficam vazados."))
        (res / "values" / "icone.xml").write_text(f"""<?xml version="1.0" encoding="utf-8"?>
<!-- Gerado por scripts/gerar_icones.py. -->
<resources>
    <color name="icone_fundo">{FUNDO[modulo]}</color>
</resources>
""")
        print(f"{modulo}: ok")


if __name__ == "__main__":
    main()
