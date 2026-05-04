# Move Quest Inclusivo

Jogo web que usa a câmera do dispositivo para reconhecer movimentos corporais com MediaPipe Pose, avatar evolutivo e salas com ranking entre colegas.

## Como jogar

1. Abra o site publicado em HTTPS.
2. Digite seu nome.
3. Crie uma sala ou entre com o código de uma sala criada por um colega.
4. Escolha um modo: Corrida virtual, Jogo de dança, Desafios ou Adaptado.
5. Inicie a câmera e fique parado até terminar a calibração.
6. Faça o movimento mostrado na tela para ganhar pontos.

## Sensor de movimentos

O jogo não soma pontos quando a câmera não reconhece corpo inteiro com confiança suficiente. A pontuação só acontece depois da calibração e quando o movimento passa por regras baseadas nos pontos corporais detectados pela câmera.

## Multiplayer

O ranking em tempo real usa o servidor `server.js`. Em hospedagem estática, como GitHub Pages, a interface abre, mas a sala compartilhada fica local. Para jogar com colegas em dispositivos diferentes, publique no Render como Web Service Node.

## Deploy no Render

Este projeto ja inclui `render.yaml`.

- Runtime: Node
- Start Command: `node server.js`
- Branch: `main`
