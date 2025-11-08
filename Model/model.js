// import path from 'path';
// import fs from 'fs';
// const urlFilePath = path.join( 'urls.json');
// export const LoadUrls = async () => {
//     try {
//         const urls =await fs.promises.readFile(urlFilePath, 'utf-8');
//         return JSON.parse(urls)
//     }catch (error){
//         if (error.code==='ENOENT'){
//             await fs.promises.writeFile(urlFilePath,JSON.stringify({}))
//             return {};

//         }
//         throw error
//     }
// }      

// export const saveUrls=async (urlInfo)=>{
//     await fs.promises.writeFile(urlFilePath,JSON.stringify(urlInfo,null,2));
// }









// import {env} from '../zodValidation.js';
// import { dbClient } from '../Database/db.js';



// await dbClient.connect();



// const db=dbClient.db(env.MONGODB_DATABASE_NAME);
// const collection=db.collection('urlInfo');


// export const LoadUrls=async ()=>{
//     const info = await collection.find().toArray();
//     return info
// }


// export const saveUrls= async (info)=>{
//     await collection.insertOne(info);
// }


// export const checkUrl= async (code)=>{
//     const links = await collection.findOne({Code:code});
//     return links
// }


// import {URL} from '../Database/db.js'


// export const LoadUrls=async ()=>{
//         const info=await URL.find();
//         return info
// }


// export const saveUrls= async (links)=>{


//     await URL.create({url:links.URL,shortCode:links.Code})
// }

// export const checkUrl=async (code)=>{
//     return await     URL.findOne({shortCode:code})
// }




import 'dotenv/config'

import { db } from './Database/db.js';
import { urlTable, usersTable, verificationTokenTable } from './Database/schema.js';
import { eq, and, lt, sql,gte } from 'drizzle-orm';
import crypto from 'crypto';


export const LoadUrls = async (id) => {
    try {
        // const [rows, field] = await db.execute(
        //     `SELECT * FROM ${env.TABLE_NAME}`
        // )
        const rows = await db.select().from(urlTable).where(eq(urlTable.userId, id));

        return rows


    } catch (err) {
        console.error('URL Loading Error: ', err);
        throw err;
    }
};


export const checkUrl = async (code, id) => {
    try {
        // const [row, metaData] = await db.execute(
        //     `SELECT * FROM ${env.TABLE_NAME}
        //         WHERE shortName=?
        //         `, [code]
        // )

        const [row] = await db.select().from(urlTable).where(and(eq(urlTable.shortCode, code), eq(urlTable.userId, id)));
        return row;
    } catch (err) {
        console.error('Error While Checking: ', err);
    }
};




export const saveUrls = async (info) => {

    try {
        // await db.query(
        //     `INSERT INTO ${env.TABLE_NAME} (shortName,url) values ?`,[[[info.Code,info.URL]]]
        // )

        const savedUrl = await db.insert(urlTable).values({ shortCode: info.Code, url: info.URL, userId: info.userId });
        return savedUrl

    } catch (err) {
        console.error('Error In saving info: ', err)
    }

}





//todo : Email Token Generation 


export const emailTokenGeneration = (digit = 8) => {
    const min = 10 ** (digit - 1)
    const max = 10 ** (digit)

    const token = crypto.randomInt(min, max).toString();
    return token
}



//savingTokenToDb 


export const savingTokenToDb = async ({ token,  userId }) => {

    return db.transaction(
        async (tx) => {
            try {
                
                await tx.delete(verificationTokenTable).where(eq(verificationTokenTable.userId,userId))


                await tx.delete(verificationTokenTable).where(lt(verificationTokenTable.expriresAt, sql`(CURRENT_TIMESTAMP)`));


                await tx.insert(verificationTokenTable).values({ token, userId });
            } catch (err) {
                console.error('Error while saving email token to db:', err)
            }
        }
    )

}


// savingTokenToDb on registration 
export const savingTokenToDbRegistration = async ({ token, userId }) => {

    return db.transaction(
        async (tx) => {
            try {

                await tx.delete(verificationTokenTable).where(lt(verificationTokenTable.expriresAt, sql`(CURRENT_TIMESTAMP)`));


                await tx.insert(verificationTokenTable).values({ token, userId });
            } catch (err) {
                console.error('Error while saving email token to db while registering :', err)
            }
        }
    )

}




//createEmailVerificationLink 

export const createEmailVerificationLink = async ({ email, token }) => {
    const uriEncodedEmail = encodeURIComponent(email);

    return `${process.env.URL}/verify-email-token?token=${token}&email=${uriEncodedEmail}`;

}



//emailTokenVerification

export const emailTokenVerification = async (token,id)=>{
    try{
        const [tokenData]=await db.select({userId:verificationTokenTable.userId,token:verificationTokenTable.token,expriresAt:verificationTokenTable.expriresAt}).from(verificationTokenTable).where(
        and(
            eq(verificationTokenTable.token,token),
            eq(verificationTokenTable.userId,id),
            gte(verificationTokenTable.expriresAt,sql`(CURRENT_TIMESTAMP)`)
        )
    )
    return tokenData
    }catch(err){
        console.error('Error while email Token Verification: ',err)
    }
}




//todo : updateTokenVerification

export const  updateTokenVerification =async (id)=>{
    try{
        return await db.update(usersTable).set({verifiedUser:true}).where(eq(usersTable.id,id))
    }catch(err){
        console.error('Error while updating the Verification: ',err);
    }
}

export const tokenDeletionAfterVerification = async (userId,token)=>{
    try{
        return await db.delete(verificationTokenTable).where(and(
        eq(verificationTokenTable.userId,userId),
        eq(verificationTokenTable.token,token)
    ))
    }catch(err){
        console.log('Error while deleting the token : ',err)
    }
}