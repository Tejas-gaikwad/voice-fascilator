const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const axios = require('axios');
const {createClient} = require('redis');


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


const redisClient = createClient({
  username: 'default',
  password: 'NOJO0NaBt3GhrExSNr9m58yxZ4D7oz5K',
  socket: {
    host: 'redis-14244.c8.us-east-1-4.ec2.redns.redis-cloud.com',
    port: 14244
  }
});

redisClient.connect().then(() => {
  console.log('✅ Redis connected');
}).catch(err => {
  console.error('❌ Redis connection error:', err);
});


const clinicContext = `
You are a receptionist at CarePlus Multispeciality Clinic in Pune.
You are ONLY the receptionist at CarePlus Multispeciality Clinic, FC Road, Pune.
Answer ONLY using the data given below — do NOT invent or assume anything. If you don't know something, say "I'm not sure, please call the clinic."

Respond like a friendly receptionist. Use short, polite, clear language.
Avoid robotic or overly formal responses.

Rules:
- You must ONLY provide information based on the details below.
- DO NOT invent or assume names of doctors or services not listed.
- If unsure, say "I'm sorry, I don't have that information."

Clinic Details:
- Doctors:
    • Dr. Meera Sharma – General Physician – 10 AM to 1 PM (Mon–Sat)
    • Dr. Arjun Patel – Cardiologist – 5 PM to 8 PM (Mon, Wed, Fri)
    • Dr. Nisha Rao – Dermatologist – 11 AM to 2 PM (Tue, Thu, Sat)
- Address: CarePlus Clinic, FC Road, Pune
- Phone: +91-9876543210
- Services: Consultation, ECG, Skin Treatment, Health Checkups

Do not say you are an AI. Respond like a helpful clinic receptionist only.
`;





// ✅ Create OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/ask', async (req, res) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: "Missing userId or message" });
    }


  
    try {
      const redisKey = `chat:${userId}`;

      // Step 1: Fetch existing conversation
      const history = await redisClient.lRange(redisKey, 0, -1);
      const parsedHistory = history.map(msg => JSON.parse(msg));
  
      // Step 2: Add user message
      parsedHistory.push({ role: "user", content: message });
  
      // Step 3: Add system prompt if first message
      const messages = parsedHistory.length === 1
        ? [{ role: "system", content: clinicContext }, ...parsedHistory]
        : parsedHistory;
      const client = new OpenAI({
        baseURL: "https://router.huggingface.co/v1",
        apiKey: process.env.HF_TOKEN,
      });
  
      const chatCompletion = await client.chat.completions.create({
        model: "moonshotai/Kimi-K2-Instruct:novita",
        messages: messages
      });
  

      const reply = chatCompletion.choices[0].message.content;
      console.log("reply ---  ", reply);
         // Step 5: Store both user and assistant messages
      await redisClient.rPush(redisKey, JSON.stringify({ role: "user", content: message }));
      await redisClient.rPush(redisKey, JSON.stringify({ role: "assistant", content: reply }));

      res.json({ reply });
    } catch (err) {
      console.error('Error calling OpenAI:', err.message);
      res.status(500).json({ error: 'Failed to generate reply' });
    }
  });
  

app.listen(5000, () => console.log('✅ Server running on http://localhost:5000'));
