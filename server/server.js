import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => res.send('server is running'));

const PORT = process.env.PORT || 8080;

app.listen(PORT, ()=> console.log(`server is listening on port ${PORT}`));