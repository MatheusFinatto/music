# Afinador (Android)

Afinador cromático de uma tela só, para guitarra. Toque uma corda: o nome da nota (ex.: **B3**), a frequência e uma agulha mostram quanto ela está desafinada (−50 a +50 cents). A agulha fica **verde** dentro de ±5 cents. A4 = 440 Hz.

Cores iguais às do site: **laranja = alvo** (nota e marca central), **azul = o que está soando** (agulha e nível do microfone).

## Comandos
```bash
export JAVA_HOME=/usr/lib/jvm/jdk-17-oracle-x64   # ou o JBR do Android Studio
./gradlew testDebugUnitTest     # testes (detecção de nota, suavização, layout)
./gradlew assembleDebug         # APK em app/build/outputs/apk/debug/app-debug.apk
~/Android/Sdk/platform-tools/adb install -r app/build/outputs/apk/debug/app-debug.apk
```
Ou abra a pasta `afinador/` no Android Studio e aperte Run.

Teste visual sem microfone (emulador; só existe no build debug):
```bash
adb shell am start -n br.musica.afinador/.DemoToneActivity --ef hz 241.9
```

## Como funciona
| Arquivo | Papel |
|---|---|
| `AudioCapture` | Lê o microfone (44,1 kHz, float) numa thread própria. |
| `PitchPipeline` | Janela deslizante + porta de silêncio + nível do microfone. |
| `YinPitchDetector` | Detecção de frequência (YIN). Não erra a oitava quando os harmônicos são mais fortes que a fundamental (corda E grave). |
| `PitchSmoother` | Mediana de 3 + suavização; nota nova pula direto. |
| `NoteMapper` | Hz → nota, oitava (C4 = Dó central) e cents. |
| `TunerView` / `TunerPainter` / `TunerGeometry` | Desenho da tela (Canvas, sem bibliotecas). |
| `NeedleAnimator` | Movimento suave da agulha, igual em telas de 60 e 120 Hz. |

Sem AndroidX nem bibliotecas: o APK tem menos de 1 MB. Versões: AGP 9.5 / Gradle 9.6 (Android Studio Rabbit 2), compileSdk 35, minSdk 26 (Android 8).
