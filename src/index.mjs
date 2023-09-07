// Importa 'router' correctamente
import { router } from './routes/scrapperRouter.mjs';

import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
// Define la ruta '/scrapper' y utiliza 'router'
app.use('/scrapper', router);

app.listen(8080, () => {
    console.log("Servidor OK");
});
