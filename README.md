# Meu Treino — Coach IA

Versão mobile do dashboard de treino com uma assistente de treino integrada.

## O que foi adicionado

- Aba **Coach IA** no aplicativo.
- Conversa em português.
- Botões rápidos para análise de evolução, próximo treino, exercícios estagnados e volume.
- A IA recebe os dados registrados no aplicativo: treinos recentes, exercícios, séries, repetições, cargas, volume, melhores marcas e medidas.
- Histórico da conversa salvo no navegador.
- Backend seguro em **Netlify Function** para que a chave da IA não fique exposta no JavaScript do celular.
- Endpoint `/api/chat` encaminhado para `/.netlify/functions/chat`.

## Ativar a IA na Netlify

1. Publique este projeto na Netlify.
2. Vá em **Site configuration → Environment variables**.
3. Crie `OPENAI_API_KEY` com sua chave da API.
4. Opcionalmente, crie `OPENAI_MODEL`. Se não criar, o projeto usa `gpt-6-luna`.
5. Faça um novo deploy.

A chave **não deve** ser colocada no `script.js`.

## Importante

O aplicativo continua funcionando e salvando os dados localmente mesmo sem a IA. A função da IA precisa de uma chave de API válida para responder.

A integração usa a **Responses API** da OpenAI, que é a API recomendada para novas integrações. A antiga Assistants API foi encerrada em 26 de agosto de 2026.
