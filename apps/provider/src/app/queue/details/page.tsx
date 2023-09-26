'use client';
import React, { useEffect } from "react";
import { useQueueContext } from "@/contexts/queue.context";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Jumbotron from "@/components/jumbotron";
import { ModalTrigger } from "@/components/modal";
import { Button } from "@/components/button";
import Link from "next/link";
import { useAuthContext } from "@/contexts/auth.context";

export default async function Page() {
  const { meta, get_user_queue_details, leave_queue: _leave_queue } = useQueueContext();
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!meta)
      get_user_queue_details();
  }, [meta, get_user_queue_details])

  const leave_queue = async () => {
    try {
      const { message } = await _leave_queue();
      toast.success(message)
      router.push('/');
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <div className="w-screen flex flex-col mt-[5rem]">
      {meta && !user?.attending_to
        ? (
          <div className="_mx-auto">
            <Jumbotron
              cta={(
                <Button
                  onClick={() => leave_queue()}
                >
                  leave queue
                </Button>
              )}
              text={`you are number ${meta.position} on the list!`}
            />

            <div className="mt-8 underline"> here's the queue list </div>
            {meta.queue.users.map((user: any) => (
              <div className="my-1 hover:border-r " key={user.id}> - {user.name ?? user.email}</div>
            ))}
          </div>
        ) : user?.attending_to ? (
          <div> you are currently being attended to :).
          </div>) : null}
    </div>
  )
}
