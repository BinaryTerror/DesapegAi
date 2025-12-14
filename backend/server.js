require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const { createClient } = require('@supabase/supabase-js');

const app = express();


app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL, 
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(xss());
app.use(express.json({ limit: '10kb' })); // Evita DoS com payloads gigantes


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: 'Muitas requisições, tente novamente mais tarde.'
});
app.use(limiter);


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);


app.post('/api/secure-checkout', async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) return res.status(400).json({ error: 'ID necessário' });

    // A. Validação Server-side (Busca o produto no banco)
    const { data: product, error } = await supabase
      .from('products')
      .select('title, price, seller_phone')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Produto não encontrado ou preço alterado' });
    }

    // B. Formatação do Preço (Integridade)
    const formatMoney = (amount) => 
      new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(amount);

    const sellerPhone = product.seller_phone.replace(/\D/g, '').replace(/^258/, '');
    const fullPhone = `258${sellerPhone}`;
    
    const message = `Olá! Vi seu anúncio no DesapegAi (Validado ✅)\n\n` +
                    `Produto: ${product.title}\n` +
                    `Preço Oficial: ${formatMoney(product.price)}\n\n` +
                    `Link gerado em: ${new Date().toLocaleString()}`;

    const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

    // D. Retorna o link seguro para o frontend
    res.json({ url: whatsappUrl });

  } catch (err) {
    console.error("Erro checkout:", err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend seguro rodando na porta ${PORT}`));