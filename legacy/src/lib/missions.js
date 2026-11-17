// Missões do Piano de Ideias e os exemplos (base padrão Am F C G, tom de Dó).
// Exemplos: notas em MIDI (60 = C4), b = tempo de início (0..15.75), d = duração em tempos.
export const WEEKS=["Notas-alvo","Bends para o alvo","Ritmo e espaço","Motivos","Pergunta e resposta","Cor: 9ª e 6ª","O arco do solo","Juntar tudo"];
export const DEMOS={
  w1a:{name:"Exemplo: só as 3ªs", prog:["Am","F","C","G"], bpm:72, notes:[
    {m:60,b:0,d:4},{m:69,b:4,d:4},{m:64,b:8,d:4},{m:59,b:12,d:4}]},
  w2a:{name:"Exemplo: 3ª do C chegando de um tom abaixo", prog:["Am","F","C","G"], bpm:72, notes:[
    {m:62,b:8,d:1},{m:64,b:9,d:3}]},
  w6a:{name:"Exemplo: 9ª do Am chegando de um tom abaixo", prog:["Am","F","C","G"], bpm:72, targets:["9"], notes:[
    {m:69,b:0,d:1},{m:71,b:1,d:3}]},
  w1:{name:"Exemplo: caindo nas 3ªs", prog:["Am","F","C","G"], bpm:72, notes:[
    {m:60,b:0,d:2},{m:64,b:2,d:1},{m:67,b:3,d:1},
    {m:69,b:4,d:2},{m:72,b:6,d:1},{m:67,b:7,d:1},
    {m:64,b:8,d:2},{m:60,b:10,d:1},{m:57,b:11,d:1},
    {m:59,b:12,d:2},{m:57,b:14,d:1},{m:59,b:15,d:1}]}
};
export const MISS=[
 [["piano","Com a base tocando, toque só a 3ª de cada acorde, uma nota longa por compasso, entrando no tempo 1. Uma volta inteira.","w1a"],
  ["piano","Ouça o exemplo abaixo com a base. Repare na regra: cada compasso começa na 3ª e as duas notas do fim levam até a próxima.","w1"],
  ["piano","Toque o exemplo uma vez junto com a base. Depois feche a partitura e invente 3 versões suas com a mesma regra: 3ª no tempo 1, duas notas levando até a próxima. Grave a que você mais gostar."],
  ["guitarra","Toque a sua versão gravada na guitarra. Depois improvise com a mesma regra, sem olhar nada."],["ouvir","5 min no Functional Ear Trainer (app de celular), no nível em que você estiver."]],
 [["piano","Grave uma ideia com uma nota longa na 3ª do C, chegando de um tom abaixo. É ali que vai o bend.","w2a"],["ouvir","Ouça o solo de Time (Pink Floyd) só curtindo, prestando atenção nas notas longas."],["guitarra","Toque a ideia chegando na nota longa com bend."],["ouvir","5 min no Functional Ear Trainer (app de celular), no nível em que você estiver."]],
 [["piano","Grave uma ideia com no máximo 5 notas."],["piano","Grave uma ideia que comece depois do tempo 1."],["guitarra","Toque uma das duas na guitarra."],["ouvir","5 min no Functional Ear Trainer (app de celular), no nível em que você estiver."]],
 [["piano","Grave 3 notas e repita as mesmas 3 nos 4 acordes."],["ouvir","Ouça a introdução de Shine On You Crazy Diamond e repare na mesma ideia voltando."],["guitarra","Toque o seu motivo na guitarra, mudando só o ritmo."],["ouvir","5 min no Functional Ear Trainer (app de celular), no nível em que você estiver."]],
 [["piano","Grave uma ideia que toca 2 compassos e fica calada nos outros 2."],["ouvir","5 min no Functional Ear Trainer (app de celular), no nível em que você estiver."],["guitarra","Toque a ideia e improvise uma resposta nos 2 compassos vazios."]],
 [["piano","Ligue \"Notas de cor\" e grave uma ideia que segura a 9ª do Am, chegando de um tom abaixo.","w6a"],["ouvir","5 min no Functional Ear Trainer. Se já acerta quase tudo, suba um nível."],["guitarra","Toque a ideia chegando na 9ª com bend de um tom."]],
 [["piano","Grave uma ideia de final: descendo até o Lá e segurando."],["piano","Escolha 2 ideias que combinam e marque as duas com ★."],["guitarra","Toque as duas ★ em sequência, como um pedaço de solo."],["ouvir","5 min no Functional Ear Trainer (app de celular), no nível em que você estiver."]],
 [["piano","Revise suas ideias e deixe só as 3 melhores com ★."],["ouvir","5 min no Functional Ear Trainer. Compare o nível de hoje com o de quando você começou."],["guitarra","Use as 3 favoritas no improviso da gravação final do Diário."]]
];
