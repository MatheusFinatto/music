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

O código de `core/` não pode usar nada só da JVM (`Math.*`, `System.*`, `java.*`): use o equivalente de `kotlin.math` e da biblioteca padrão. Tudo em `core/` é exportado para o TypeScript (`@file:JsExport`); por isso a API pública usa `Double` no lugar de `Long`.

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
| `MetronomeActivity` | app | Tela do metrônomo (figura, tempos, favoritos, roda de bpm, Tap, Timer com contagem grande e pausa, ▶ ❚❚ ■); mistura os cliques num AudioTrack amostra por amostra, então o tempo não depende da tela. |
| `BpmWheel` | app | A roda de bpm: arrastar, arremessar, assenta num número inteiro, com vibração a cada número. |
| `FigureDrawable` | app | Desenha a figura rítmica. Mesmas medidas de `src/tools/metronomo/Figure.tsx` no site: mudou uma, mude a outra. |

Sem AndroidX nem bibliotecas: o APK tem menos de 1 MB. Versões: AGP 9.5 / Gradle 9.6 (Android Studio Rabbit 2), Kotlin 2.2.10 (o mesmo do AGP, também no `core/`), compileSdk 35, minSdk 26 (Android 8).
