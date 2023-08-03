import { AMQPMessage } from "@cloudamqp/amqp-client";
import RabbitMQ from "./impl/rabbitmq.queue";
import Redis from "./impl/redis";

export abstract class _Queue {
  abstract connect(): Promise<this>

  abstract enqueue<T>(queue: QueueType, value: T & { topic?: string }): Promise<void>

  abstract dequeue<T, U>(queue: QueueType, options: T & { topic?: string }): Promise<U | null>

  abstract dequeueItem(queue: QueueType, value: string, options: { topic: string }): Promise<string>

  abstract getQueue(queue: QueueType, options: { topic: string }): Promise<any[]>

  abstract getIndexOf(queue: QueueType, value: string, options: { topic: string }): Promise<number>

  abstract length(queue: QueueType, options: { read?: number, topic?: string }): Promise<number>
}

export abstract class Consumer {
  abstract consume(queue: QueueType, options: { topic?: string }, callback: Function | Awaited<Function>): Promise<void>
}

export type ConsumerMessage = AMQPMessage;

export type Queue = Consumer & _Queue;

export const NOTIFICATION_QUEUE = "NOTIFICATION_QUEUE" as const;
export const QUEUE_DURATION_QUEUE = "QUEUE_DURATION_QUEUE" as const;
export const MERCHANT_REGISTRATION_QUEUE = "MERCHANT_REGISTRATION_QUEUE" as const
export const DURO_QUEUE = "DURO_QUEUE" as const
export type QueueType = typeof QUEUE_DURATION_QUEUE | typeof NOTIFICATION_QUEUE | typeof MERCHANT_REGISTRATION_QUEUE | typeof DURO_QUEUE;

// implementations...
const queues = {
  "kafka": RabbitMQ,
  "redis": Redis
} as const;

type QueueName = keyof typeof queues;
type FactorySettings = {
  queue: QueueName;
  connection_string?: string;
}

function queueFactory({ queue = "redis" }: FactorySettings) {
  return new queues[queue]();
}

export default (function() {
  let instance: Queue;
  return () => {
    if (instance) return instance;
    const { queue } = process.env as FactorySettings;
    instance = queueFactory({ queue });

    return instance;
  }
})();

