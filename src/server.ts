import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import productsRouter from './routes/product';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
    })
);
app.use('/products', productsRouter);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});