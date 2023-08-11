import { PubSub } from '../index'
import QueueImpl from 'queue';
import log from "logger";
import Container, { Service } from "typedi";

const Queue = Container.get(QueueImpl);
@Service()
export default class Redis extends PubSub {
  consuming: boolean = false;  

  constructor(public queue: typeof Queue) {
    super();
  }

  async publish<T>(topic: string, value: T): Promise<void> {
      this.queue.enqueue(topic, { topic: "", ...value })
  }

  async consume(topic: string, callback: Function | Awaited<Function>): Promise<void> {
    this.consuming = true;
    while (this.consuming) {
      try {
        //log.info('starting dequeue.')
        let res = await this.queue.dequeue(topic, { topic: "" });
        //log.info(res);
        if (res)
          await callback(res);
      } catch (error: any) {
        // append to retry queue. 
        log.error(error.message)
      }
    }
  }
}

