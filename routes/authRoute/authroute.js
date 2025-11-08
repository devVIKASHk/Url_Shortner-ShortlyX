import express from 'express';

import * as authControl from '../../Controller/auth/authcontrol.js';
import { isAuthenticated } from '../../Model/authModel/authmodel.js';


const router = express.Router() ;

//todo : instead of explicitly write router.get() and router.post() router gives us functionality to write within one go

// router.get('/login',authControl.login);
// router.post('/login',authControl.login)

// router.get('/register',authControl.register)
// router.post('/register',authControl.register)


//? so the router method is 

router
    .route('/login')
    .get(authControl.getLogin)
    .post(authControl.postLogin);

router
    .route('/register')
    .get(authControl.getRegister)
    .post(authControl.postRegister)

router
    .route('/google')
    .get(authControl.authgoogleSignup);

router
    .route('/google/callback')
    .get(authControl.getGoogleLoginCallback)

router
    .route('/logout')
    .get(isAuthenticated,authControl.loggingOut)




    

export const authRouter = router;