# VirtuRace 🏃

Protótipo de aplicação de corrida virtual: crie eventos, inscreva-se e comprove a conclusão com uma foto.

## Funcionalidades

- **Login / cadastro** — autenticação simulada (protótipo, senha em texto puro no json-server)
- **Criar eventos** — nome, descrição, distância e período
- **Listagem de eventos** — todos os eventos disponíveis, com detalhes e contagem de inscritos
- **Inscrição** — um clique para participar de um evento
- **Conclusão com foto** — ao terminar a corrida, o participante envia uma foto de comprovação (armazenada como data URL no protótipo)

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- React Router
- json-server como API fake (`db.json`)

## Rodando

Em dois terminais:

```bash
npm install
npm run api   # API fake em http://localhost:3000 (proxy em /api)
npm run dev   # app em http://localhost:5173
```

Usuário de teste: `ana@example.com` / `123456`

## Limitações do protótipo

- Senhas em texto puro e sem sessão real no servidor
- Fotos salvas como base64 dentro do `db.json` (limite de 2MB por foto)
- Sem validação de percurso/GPS — a foto é a comprovação
