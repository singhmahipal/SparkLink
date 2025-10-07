import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { inngest, functions } from './inngest/index.js';
import { serve } from 'inngest/express';
import {clerkMiddleware} from '@clerk/express';

const app = express();

await connectDB();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('server is running'));
app.use('/api/inngest', serve({ client: inngest, functions }));

const PORT = process.env.PORT || 8080;

app.listen(PORT, ()=> console.log(`server is listening on port ${PORT}`));