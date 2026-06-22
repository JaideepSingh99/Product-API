import { Router, Request, Response } from "express";
import { getProducts } from "../controllers/product";

const productsRouter = Router();

productsRouter.get('/', async (req: Request, res: Response) => {
    try {
        const cursor = req.query.cursor as string | undefined;
        const category = req.query.category as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

        if (limit !== undefined && (isNaN(limit) || limit < 1)) {
            res.status(400).json({
                error: 'Invalid limit parameter'
            });

            return;
        }

        const result = await getProducts(cursor, category, limit);
        res.json(result);
    } catch (err: any) {
        if (err.message === 'Invalid cursor') {
            res.status(400).json({ error: 'Invalid cursor' });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default productsRouter;