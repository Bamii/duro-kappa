'use client'
import { useEffect, useMemo } from 'react';
import { useBranchContext } from '@/contexts/branch.context';
import toast from 'react-hot-toast';
import { useAuthContext } from '@/contexts/auth.context';
import { useScreenContext } from '@/contexts/screen.context';
import { usePathname } from 'next/navigation';

export default function Page() {
  const { get_branches, branches } = useBranchContext();
  const { user } = useAuthContext();

  const pathname = usePathname();
  const { is_mobile, screen_size } = useScreenContext();
  const pn = useMemo(() => pathname.split('/'), [pathname])
  const classname = useMemo(() => pn.length > 3 && is_mobile() ? "hidden" : "block", [pn, screen_size, is_mobile()])

  useEffect(() => {
    if (!branches)
      get_branches()
        .catch((e: any) => { toast.error(e.message) });
  }, [branches, get_branches])

  return (
    <div className={classname}>
      {branches && user
        && (
          <div>
            {branches.map((branch: any) => (
              <div key={branch.id} className='mb-8 p-4 border border border-black shadow-outset'>
                <div className='' key={branch.id}>
                  <div className='text-xl'>branch location: {branch.location}</div>
                  <span className='text-sm text-gray-400'>branch coordinates: {branch.coordinates}</span>
                  <div className='mt-5 text-bold'> admin: </div>
                  <div> {branch?.admin?.username ? `${branch.admin.username}  -  ` : ''}{branch?.admin?.email} </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
