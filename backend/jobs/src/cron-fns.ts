import { QUEUE_DURATION_QUEUE } from "queue"
import DatabaseInstance from "database";
import CacheInstance from "cache";
import { Container } from "typedi";
import {CronJob} from "cron"
import log from "logger";
import moment from "moment";

const database = Container.get(DatabaseInstance)
const cache = Container.get(CacheInstance)

export async function dequeue_all_users() {
    // cron job for clearing the queue every day
    var job = new CronJob(
        '@hourly',
        async function() {
            try {
                const _queues = await database.getQueues({});
                const queues = _queues.filter(queue => {
                    const [, end] = queue.duration.split("_");
                    const endtime = moment().startOf('day').add(end, 'hours');
                    const now = moment(Date.now());
                    return now.hour() == endtime.hour()
                })

                log.info(`list of queues: ${queues.map(q => `${q.name}-${q.id}`)}`)
                for(let queue of queues) {
                    log.info(`starting dequeue of the queue #${queue.id}`);
                    await database.updateUsers(
                        { in_queue: true, current_queue: queue.id },
                        { in_queue: false, attending_to: false, current_queue: null }
                    );
                    log.info(`done with dequeuing #${queue.id}`)
                }
            } catch (error: any) {
                log.error(`an eerror occured while dequeing the users in #`)
                log.error(error.message)
            }
        },
        null,
        true
    );
    job.start();
}

export async function delete_queue_end_queue() {
    var job = new CronJob(
        '@daily',
        async function() {
            try {
                log.info(`starting invalidation of ${QUEUE_DURATION_QUEUE}`);
                await cache.invalidateAllKeys(QUEUE_DURATION_QUEUE);
                log.info("done with invalidation")
            } catch (error: any) {
                log.error(`an eerror occured while invalidating the keys in ${QUEUE_DURATION_QUEUE}`)
                log.error(error.message)
            }
        },
        null,
        true
    );
    job.start();
}

