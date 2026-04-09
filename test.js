const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: "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",
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function main() {
  try {
    const completion = await openai.chat.completions.create({
      model: "moonshotai/kimi-k2-5",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 50,
    });
    console.log("Success moonshotai/kimi-k2-5:", completion.choices[0].message.content);
  } catch (err) {
    console.error("Error moonshotai/kimi-k2-5:", err.message);
  }

}

main();
