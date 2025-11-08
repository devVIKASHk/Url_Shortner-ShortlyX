import { int, mysqlTable, serial, varchar, timestamp,boolean,text, mysqlEnum, time} from 'drizzle-orm/mysql-core';
import {relations,sql} from 'drizzle-orm';
import 'dotenv/config';

export const usersTable = mysqlTable(process.env.LOGIN_TABLE_NAME, {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull(),
  password: varchar({ length: 255 }),
  verifiedUser: boolean('is_verifed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow().defaultNow().notNull(),
});


export const urlTable = mysqlTable(process.env.TABLE_NAME,
  {
    id: serial().primaryKey(),
    shortCode: varchar({ length: 255 }).notNull(),
    url: varchar({ length: 512}).notNull(),
    userId: int('user_id').notNull().references(()=>usersTable.id,{onDelete:'cascade'})
    
    
  }
)

export const sessionId = mysqlTable(process.env.SESSION_TABLE,
  {
    id:serial('id').primaryKey(),
    valid:boolean().default(true).notNull(),
    ip:varchar({length:255}),
    userAgent: text('user_agent'),
    createdAt:timestamp('created_at').defaultNow().notNull(),
    updatedAt:timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    userId:int('user_id').notNull().references(()=>usersTable.id,{onDelete:'cascade'})
  }
)


export const authgoogleTable = mysqlTable(process.env.AUTH_TABLE,
  {
    id:serial('_id').primaryKey(),
    authprovider: mysqlEnum('auth_provider',['google','github']).notNull(),
    providerAccountId:varchar('provider_account_id',{length:255}).notNull().unique(),
    userId: int('user_id').references(()=>usersTable.id,{onDelete:'cascade'}).notNull(),
    createdAt:timestamp('created_at').defaultNow().notNull()

  }
)

export const verificationTokenTable = mysqlTable(process.env.VERIFICATION_TOKEN_TABLE,
  {
    id:serial('_id').primaryKey(),
    token: varchar({length:8}).notNull(),
    expriresAt:timestamp('expires_at').default(sql`(CURRENT_TIMESTAMP+INTERVAL 1 DAY)`),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    userId:int('user_id').notNull().references(
      ()=> usersTable.id, {onDelete:'cascade'}
    )
    
  }
)



export const usersRelations = relations(usersTable,({many})=>({
  shortLinks: many(urlTable),
  session: many(sessionId)
}))

export const urlRelationsTouserTable = relations(urlTable,
  ({one})=>({
    user: one(usersTable,{
      fields:[urlTable.userId],
      references:[usersTable.id],
    })
  })
)

export const sessionRelationsTouser = relations(sessionId,({one})=>({
  user: one(usersTable,{
    fields:[sessionId.userId],
    references:[usersTable.id]
  })
}))

