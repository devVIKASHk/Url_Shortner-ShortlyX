import path from 'path';
import url from 'url';
import fs from 'fs';
import express from 'express';
import {isAuthenticated} from '../Model/authModel/authmodel.js'



import {
    templateEngineEjs,
    urlChecking,
    indexRenderingComp,
    urlRedirection,
    profilePage,
    emailVerificationPage,
    postEmailVerification,
    emailTokenValidation

}from '../Controller/control.js';





// const __filename = url.fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const router = express.Router();



router.get('/report',isAuthenticated ,templateEngineEjs);

router.get('/',isAuthenticated,indexRenderingComp);

router.get('/urls/:urls',isAuthenticated,urlRedirection);

router.post('/url',isAuthenticated, urlChecking
    
);
router.get('/profile/:id',isAuthenticated,profilePage);


router.route('/verify-email').get(isAuthenticated,emailVerificationPage).post(postEmailVerification)



router.route('/verify-email-token').get(isAuthenticated,emailTokenValidation)



export const shortnerRouter= router;