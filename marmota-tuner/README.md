# Marmota Tuner (Android)

Afinador e metrônomo. O metrônomo (`MetronomeActivity`, aberto pelo botão "Metrônomo" no canto do afinador) usa a mesma conta de cliques e o mesmo som do metrônomo do site (`core/Metronome.kt`).

Afinador cromático de uma tela só, para guitarra. Toque uma corda: o nome da nota (ex.: **B3**), a frequência e uma agulha mostram quanto ela está desafinada (−50 a +50 cents). A agulha fica **verde** dentro de ±5 cents. A4 = 440 Hz.

Cores iguais às do site: **laranja = alvo** (nota e marca central), **azul = o que está soando** (agulha e nível do microfone).

## Comandos
```bash
export JAVA_HOME=/usr/lib/jvm/jdk-17-oracle-x64   # ou o JBR do Android Studio
./gradlew :core:jvmTest         # testes da lógica (detecção de nota, suavização, layout)
./gradlew assembleDebug         # APK em app/build/outputs/apk/debug/app-debug.apk
./gradlew :core:exportToSite    # recompila a lógica para JS e copia para o site (src/core/pitch/generated)
~/Android/Sdk/platform-tools/adb install -r app/build/outputs/apk/debug/app-debug.apk
```
Ou abra a pasta `marmota-tuner/` no Android Studio e aperte Run.

Teste visual sem microfone (emulador; só existe no build debug):
```bash
adb shell am start -n br.musica.marmotatuner/.DemoToneActivity --ef hz 241.9
```

## Uma lógica, dois afinadores
O app tem dois módulos:
- **`core/`**: a lógica, em Kotlin puro (Kotlin Multiplatform). Compila para a JVM, que o app usa, e para JavaScript, que o site usa em `/afinador`.
- **`app/`**: o que é só do Android (microfone, tela, permissões).

Mudou algo em `core/src/commonMain`? Rode `./gradlew :core:exportToSite` e commite o JS que mudou em `src/core/pitch/generated/` junto. A Vercel não tem JDK, então o site usa o JS commitado; a CI recompila e falha se ele estiver velho. O desenho da tela não é compartilhado: `TunerPainter.kt` aqui, `src/tools/afinador/painter.ts` no site.

A lógica do treino tem fixtures (`core/src/jvmTest/resources/treino-fixtures.json`: sementes fixas, todas as combinações de exercício), conferidas dos dois lados: `TreinoParidadeTest` na JVM e `src/tools/treino-de-ouvido/paridade.test.ts` no JS compilado. Mudou uma regra de propósito? `./gradlew :core:exportToSite`, depois `ATUALIZAR_FIXTURES=1 npx vitest run paridade` na raiz do site, e `./gradlew :core:jvmTest`.

O código de `core/` não pode usar nada só da JVM (`Math.*`, `System.*`, `java.*`): use o equivalente de `kotlin.math` e da biblioteca padrão. Tudo em `core/` é exportado para o TypeScript (`@file:JsExport`); por isso a API pública usa `Double` no lugar de `Long`.

## Marmota Trainer (`trainer/`)
O segundo app (`br.musica.marmotaear`): o treino de ouvido e de voz do site (`/treino-de-ouvido`, `/treino-de-voz`) no celular, com a cara do Tuner (paleta de `colors.xml`, pílulas, folhas no centro, barra flutuante Ouvido | Voz). Mesma lógica do site (`core/treino`), mesmos textos (gerados de `messages/pt-BR.json` no build) e as mesmas amostras de piano (copiadas de `public/sons/piano` no build). Os dados ficam em `SharedPreferences`, no mesmo formato JSON do `localStorage` do site.

```bash
./gradlew :trainer:assembleDebug
adb install -r trainer/build/outputs/apk/debug/trainer-debug.apk
# Sem microfone (emulador; só no build debug): uma voz falsa canta perto do alvo, para ver o gráfico e a pista.
adb shell am start -n br.musica.marmotaear/.MainActivity --ez simular true
```

| Arquivo | Papel |
|---|---|
| `MainActivity` | Barra de cima, rolagem, a barra Ouvido \| Voz (some enquanto se canta), permissão do microfone, Voltar. |
| `ProgramaView` (`SecaoView`) | Programa por tempo ou Exercícios, igual ao `Programas.tsx`. |
| `OuvidoView` | Os 7 exercícios de ouvido, ajustes e pontos fracos. |
| `VozView` / `VozVistas` | Os exercícios de voz, o gráfico da voz e o afinômetro (`grafico.ts` e `Afinometro.tsx` no site). |
| `CantarView` | Cantar músicas: a pista, a contagem e a letra (`Cantar.tsx` e `pista.ts`). |
| `Palco` | As peças de desenho que o gráfico e a pista dividem (`palco.ts`). Mudou um, mude o outro. |
| `Piano` | O piano amostrado num AudioTrack (mesma afinação e envelope do site), com o bordão. |
| `Instrumentos` | Teclado e braço do violão em Canvas. |
| `Ui` | Cores, tipos, botões, pílulas, folhas e ícones. |

## Publicar
A página `/afinador` do site baixa `https://github.com/MatheusFinatto/music/releases/latest/download/marmota-tuner.apk`. Para publicar uma versão: gere o APK, renomeie para `marmota-tuner.apk` e anexe a um Release do GitHub marcado como o mais recente. O nome do arquivo tem que ser exatamente esse.

## Como funciona
| Arquivo | Módulo | Papel |
|---|---|---|
| `AudioCapture` | app | Lê o microfone (44,1 kHz, float) numa thread própria. |
| `PitchPipeline` | core | Janela deslizante + porta de silêncio + nível do microfone. |
| `YinPitchDetector` | core | Detecção de frequência (YIN). Não erra a oitava quando os harmônicos são mais fortes que a fundamental (corda E grave). |
| `PitchSmoother` | core | Mediana de 3 + suavização; nota nova pula direto. |
| `NoteMapper` | core | Hz → nota, oitava (C4 = Dó central) e cents. |
| `TunerView` / `TunerPainter` | app | Desenho da tela (Canvas, sem bibliotecas). |
| `TunerGeometry` / `TunerScene` | core | Onde cada coisa fica na tela e o que mostrar; o site usa as mesmas. |
| `NeedleAnimator` | core | Movimento suave da agulha, igual em telas de 60 e 120 Hz. |
| `Metronome` / `ClickSound` / `TapTempo` | core | Quando cada clique soa (tempos, acento forte/normal/mudo por tempo), o som do clique, o aviso do timer e o andamento pelo toque. O site usa os mesmos em `/metronomo`. |
| `Subdivisions` | core | As divisões do tempo (semínima, colcheias, tercina, galope, pontuada, shuffle…): onde cai cada clique e as notas para desenhar a figura. O id é o que se salva. |
| `treino/` (`Engine`, `Voz`, `Programas`, `Cantar`, `Violao`) | core | A lógica do treino de ouvido e de voz do site (sorteio das perguntas, segurar a nota, alcance, programas por tempo, cantar músicas, posições no violão). As tabelas vêm de `src/tools/treino-de-ouvido/dados.json` e `musicas.json`, convertidas em Kotlin pela tarefa `:core:generateTreinoData`. |
| `MetronomeActivity` | app | Tela do metrônomo (figura, tempos, favoritos, roda de bpm, Tap, Timer com contagem grande e pausa, ▶ ❚❚ ■); mistura os cliques num AudioTrack amostra por amostra, então o tempo não depende da tela. |
| `BpmWheel` | app | A roda de bpm: arrastar, arremessar, assenta num número inteiro, com vibração a cada número. |
| `FigureDrawable` | app | Desenha a figura rítmica. Mesmas medidas de `src/tools/metronomo/Figure.tsx` no site: mudou uma, mude a outra. |

Sem AndroidX nem bibliotecas: o APK tem menos de 1 MB. Versões: AGP 9.5 / Gradle 9.6 (Android Studio Rabbit 2), Kotlin 2.2.10 (o mesmo do AGP, também no `core/`), compileSdk 35, minSdk 26 (Android 8).
