import {Google} from 'arctic';
import 'dotenv/config';

export const google = new Google(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'https://shortlyx.onrender.com/google/callback'
)