import { Token } from "typedi";
import Redis from "./impl/redis";
import "reflect-metadata";

export abstract class PubSub {
    abstract publish<T>(topic: string, value: T): void;

    async subscribe(topic: string, callback: Function | Awaited<Function>): Promise<void> {
        this.consume(topic, callback);
    }

    abstract consume(topic: string, callback: Function | Awaited<Function>): Promise<void>
}

// implementations...
const queues = {
  "redis": Redis as Token<PubSub>
} as const;
type PubSubAgent = keyof typeof queues;

type FactorySettings = {
  queue: PubSubAgent;
  connection_string?: string;
}

function PubSubFactory({ queue = "redis" }: FactorySettings) {
  return queues[queue];
}

export default (function() {
  return PubSubFactory({ queue: "redis" });
})();

