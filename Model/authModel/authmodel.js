import { db } from '../Database/db.js';
import { usersTable, sessionId, authgoogleTable } from '../Database/schema.js';
import { eq,and } from "drizzle-orm";

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

import 'dotenv/config'

export const checkUserData = async (email) => {
    try {
        
        const rows = await db.select().from(usersTable).where(eq(usersTable.email, email))

        if (rows.length > 0) {
            return true
        }
        else {
            return false
        }
    } catch (err) {
        console.error('Error Occurred while checking the info:', err)
    }
}

export const loginAuthentication = async (email) => {
    try {
        
        const rows = await db.select().from(usersTable).where(eq(usersTable.email, email))
        return rows


    } catch (err) {
        console.error('Error while checking password: ', err);
    }
}


export const saveData = async (info) => {
    try {
       

        const [dataInsertion] = await db.insert(usersTable).values({ name: info.name, email: info.email, password: info.password });
        return dataInsertion

    }
    catch (err) {
        console.error(`Error while saving the userInfo: `, err)
    }
}



export const hashPassword = async (password) => {
    return await argon2.hash(password)
}

export const comparePassword = async (password, hash) => {
    return await argon2.verify(hash, password)
}





//! SESSION DATABASE CRUD OPERATIONS 

//* Session Database data insertion 

export const createSession = async (userId, { ip, userAgent }) => {
    const [sessionInsertion] = await db.insert(sessionId).values({ ip, userAgent, userId });
    return sessionInsertion
}

//* Creating access token

export const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '15min' });
}

//* Creating refresh token
export const createRefreshToken = (sessionId) => {
    return jwt.sign({ sessionId }, process.env.SECRET_KEY, { expiresIn: '30d' });
}


//* Token Verification 

const verifyTokens = (token) => {
    return jwt.verify(token, process.env.SECRET_KEY);
}

//* Finding SessionID 

const findingSessionById = async (sessionID) => {
    try {
        const [id] = await db.select().from(sessionId).where(eq(sessionId.id, sessionID));
        return id
    } catch (error) {
        console.error('Error in finding session by id:', error)
    }
}

//*findingUserById

export const findingUserById = async (user_id) => {
    try {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, user_id));
        return user;
    } catch (error) {
        console.error('Error in finding user by id: ', error)
    }
}




//! Refreshing Tokens

const refreshingTokens = async (refreshToken) => {
    try {

        const decodedRefreshToken = verifyTokens(refreshToken);
        const foundedSessionData = await findingSessionById(decodedRefreshToken.sessionId);
        if (!foundedSessionData) throw new Error('Invalid Session');


        const userInfo = await findingUserById(foundedSessionData.userId);

        if (!userInfo) throw new Error('Invalid User');

        const userData = {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            sessionId: foundedSessionData.id
        }

        const newAccessToken = createAccessToken(userData);
        const newRefreshToken = createRefreshToken(foundedSessionData.id);

        return { newAccessToken, newRefreshToken, userInfo }



    } catch (error) {
        console.error('ERROR is ', error.message)
    }
}



//TODO: Authentication Verification Middleware 


export const verifyAuthentication = async (req, res, next) => {
    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refresh_token;

    if (!accessToken && !refreshToken) {
        req.user = null;
        req.clicks = null;
        return next();
    }

    if (accessToken) {


        try {
            const decodedAccessToken = verifyTokens(accessToken);
            req.user = decodedAccessToken;
            return next();
        }catch(error){
            console.error('Access Token Expired: ',err.message)
        }
    }

    if (refreshToken) {
        try {
            const { newAccessToken, newRefreshToken, userInfo } = await refreshingTokens(refreshToken)
            req.user = userInfo;


            const baseConfig = { httpOnly: true, secure: true };

            res.cookie('access_token', newAccessToken, {
                ...baseConfig,
                maxAge: 15 * 60 * 1000
            })

            res.cookie('refresh_token', newRefreshToken, {
                ...baseConfig,
                maxAge: 30 * 24 * 60 * 60 * 1000
            })

            return next();

        } catch (error) {
            console.error('Token Message: ',error.message)
        }
    }
    return next();
}



//? isAuthentication 

export const isAuthenticated = (req, res, next) => {
    if (!req.user) {
        req.flash('message', 'Please Login To Proceed')
        return res.redirect('/login');
    }
    return next()
}



export const clearSessionHistory = async (sessionID) => {
    await db.delete(sessionId).where(eq(sessionId.id, sessionID))
}







//! Fetching user data from database when authentication is done with google 


export const getUserDataViaGoogleAuthentication = async (provider,email)=>{
    try{
        
        const [user]= await db.select(
            {   
                id:usersTable.id,
                name:usersTable.name,
                email:usersTable.email,
                verifiedUser:usersTable.verifiedUser,
                providerAccountId:authgoogleTable.providerAccountId,
                authprovider:authgoogleTable.authprovider
            }
        ).from(usersTable)
         .where(
            eq(usersTable.email,email)
         ).leftJoin(authgoogleTable,
            and(
                eq(authgoogleTable.userId,usersTable.id),
                eq(authgoogleTable.authprovider,provider)
            )
         )
         console.log(user)
        return user
    }catch(err){
        console.error('Error in fetching user data while googleAuthentication :',err)
    }
}



export const insertGoogleDataToData = async (info)=>{
    const insertedData=await db.transaction(
       async  (trx)=>{
            const [data]= await trx.insert(usersTable).values(
                {
                    name:info.name,
                    email:info.email,
                    verifiedUser:info.isEmailVerified,

                }
            )

            const [data1]= await trx.insert(authgoogleTable).values({
                authprovider:info.provider,
                providerAccountId:info.googleUniqueId,
                userId:data.insertId
            })

            return {
                id:data.insertId,
                name:info.name,
                email:info.email,
                verifiedUser:true,
                providerAccountId:info.googleUniqueId
            }
       }
    )
    return insertedData
}





export const insertOnlyToauthgoogleTable =async ({userId,authprovider,providerAccountId})=>{
    return await db.insert(authgoogleTable).values({
        authprovider,
        providerAccountId,
        userId
    })
}




