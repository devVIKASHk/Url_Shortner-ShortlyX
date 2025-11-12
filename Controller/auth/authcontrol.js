
import path from 'path';
import fs from 'fs/promises';
import * as infoValidation from '../../Model/authModel/authmodel.js';
import ejs from 'ejs';


import { decodeIdToken, generateCodeVerifier, generateState } from 'arctic';


import {emailTokenGeneration,createEmailVerificationLink, savingTokenToDbRegistration} from '../../Model/model.js';

import { sendEmail } from '../../Library/resend.js';
import mjml2html from 'mjml';
import { google } from '../../Library/Oauth/google.js';

//! Fetching Login Page 

export const getLogin  = async ( req,res)=>{
    try{
        return res.render('../html/auth/login',{error:req.flash('error'),message:req.flash('message')});
    }
    catch(err){
        console.error('Login Authetication Error:',err);
    }
}

//! Fetching Registration Page

export const getRegister  = async (req,res)=>{
    try{
        return res.render('../html/auth/register',{error:req.flash('error'),message:req.flash('message')})
    }
    catch(err){
        console.error('Login Authetication Error:',err)
    }
}




//! Post Registration Operations 

export const postRegister = async (req,res)=>{
   const {name,email,password}= req.body;

   const userDoExists = await infoValidation.checkUserData(email);
   
   
   
   if (userDoExists){
    req.flash('error',`User Already Exists! Try another user Email...`);
    return res.redirect('/register');
   }
   
   const hashedPassword= await infoValidation.hashPassword(password);
   
   const savedData=await infoValidation.saveData({name,email,password:hashedPassword});


   

  
   const session = await infoValidation.createSession(savedData.insertId,{ip:req.clientIp,userAgent:req.headers['user-agent']});
 
    const token = infoValidation.createAccessToken({
        id:savedData.insertId,
        name:name,
        email:email,
        sessionId:session.insertId
    })
    const refreshToken = infoValidation.createRefreshToken(session.insertId);

    const baseConfig = {httpOnly:true,secure:true};

    res.cookie('access_token',token,{
        ...baseConfig,
        maxAge:15*60*1000
    })

    res.cookie('refresh_token',refreshToken,{
        ...baseConfig,
        maxAge:30*24*60*60*1000
    })

    req.flash('message',`LoggedIn: Welcome ${name}`);
    // res.redirect('/')


    
    //email Verification 


    const emailToken = emailTokenGeneration();
    
    
        await savingTokenToDbRegistration({token:emailToken,userId:savedData.insertId});
    
        const emailVerificationLink = await createEmailVerificationLink({
            email:email,
            token:emailToken
        })

        const mjmlFilePath = path.join(import.meta.dirname,'../../email/verify-email.mjml');
        const readMjmlFile = await fs.readFile(mjmlFilePath,'utf-8');
        const mjmlFileRender = ejs.render(readMjmlFile,{code:emailToken,link:emailVerificationLink});
        const htmlFile = mjml2html(mjmlFileRender).html;
       
    
        // sendEmail(
        //     {
        //         to: email,
        //         subject:'Email Verification',
        //         html : `
        //             <h1>Click the link below to verify your email</h1>
        //             <p>You can use this token: <code>${emailToken}</code></p>
        //             <a href="${emailVerificationLink}">Verify Email</a>
        //         `
        //     }
        // ).catch(err=>{console.log(err)})


        sendEmail(
            {
                to: email,
                subject:'Email Verification',
                html : htmlFile
            }
        ).catch(err=>{console.log(err)})
    
        return res.redirect('/verify-email')
    

   

}


  //! Post Login Opearaions 

export const postLogin = async (req,res)=>{
    const {email,password}= req.body;
    const [info]=await infoValidation.loginAuthentication(email);
   
    if (!info){
        req.flash('error',`UserEmail doesn't exits`)
        // return res.render('../html/auth/login',{error:`UserEmail doesn't exits`});
        return res.redirect('/login');
    }
    if (info && !info.password){
        req.flash('error',`You already has signedUp with social account authencticator. Kindly process with social authentication!`);
        return res.redirect('/login')
    }
    const doExist = await infoValidation.comparePassword(password,info.password);
   
   

     if(!doExist) {
        req.flash('error','Invalid Credentials!');
        return res.redirect('/login')
     }
    const session = await infoValidation.createSession(info.id,{ip:req.clientIp,userAgent:req.headers['user-agent']});
    const token = infoValidation.createAccessToken({
        id:info.id,
        name:info.name,
        email:info.email,
        sessionId:session.insertId
    })
    const refreshToken = infoValidation.createRefreshToken(session.insertId);

    const baseConfig = {httpOnly:true,secure:true};

    res.cookie('access_token',token,{
        ...baseConfig,
        maxAge:15*60*1000
    })

    res.cookie('refresh_token',refreshToken,{
        ...baseConfig,
        maxAge:30*24*60*60*1000
    })

    req.flash('message',`LoggedIn: Welcome ${info.name}`)
    res.redirect('/')
   
    
}











// //! OAuth2.0 with google 


export const authgoogleSignup = async (req,res)=>{
    try{
        if (req.user) return res.redirect('/');


        const state = generateState();
        const codeVerifier = generateCodeVerifier();

        const url = google.createAuthorizationURL(state,codeVerifier,['openid','profile','email']);
        

        const cookieConfig = {
            httpOnly:true,
            secure:true,
            maxAge:10*60*1000,
            sameSite:'lax'
        }


        res.cookie('google_auth_state',state,cookieConfig);
        res.cookie('google_code_verifier',codeVerifier,cookieConfig);

        return res.redirect(url.toString());


    }catch(err){
        console.error('ERROR OAuth Signup: ',err)
    }
     
}




export const getGoogleLoginCallback = async (req,res)=>{
    const {code,state}= req.query;

    const cookieState = req.cookies.google_auth_state;
    const cookieCodeVerifier= req.cookies.google_code_verifier;


    if (
        !code ||
        !state ||
        !cookieState ||
        !cookieCodeVerifier ||
        !(cookieState===state)
    ){
        req.flash('error',`Couldn't login with Google because of invalid login attempt. Please try again!`);
        return res.redirect('/login')
    }

    let tokens;
    try{
        tokens = await google.validateAuthorizationCode(code,cookieCodeVerifier)
    }catch(err){
        req.flash('error',`Couldn't login with Google because of invalid login attempt. Please try again!`);
        return res.redirect('/login')
    }
   
    // console.log(tokens)
    const claims = decodeIdToken(tokens.idToken());
    // console.log(claims)
    const {sub:googleUniqueId,email,name}= claims;

    // console.log(googleUniqueId,email,name)

    let users= await infoValidation.getUserDataViaGoogleAuthentication("google",email);
    

    if (!users){
        const insertedGoogleData = await  infoValidation.insertGoogleDataToData({provider:'google',name,email,googleUniqueId,isEmailVerified:true})
        users=insertedGoogleData
    }

    if (users &&  !users.providerAccountId){
        const [data] = await insertOnlyToauthgoogleTable(
            {
                userId:users.id,
                authprovider:'google',
                providerAccountId:googleUniqueId
            }
        )
    }

    //!JWT + SessionId Auth
    console.log(users)
    const session = await infoValidation.createSession(users.id||insertedGoogleData.id,{ip:req.clientIp,userAgent:req.headers['user-agent']});
    const token = infoValidation.createAccessToken({
        id:users.id,
        name:users.name,
        email:users.email,
        sessionId:session.insertId
    })
    const refreshToken = infoValidation.createRefreshToken(session.insertId);

    const baseConfig = {httpOnly:true,secure:true};

    res.cookie('access_token',token,{
        ...baseConfig,
        maxAge:15*60*1000
    })

    res.cookie('refresh_token',refreshToken,{
        ...baseConfig,
        maxAge:30*24*60*60*1000
    })

    req.flash('message',`LoggedIn: Welcome ${users.name}`)
    res.clearCookie('google_auth_state');
    res.clearCookie('google_code_verifier');
    res.clearCookie('google_continue_url');
    res.redirect('/')
    


}














export const loggingOut = async  (req,res)=>{
    await infoValidation.clearSessionHistory(req.user.sessionId);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.redirect('/login');
}