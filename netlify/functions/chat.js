export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const body = JSON.parse(req.body || "{}");
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return json({ error: "Mensagem vazia." }, 400);

    const context = body.context || {};
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-6-luna";

    if (!apiKey) {
      return json({ error: "OPENAI_API_KEY não configurada na hospedagem." }, 500);
    }

    const instructions = `Você é o Coach IA de um aplicativo pessoal de treino.
Responda sempre em português do Brasil, de forma natural, prática e motivadora.
Seu trabalho é analisar os dados de treino fornecidos e ajudar o usuário a tomar decisões sobre treinamento.
Use somente os dados disponíveis; não invente cargas, repetições, treinos ou evolução.
Quando comparar evolução, mostre claramente o que mudou e, quando possível, use números.
Ao sugerir aumento de carga, considere a combinação de carga, repetições e séries registradas e prefira progressões conservadoras.
Se os dados forem insuficientes, diga o que falta em vez de inventar.
Você pode sugerir divisão de treino, exercícios, progressão, volume, frequência e organização do treino.
Não faça diagnóstico médico, não prescreva tratamento e não tente identificar lesões. Se o usuário relatar dor, lesão, tontura ou outro sintoma relevante, recomende avaliação de um profissional habilitado.
Não seja excessivamente formal. Priorize respostas curtas, objetivas e acionáveis, usando listas quando ajudarem.

DADOS DO APLICATIVO:
${JSON.stringify(context)}

HISTÓRICO RECENTE DA CONVERSA:
${JSON.stringify(history)}`;

    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        instructions,
        input: [{ role: "user", content: message }],
        max_output_tokens: 900
      })
    });

    const raw = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error("OpenAI API error:", raw);
      return json({ error: "A IA recusou a solicitação. Verifique a configuração da chave e do modelo." }, 502);
    }

    const content = raw.output_text || extractOutputText(raw.output) || "Não consegui gerar uma resposta agora.";
    return json({ content });
  } catch (error) {
    console.error(error);
    return json({ error: "Erro ao processar a mensagem." }, 500);
  }
};

function extractOutputText(output) {
  if (!Array.isArray(output)) return "";
  return output.flatMap(item => Array.isArray(item.content) ? item.content : [])
    .filter(part => part.type === "output_text" && typeof part.text === "string")
    .map(part => part.text)
    .join("\n");
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
