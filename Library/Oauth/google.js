import {Google} from 'arctic';
import 'dotenv/config';

export const google = new Google(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'http://localhost:3000/google/callback'
)