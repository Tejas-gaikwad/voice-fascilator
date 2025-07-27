const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const axios = require('axios');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const clinicContext = `
  You are a receptionist at CarePlus Multispeciality Clinic in Pune.
  Here are the details:
  - Doctors:
      • Dr. Meera Sharma – General Physician – 10 AM to 1 PM (Mon–Sat)
      • Dr. Arjun Patel – Cardiologist – 5 PM to 8 PM (Mon, Wed, Fri)
      • Dr. Nisha Rao – Dermatologist – 11 AM to 2 PM (Tue, Thu, Sat)
  - Address: CarePlus Clinic, FC Road, Pune
  - Phone: +91-9876543210
  - Services: Consultation, ECG, Skin Treatment, Health Checkups
  Only respond as the clinic receptionist. Do not say you're AI. Be polite and helpful.
  `;




// ✅ Create OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/ask', async (req, res) => {
    const { messages } = req.body;

    console.log("messages", messages);
  
    try {
      const client = new OpenAI({
        baseURL: "https://router.huggingface.co/v1",
        apiKey: process.env.HF_TOKEN,
      });
  
      const chatCompletion = await client.chat.completions.create({
        model: "moonshotai/Kimi-K2-Instruct:novita",
        messages: messages
      });
  
      const reply = chatCompletion.choices[0].message.content;
      console.log("reply ---", reply);
      res.json({ reply });
    } catch (err) {
      console.error('Error calling OpenAI:', err.message);
      res.status(500).json({ error: 'Failed to generate reply' });
    }
  });
  

app.listen(5000, () => console.log('✅ Server running on http://localhost:5000'));
