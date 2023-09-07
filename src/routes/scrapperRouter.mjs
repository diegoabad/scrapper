// scrapperRouter.mjs
import express from 'express';
import { main } from '../services/scrapperServices.mjs';

const router = express.Router();

router.post('/', async (req, res) => {
    const { user, pass, operationType, month, year } = req.body;

    const result = await main({
        user,
        pass,
        operationType,
        month,
        year
    });

    res.send({ status: "success",timePeriod:`${year}-${month}`, payload: result });
});

export { router }; // Asegúrate de exportar 'router' correctamente
