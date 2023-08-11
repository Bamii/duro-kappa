'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/auth.context';
import { is_admin, is_super_admin } from '@/utils/utils';
import { useRouter } from 'next/navigation';

type PropsType = {
  title: string
}

function Header({ title = "DURO" }: PropsType) {
  const { user, logout } = useAuthContext();
  const router = useRouter();

  const _logout = async () => {
    logout();
    router.push('/');
  }

  return (
    <div className='_py-4 _px-5 _bg-gray-600 _text-white text-gray-800 w-full flex items-center space-y-8 flex flex-col lg:flex-row justify-between'>
      <div className="_self-start text-4xl space-x-2">
        <span>{title}</span>
        <span className='text-sm'>by team kappa</span>
      </div>
      <div className='flex items-center text-xl space-x-3'>
        {user && is_admin(user)
          ? (
            <>
              <Link href="/admin/dashboard" className='mx-1'> queues </Link>
              {is_super_admin(user)
                ? <Link href="/admin/branches" className='mx-1'> branches </Link>
                : ""}
            </>
          )
          : null}
        {user
          ? <div className='cursor-pointer' onClick={_logout}> logout </div>
          : (
            <div className='flex'>
              <div className='mx-1'> <Link href={'/admin/login'}> login </Link> </div>
              <div className='mx-1'> <Link href={'/admin/onboard'}> signup </Link> </div>
            </div>
          )}
      </div>

    </div>
  )
}

export default Header;

