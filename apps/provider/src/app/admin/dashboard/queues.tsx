import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/contexts/auth.context';
import { useScreenContext } from '@/contexts/screen.context';
import { useQueueContext } from '@/contexts/queue.context';
import { usePathname } from 'next/navigation';

export default function Page() {
  const { user } = useAuthContext();
  const { list_admin_queues, meta } = useQueueContext();

  const pathname = usePathname();
  const { is_mobile, screen_size } = useScreenContext();
  const pn = useMemo(() => pathname.split('/'), [pathname])
  const classname = useMemo(() => pn.length > 3 && is_mobile() ? "hidden" : "block", [pn, screen_size, is_mobile()])

  useEffect(() => {
    if (!meta)
      list_admin_queues()
        .catch((e: any) => { toast.error(e.message) });
  }, [meta, list_admin_queues])

  return (
    <div
      className={`${classname}`}>
      {meta && user
        && (
          <div className='mt-2'>
            {meta?.map((queue: any) => (
              <div key={queue.id} className='mb-8 p-4 border border border-black shadow-outset '>
                <div>
                  <Link className='' key={queue.id} href={`/admin/dashboard/queue/${queue.id}`}>
                    <div>
                      <div className='text-2xl'>{queue.name}</div>
                      <span className='text-sm'>{queue.description}</span>
                    </div>
                  </Link>
                  <span>{queue.users.length} occupants. </span>
                  <div className='w-full text-right flex flex-col items-end'>
                    <a className='block ml-auto text-sm text-gray-700 hover:underline py-1' href={`/queue/join/${queue.id}`}>queue join link</a>
                    <a className='block text-sm text-gray-700 hover:underline' href={queue.qr_code ?? ""} target='_blank'>view qr_code</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
