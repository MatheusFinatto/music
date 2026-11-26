---
id: 001
slug: conta-e-sincronizacao
status: implemented
criada: 2026-11-26
---

# Conta opcional (Google) e sincronização entre site, Marmota Tuner e Marmota Trainer

## Objetivo
Quem quiser entra com o Google e o progresso passa a valer em qualquer navegador e nos dois apps. Quem não entrar não
percebe diferença nenhuma. Substitui o "baixar/restaurar JSON" da home.

## Restrições (do dono)
- **Opcional.** Nada pede login; nada muda para quem não entra.
- **Sem perda de qualidade nos apps.** Abrir o app leva o mesmo tempo de hoje; nenhuma tela espera rede.
- **Grátis.** Firebase no plano Spark (Auth + Firestore). Sem anúncio, sem paywall (ver memória "grátis para sempre").
- Login **só com Google**.

## Decisões
1. **Os dados continuam locais e são a fonte.** Site: `localStorage` (`musica:<chave>`). Apps: `SharedPreferences("musica")`
   com as mesmas chaves e o mesmo JSON do site (o Trainer já é assim; o Tuner migra, ver 6). A nuvem é cópia sincronizada.
   Quem não entra usa só o local, como hoje, para sempre (dono, 2026-11-26). "Sair" não apaga nada do aparelho: só para
   de sincronizar. "Apagar meus dados" apaga a nuvem e a conta; o que está no aparelho fica.
2. **Sem SDK do Firebase no Android.** O SDK se inicia sozinho na abertura do app (ContentProvider) e soma MB ao APK.
   Os apps falam com o Firebase pela API REST:
   - login: Credential Manager (`androidx.credentials` + `googleid`) devolve o token do Google →
     `identitytoolkit accounts:signInWithIdp` → token do Firebase + refresh token (guardados nas prefs);
   - dados: Firestore REST, em thread de fundo, com `HttpURLConnection`.
   Nada disso roda no `onCreate`: só ao tocar em "Entrar" e na sincronização em segundo plano (ver 5).
3. **Site:** `firebase/auth` + `firebase/firestore/lite`, carregados com `import()` só quando a pessoa toca em "Entrar"
   ou, se já entrou antes, com a página ociosa. Quem nunca entrou não baixa nada do Firebase.
4. **Modelo no Firestore:** `usuarios/{uid}/chaves/{chave}` = `{ json: string, em: number, dispositivo: string }`
   (`em` = hora local da última mudança, em ms). Regras: cada um só lê e grava `usuarios/{seu uid}/**`.
   Chaves sincronizadas: `metronomo-favoritos`, `treino-de-ouvido`, `treino-de-ouvido-voz`, `treino-de-ouvido-ritmo`,
   `treino-de-ouvido-instrumento`, `treino-diario` (ver 7).
   **Não** sincroniza: `metronomo` (andamento atual: é do aparelho), as chaves do Laboratório (`base`, `diario`).
5. **Quando sincroniza:** com a pessoa logada, (a) ao abrir/voltar para a página ou app, depois do primeiro quadro,
   em segundo plano; (b) 3 s depois de uma mudança local; (c) ao sair (site: `visibilitychange`; app: `onPause`).
   Falhou (sem rede)? Tenta na próxima. Nunca trava a tela.
6. **Tuner migra para o formato do site:** favoritos (`getPreferences().favorites`, texto `"a;b"`) e o favorito ativo viram
   `musica:metronomo-favoritos` no JSON do site, uma vez, na primeira abertura da versão nova. Leitura antiga continua
   valendo se a migração falhar.
7. **Conflito:** por chave, vence a mudança mais recente (`em`).
   - **Registro diário** não pode ser "o mais novo vence" (treino no app e no site no mesmo dia perderia um dos dois).
     Cada aparelho grava o seu em `treino-diario~{dispositivo}`; o cartão "Hoje" soma o local com as cópias dos outros
     aparelhos. Lógica da soma no Kotlin (`core`, `Diario.kt`), exportada para o site.
   - **Histórico do reforço** (`treino-de-ouvido.historico`): fica no "mais novo vence". Só perde algo se a pessoa treinar
     em dois aparelhos sem rede ao mesmo tempo; o efeito é o reforço esquecer alguns erros. Aceito pelo dono (2026-11-26).
8. **Lógica comum no Kotlin** (`marmota-tuner/core`, pacote novo `conta`): decidir puxar/empurrar por chave, soma dos
   registros diários, conversão dos favoritos antigos do Tuner. Exportada para o site como o resto (`exportToSite`).
9. **Interface** (dono, 2026-11-26):
   - **O botão é só o "G" do Google**, colorido, sem texto, bem singelo. Tocar abre **um modal só** (dono, 2026-11-26): na
     primeira linha a ação ("Entrar com Google"; logado: o e-mail, "Sair" e "Apagar meus dados"), para quem só quer entrar;
     embaixo, para quem quer ler, o texto ("seu progresso vai junto do computador pro celular, seja no navegador ou nos
     apps… você nunca vai receber e-mail nosso") e "O que fica guardado". Sem página à parte.
   - **Apps:** o "G" fica na barra de baixo, junto das abas, nos dois apps. Logado, no lugar do "G", um ícone de conta de
     traço liso (o mesmo padrão dos outros ícones da barra).
   - **Site:** no celular, a barra do app (`AppNav`) ganha o mesmo "G" (o site espelha os apps). Na home, o "G" fica onde
     hoje está "Backup de dados", no rodapé; no desktop das ferramentas, no rodapé também.
   - O "G" segue a marca do Google (as quatro cores, sem alterar o desenho), em SVG no próprio código.
10. **LGPD:** o "O que fica guardado" do próprio modal diz o que guarda (e-mail e os dados acima), onde (Firebase/Google) e
   como apagar. "Apagar meus dados" apaga todos os documentos e a conta no Firebase.
11. **Configuração (pública, não é segredo):** site em `NEXT_PUBLIC_FIREBASE_*` (Vercel); apps em `gradle.properties`
    (API key e Web client ID) → `BuildConfig`. A proteção dos dados são as regras do Firestore.

## Fora de escopo
Outros provedores de login; sincronizar o Laboratório; compartilhar entre pessoas; ranking.

## O que só o dono faz
1. Criar o projeto no console do Firebase (Spark).
2. Authentication → provedor Google ativo; domínios autorizados: `marmota-music.vercel.app` (previews da Vercel não
   entram: domínio aleatório).
3. Firestore em modo produção, região `southamerica-east1`.
4. Registrar o app web e mandar o objeto de configuração.
5. Registrar dois apps Android (`br.musica.marmotatuner`, `br.musica.marmotaear`) com o SHA-1 da chave de release
   (eu tiro o SHA-1 da keystore e passo).

## Plano (commits na branch `fix/sem-setas`, um por etapa)
1. Kotlin `core/conta` + testes; `exportToSite`.
2. Site: carimbo `em` por chave no `createStore`; módulo de sincronização; login; troca do backup; regras.
3. Tuner 1.9: migração dos favoritos; login e sincronização por REST.
4. Trainer 1.6: login e sincronização por REST; "Hoje" soma os aparelhos.
5. Releases dos dois apps.

## Critérios de aceitação
- Sem login: site e apps idênticos aos de hoje (mesmo comportamento, nada de Firebase baixado no site).
- Abrir os apps: o `onCreate` não faz rede nem carrega classe de conta; tempo de abertura igual (conferido no aparelho).
- Favorito criado no site aparece no Tuner (e o contrário) depois de abrir o outro.
- Treino no app e no site no mesmo dia: o "Hoje" mostra a soma nos dois.
- Sem rede: tudo funciona; sincroniza quando voltar.
- "Apagar meus dados" deixa o Firestore sem nada do uid.
- lint, typecheck, check, test, build, testes do `core` e `exportToSite` sem diferença pendente.
