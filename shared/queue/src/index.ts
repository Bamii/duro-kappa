import { Token } from "typedi";
import RabbitMQ from "./impl/rabbitmq.queue";
import Redis from "./impl/redis";
import "reflect-metadata";

export abstract class Queue {
  abstract connect(): Promise<this>

  abstract enqueue<T>(queue: QueueType | string, value: T & { topic?: string }): Promise<void>

 abstract  dequeue<T, U>(queue: QueueType | string, options: T & { topic?: string }): Promise<U | null>

  abstract dequeueItem(queue: QueueType | string, value: string, options: { topic: string }): Promise<string>

  abstract getQueue(queue: QueueType | string, options: { topic: string }): Promise<any[]>

 abstract  getIndexOf(queue: QueueType | string, value: string, options: { topic: string }): Promise<number>

 abstract  length(queue: QueueType | string, options: { read?: number, topic?: string }): Promise<number>
}

export const NOTIFICATION_QUEUE = "NOTIFICATION_QUEUE" as const;
export const QUEUE_DURATION_QUEUE = "QUEUE_DURATION_QUEUE" as const;
export const MERCHANT_REGISTRATION_QUEUE = "MERCHANT_REGISTRATION_QUEUE" as const
export const DURO_QUEUE = "DURO_QUEUE" as const
export type QueueType = typeof QUEUE_DURATION_QUEUE | typeof NOTIFICATION_QUEUE | typeof MERCHANT_REGISTRATION_QUEUE | typeof DURO_QUEUE;

// implementations...
const queues = {
  "kafka": RabbitMQ as Token<Queue>,
  "redis": Redis as Token<Queue>
} as const;
type QueueName = keyof typeof queues;

type FactorySettings = {
  queue: QueueName;
  connection_string?: string;
}
function queueFactory({ queue = "redis" }: FactorySettings) {
  return queues[queue];
}

export default (function() {
  return queueFactory({ queue: "redis" });
})();

