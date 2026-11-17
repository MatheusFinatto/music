# Laboratório (site antigo, congelado)

Diário do Solo e Piano de Ideias: treino de improviso na guitarra, Vite + JavaScript puro. Servido em `/laboratorio` pelo site novo. **Será redesenhado como ferramenta do site novo; aqui só entra correção.** Não porte código novo para cá e não importe nada daqui em `src/`.

Antes de mexer, leia `legacy/docs/PREFERENCIAS.md` (combinados com o dono, seguir à risca) e `legacy/docs/ARQUITETURA.md`. `legacy/docs/PROGRESSO.md` é o acompanhamento pessoal do dono: atualize ao avaliar ideias dele.

## Regras rápidas
- Texto em português do Brasil, direto.
- Notas no formato **C4, A4, Bb3**. Nunca "Dó, Ré, Mi" na interface.
- **Laranja = nota-alvo**, **azul = tocando agora**, **verde = selecionado**.
- Partitura, tab e cifra só sob demanda (botão).
- Dados em `localStorage`, prefixo `musica:`. Não mude o formato: há dados reais salvos.
- Links internos começam com `/laboratorio/`.

## Comandos (rodar na raiz do repo)
```bash
npm run dev:lab     # Vite do Laboratório, com recarga
npm run check       # valida o plano de 57 dias e os desafios
npm run build:lab   # gera public/laboratorio/
```
