import { env } from './zodValidation.js';
import {shortnerRouter} from './routes/shortener.js';
import {authRouter} from './routes/authRoute/authroute.js';
import {verifyAuthentication} from './Model/authModel/authmodel.js';

import express from 'express';
import flash from 'connect-flash';
import requestIp from 'request-ip'
import session from 'express-session';
import cookieParser from 'cookie-parser';
import 'dotenv/config'




const PORT = process.env.PORT || 3000;

const app=express();





app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));



app.set('view engine','ejs');
app.set('views','./html');



app.use(cookieParser())

app.use(session(
    {   
       
        secret:process.env.SECRET_ID,
        resave:true,
        saveUninitialized:false
    }
)); 
app.use(flash());
app.use(requestIp.mw());


app.use(verifyAuthentication)
app.use((req,res,next)=>{
    res.locals.user=req.user;
    return next();
})

app.use(authRouter);
app.use(shortnerRouter);


app.use(
    (req, res) => {
        return res.status(404).send('404 Page not Found!');
    }
)


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
})







