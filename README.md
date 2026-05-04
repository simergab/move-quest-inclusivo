# Move Quest Inclusivo

Jogo web que usa a camera do dispositivo para reconhecer movimentos corporais com MediaPipe Pose, avatar evolutivo e salas com ranking entre colegas.

## Como jogar

1. Abra o site publicado em HTTPS.
2. Digite seu nome.
3. Crie uma sala ou entre com o codigo de uma sala criada por um colega.
4. Escolha um modo: Corrida virtual, Jogo de danca, Desafios ou Adaptado.
5. Inicie a camera e fique parado ate terminar a calibracao.
6. Faca o movimento mostrado na tela para ganhar pontos.

## Sensor de movimentos

O jogo nao soma pontos quando a camera nao reconhece corpo inteiro com confianca suficiente. A pontuacao so acontece depois da calibracao e quando o movimento passa por regras baseadas nos pontos corporais detectados pela camera.

## Multiplayer

O ranking em tempo real usa o servidor `server.js`. Em hospedagem estatica, como GitHub Pages, a interface abre, mas a sala compartilhada fica local. Para jogar com colegas em dispositivos diferentes, publique no Render como Web Service Node.

## Deploy no Render

Este projeto ja inclui `render.yaml`.

- Runtime: Node
- Start Command: `node server.js`
- Branch: `main`

