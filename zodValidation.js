import {z} from 'zod';
import url from 'url';
import path from 'path';
import dotenv from 'dotenv';
const __filename=url.fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

dotenv.config({path:path.resolve(__dirname+'/.env')})


// const port=z.coerce.number().min(3000).max(55000).default(3001);

// const PORT=port.parse(process.env.PORT);


export const env= z.object(
    {
        PORT:z.coerce.number().min(3000).max(55000).default(3001),
        MYSQL_DBNAME:z.coerce.string(),
        TABLE_NAME:z.coerce.string(),
        LOGIN_TABLE_NAME: z.coerce.string()
    }
).parse(process.env)



export const tokenSizeVerification = z.coerce.string().min(8,{message:'Token must be at least of 8 characters!'})