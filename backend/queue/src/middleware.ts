import validator from "input-validator";
import z from 'zod';
import Database from "database";
import { Container } from "typedi";
import { verifyJWT } from "auth";

const database = Container.get(Database);
export const joinQueueValidation = validator(
  z.object({
    "email": z.string().email().optional(),
    username: z.string().optional(),
    name: z.string().optional(),
    password: z.string().optional(),
    type: z.string().optional(),
  })
)

export const previewQueueValidation = validator(
  z.object({
    queueId: z.number()
  })
)

// @ts-ignore
export const queueUserValidation = async function (req: any, res: any, next: any) {
  const cookies = req.cookies;

  const token = cookies['token']

  console.log('----xxy', cookies)
  try {
    const uss = verifyJWT(token)
    // @ts-ignore
    if(uss?.id) {
      // @ts-ignore
      const user = await database.getUserById(parseInt(uss.id));
      console.log(user)
      req.user = user
    }
    
    console.log(uss)
  } catch (error) {
    
  }

  next()
}
