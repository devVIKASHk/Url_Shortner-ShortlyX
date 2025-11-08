import path from 'path';
import fs from 'fs/promises';
import { checkUrl, LoadUrls,
    saveUrls,emailTokenGeneration ,
    savingTokenToDb,createEmailVerificationLink,
    emailTokenVerification,updateTokenVerification,tokenDeletionAfterVerification } from '../Model/model.js';

import {findingUserById} from '../Model/authModel/authmodel.js';

import { sendEmail } from '../Library/resend.js';


import { tokenSizeVerification } from '../zodValidation.js';
import mjml2html from 'mjml';
import ejs from 'ejs'



//Ejs Template Engine Component

export const templateEngineEjs = (req, res) => { 
    // res.render('report',{content1:'<strong>Bold One</strong>'});
    // res.render('report',{content2:'<h2>helldkfdhiof fiodof</h2>'});
    // res.render('report',{name:'vikash'});
    const student = {
        name: 'Aarav',
        grade: '10th',
        favSubj: 'Mathematics'
    }
    res.render('report', { student })
}

//*email Verification Page Rendering 

export const emailVerificationPage = async (req,res)=>{
    try{

        return res.render('emailverify',{email:req.user.email,error:req.flash('error')})

    }catch(err){
        console.error('Error in Rendering email Verificatio Page: ',err)
    }
}


//* Profile Page Rendering 

export const profilePage =async (req,res)=>{
    try{

        //Users Info

        const info = await findingUserById(req.user.id);
        const date = new Date(info.createdAt);
        
        const onlyDate = date.toISOString().split('T')[0];
        const isVerified =  info.verifiedUser;
        //url Info
        const urlInfo =  await LoadUrls(req.user.id);
        
        return res.render(`profile`,{name:info.name,email:info.email,date:onlyDate,links:urlInfo.length,isVerified});

    }catch(err){
        console.error('Error on Rendering Profile page',err)
    }
}



// Index.html rendering components

export const indexRenderingComp=async (req, res) => {
        try {
            
            const urlArr= await LoadUrls(req.user.id);
            res.render('index',{urlArr,hosts:req.host,error:req.flash('error'),message:req.flash('message')})   
            
        } catch (err) {
            console.error(err)
            return res.status(500).send('Internal Server Error!')
        }
    }




//Redirecting to the urls which is shorted


export const urlRedirection=async (req,res)=>{
        const {urls}= req.params;
        const links= await checkUrl(urls,req.user.id);
        
        if (!links) return res.status(404).send("404 Page doesn't exists");
        
        return res.redirect(links.url);
}







// Ensuring the fetched data is in the json or not 





 export const urlChecking=async (req, res) => {

        
        const {URL,Code}= req.body;
        
        if (!URL || !Code) {
            // return res.redirect('/?message=URL and shortCode are required!');
            req.flash('error','URL and shortCode are required!');
            return res.redirect('/');
        }
        
        const doExist= await checkUrl(Code,req.user.id);
       

        if(doExist){
            // return res.redirect('/?message=URL already exists!');
            req.flash('error','URL already exists!');
            return res.redirect('/')

        }

    
        await saveUrls({URL,Code,userId:req.user.id});
        req.flash('message','URL saved successfully!')
        return res.redirect('/')
        
        
}





// Email Verification 


export const postEmailVerification = async (req,res)=>{
    const user = await findingUserById(req.user.id);

    if (!user || user.isVerified)  return res.redirect('/')

    const emailToken = emailTokenGeneration();

    await savingTokenToDb({token:emailToken,userId:user.id});

    const emailVerificationLink = await createEmailVerificationLink({
        email:user.email,
        token:emailToken
    })

    const mjmlTemplatePath = path.join(import.meta.dirname,'..','email','verify-email.mjml');
    const mjmlFile = await fs.readFile(mjmlTemplatePath,'utf-8');
    const filledTemplate = ejs.render(mjmlFile,{code:emailToken,link:emailVerificationLink});


    const htmlOutput = mjml2html(filledTemplate).html;

    
    sendEmail(
        {
            to: user.email,
            subject:'Email Verification',
            html : htmlOutput
        }
    ).catch(err=>{console.log(err)})

    res.redirect('/verify-email')
}




export const emailTokenValidation = async (req,res)=>{
    try{
        const tokenInfo = {token:req.query.token,email:req.query.email};
        
        const {data,error}= tokenSizeVerification.safeParse(tokenInfo.token);
        
        if(error){
            req.flash('error',error.errors[0].message);
            return res.redirect('/verify-email')
        }
        


        const emailTokenData = await emailTokenVerification(tokenInfo.token,req.user.id)
        
        if (!emailTokenData) {
            req.flash('error','Invalid Token or Token Expired!');
            return res.redirect('/verify-email');
        }
        const userData = await findingUserById(req.user.id);
        if (!userData) {
            req.flash('erro',"User doesn't exist!");
            return res.redirect('/verify-email')
        }
        await updateTokenVerification(req.user.id)
        await tokenDeletionAfterVerification(req.user.id,tokenInfo.token) 
        return res.redirect('/profile')
    }catch(err){
        console.error('Email Token Validation Error',err)
    }
}



















