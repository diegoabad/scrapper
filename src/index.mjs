// Importa 'router' correctamente
import { router } from './routes/scrapperRouter.mjs';
import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
config();
const app = express();
const PORT = process.env.PORT 
app.use(cors());
app.use(express.json());
// Define la ruta '/scrapper' y utiliza 'router'
app.use('/scrapper', router);

app.listen(PORT, () => {
    console.log("Servidor OK");
});
