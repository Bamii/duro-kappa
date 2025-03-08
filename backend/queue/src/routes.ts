import { NextFunction, Router } from 'express'
import Database from 'database'
//import Cache, { QUEUE_DURATION_CACHE } from "cache";
import log from 'logger'
import Queue, { DURO_QUEUE, NOTIFICATION_QUEUE } from 'queue'
import PubSub from 'pub-sub'
import { sendError, sendSuccess } from 'expressapp/src/utils'
import { CLIENT_QUEUE_JOIN, CLIENT_QUEUE_LEAVE } from 'notifications'
import { ApplicationError } from 'config'
import { joinQueueValidation, queueUserValidation } from './middleware'
import {
    clientAuth,
    comparePassword,
    extract,
    hashPassword,
    signJWT,
} from 'auth'
import { Update, User } from 'database/src/models'
import { Container } from 'typedi'
import { Request, Response } from 'express'
//import moment from 'moment';

const database = Container.get(Database)
const queue = Container.get(Queue)
const pubsub = Container.get(PubSub)
//const cache = Container.get(Cache)
const router = Router()

// join queue.
router.post(
    '/join/:merchant_queue',
    joinQueueValidation,
    queueUserValidation,
    async (_req: any & { user?: User }, res, next: NextFunction) => {
        try {
            const { email, name, username, password, type } = _req.body
            console.log(_req.body)
            const { merchant_queue } = _req.params
            if (!merchant_queue)
                throw new ApplicationError(
                    'Invalid input. Please send in an email.'
                )

            const q = await database.getQueueById(
                Number.parseInt(merchant_queue)
            )
            if (!q) return sendError(res, 'this queue is not existent.')

            {
                // time boundaries
                //const current_time = moment(Date.now());
                //const [start_time_string, end_time_string] = q.duration?.split("-");
                //const start_time = moment().startOf("day").add(start_time_string, 'h');
                //let end_time = moment().startOf("day").add(end_time_string, 'h');
                //const queue_end_time_from_cache = await cache.get(QUEUE_DURATION_CACHE, `${q.id}`)
                //if (queue_end_time_from_cache) {
                //  const [end_time_hour, end_time_minutes] = queue_end_time_from_cache?.split(':')
                //  end_time = moment().startOf('day').add(end_time_hour, 'hours').add(end_time_minutes, 'minutes')
                //}
                //if (current_time.isBefore(start_time))
                //  return sendError(res, `This queue opens by ${start_time.format("hA")}`)
                //if (current_time.isAfter(end_time))
                //  return sendError(res, `This queue has closed for today, please check again tomorrow by ${start_time.format("hA")}`)
            }

            // let user = await database.getUserByEmailOrPhone({ email });
            let user = _req.user
            if (!user) {
                if (type == 'login') {
                    user = await database.getUserByEmailOrPhone({ email })
                    if (!user) return sendError(res, 'invalid user')

                    if (user.in_queue && user.current_queue) {
                        const token = signJWT({
                            email: user.email,
                            id: `${user.id}`,
                        })

                        res.cookie('admin', '', { maxAge: -1 })
                        res.cookie('user', JSON.stringify(extract(user, 'password')))
                        res.cookie('token', token)
                        console.log(user)

                        return sendSuccess(
                            res,
                            user.current_queue ==
                                Number.parseInt(merchant_queue)
                                ? 'you are on the queue... happy waiting!'
                                : 'You are already on a queue. You have to leave your current queue before you can join another one.',
                            { data: { user, token: signJWT({ email }) } }
                        )
                    }

                    const is_valid = await comparePassword({
                        hashedPassword: user.password,
                        password,
                    })
                    if (!is_valid) {
                        return sendError(res, 'invalid login details')
                    }
                } else if (type == 'register') {
                    log.info(
                        `User with email: ${email} was not found. Creating a new user.`
                    )
                    user = await database.insertUser({
                        password: await hashPassword(password),
                        email, name, username,
                        in_queue: true,
                        current_queue: Number.parseInt(merchant_queue),
                    })
                    log.info(`successfully created user with email: ${email}`)
                } else {
                    return sendError(res, 'invalid stuff')
                }
            } else {
                log.info(`user with email: ${email} was found. yay!`)
                if (user.in_queue && user.current_queue)
                    return sendSuccess(
                        res,
                        user.current_queue == Number.parseInt(merchant_queue)
                            ? 'you are on the queue... happy waiting!'
                            : 'You are already on a queue. You have to leave your current queue before you can join another one.',
                        { data: { user, token: signJWT({ email }) } }
                    )

                let update_object: Update<User> = {
                    in_queue: true,
                    current_queue: Number.parseInt(merchant_queue),
                }
                if (name) update_object.name = name

                user = await database.updateUserById(user.id, update_object)
                log.info(
                    `updated user with email: ${email} to be in queue for merchant with id: ${merchant_queue}`
                )
            }

            // enqueue user to the queue
            log.info(`enqueueing the user for the merchant with id: ${merchant_queue}`)
            await queue.enqueue(DURO_QUEUE, {
                topic: merchant_queue,
                value: `${user.id}`,
            })
            const length = await queue.length(DURO_QUEUE, {
                topic: merchant_queue,
            })
            log.info('done')

            // enqueue notification to the user.
            log.info(`enqueueing notification to the user.`)
            await queue.enqueue(NOTIFICATION_QUEUE, {
                topic: '',
                value: JSON.stringify({
                    channel: user.email ? 'email' : 'sms',
                    destination: user.email ?? user.phone,
                    type: CLIENT_QUEUE_JOIN,
                    message: `You have been queued. you are number ${length} on the queue`,
                    data: { userid: user.id },
                }),
            })
            log.info('done')
            log.info(`successfully queued user with email : ${email}`)

            // return a token
            const token = signJWT({ email, id: `${user.id}` })

            if (!_req.user) {
                res.cookie('admin', null)
                res.cookie('user', JSON.stringify(extract(user, 'password')))
                res.cookie('token', token)
                console.log(user)
            }
            return sendSuccess(res, 'Successfully joined a queue!.', {
                data: { token, user },
            })
        } catch (error) {
            console.log(error)
            return next(error)
        }
    }
)

router.post(
    '/leave',
    clientAuth(),
    async (_req: any & { user: User }, res, next: NextFunction) => {
        try {
            const { email } = _req.user
            let user = await database.getUserByEmailOrPhone({ email })

            if (!user || !user.current_queue)
                throw new ApplicationError('You are currently not on a queue.')

            if (user.attending_to)
                throw new ApplicationError(
                    'You are currently being attended to, the admin will do the rest. Cheers!'
                )

            await queue.dequeueItem(DURO_QUEUE, `${user.id}`, {
                topic: `${user.current_queue}`,
            })
            await database.updateUserById(user.id, {
                in_queue: false,
                current_queue: null,
                attending_to: false,
            })

            await queue.enqueue(NOTIFICATION_QUEUE, {
                topic: '',
                value: JSON.stringify({
                    channel: user.email ? 'email' : 'sms',
                    destination: user.phone ?? user.email ?? '',
                    type: CLIENT_QUEUE_LEAVE,
                    message: `You have now left the queue. Thank you for using this service.`,
                    data: { userid: user.id },
                }),
            })

            log.info('successfully dequeued user:')
            return sendSuccess(
                res,
                'you have successfully left the queue. thank you for using our service! 😏'
            )
        } catch (error) {
            return next(error)
        }
    }
)

router.get(
    '/details',
    clientAuth(),
    async (req: any & { user: User }, res: any, next: NextFunction) => {
        try {
            const user = req.user // parse token.

            if (!user.in_queue || !user.current_queue)
                return sendError(res, 'You are currently not on a queue.')

            if (user.attending_to)
                return sendSuccess(res, 'You are currently being attended to.')

            console.log('1')
            const position = await queue.getIndexOf(DURO_QUEUE, `${user.id}`, {
                topic: `${user.current_queue}`,
            })
            console.log('2')
            const length = await queue.length(DURO_QUEUE, {
                topic: `${user.current_queue}`,
            })
            console.log('3')
            const q = await database.getQueueById(user.current_queue)

            console.log(position, length)
            if (position < 0)
                throw new ApplicationError(
                    'You are currently not on the queue.'
                )

            return sendSuccess(res, 'Successfully got queue details.', {
                data: {
                    queue: {
                        ...q,
                        users: q.users?.filter((user) => !user.attending_to),
                    },
                    position,
                },
            })
        } catch (error) {
            return next(error)
        }
    }
)

router.get(
    '/preview/:queueId',
    queueUserValidation,
    async (req: any, res: any, next: NextFunction) => {
        try {
            const { queueId } = req.params

            const q = await database.getQueueById(Number.parseInt(queueId))
            if (!q) return sendError(res, 'this queue is invalid')

            delete q.users
            return sendSuccess(res, 'Queue details fetched successfully.', {
                data: q,
            })
        } catch (error) {
            return next(error)
        }
    }
)



router.get('/events/:id', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()
    
    await pubsub.consume(
        DURO_QUEUE, 
        { topic: req.params.id! },
        function(val: any) {
            const vals = val.map(([key, [, value]]: any[]) => ({ key, value }))
            // console.log('consuming', vals)
            res.write(JSON.stringify(vals))
        }
    )
})

export default router
