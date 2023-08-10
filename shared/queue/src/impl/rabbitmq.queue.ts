import { Queue, QueueType } from '../index'
import { AMQPChannel, AMQPClient } from '@cloudamqp/amqp-client'
import { Service } from "typedi";
import log from "logger";

@Service()
export default class RabbitMq implements Queue {
  client: any;

  async connect(): Promise<this> {
    this.client = await new AMQPClient("amqp://localhost").connect();
    return this;
  }

  // returns the number of messages in a queue.
  async declareQueue(channel: AMQPChannel, id: QueueType): Promise<{ messages: number }> {
    try {
      await this.client.exchangeDeclare(id, 'topic');
      const q = await channel.queueDeclare(id);

      log.info(`queue ensured: ${q.name} : with ${q.messageCount} messages. 🏖️`);
      return { messages: q.messageCount };
    } catch (error: any) {
      log.error(error.message)
      throw error;
    }
  }

  async ensureQueue(channel: AMQPChannel, id: QueueType): Promise<boolean> {
    try {
      await this.declareQueue(channel, id)
      return true;
    } catch (error: any) {
      log.error(error.message)
      throw error;
    }
  }

  async enqueue<T>(queue: QueueType, { topic, ...value }: T & { topic: string }): Promise<void> {
    console.log(queue, topic)
    const channel = await this.client.channel()
    try {
      await this.ensureQueue(channel, queue);
      const q = await channel.queue(queue);
      await q.publish(queue, topic ?? "", JSON.stringify(value))
      log.info("successfully enqueued notification")
    } catch (error: any) {
      log.error(error)
    } finally {
      channel.close();
    }
  }

  async dequeue<T, U>(queue: QueueType, options: T & { topic: string }): Promise<U | null> {
    console.log(queue, options)
    return {} as U
  }

  async dequeueItem(queue: QueueType, position: string, options: { topic: string }): Promise<string> {
    return `${queue}.${position}.${options.topic}`;
  }

  async getQueue(queue: QueueType, options: { topic: string }): Promise<any[]> {
    console.log(options.topic, queue)
    return [];
  }

  async getIndexOf(queue: QueueType, value: string, options: { topic: string }): Promise<number> {
    console.log(queue, value, options)
    return 0;
  }
  async length(queue: QueueType): Promise<number> {
    return queue.length;
  }
}
