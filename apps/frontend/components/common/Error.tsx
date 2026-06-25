import React from 'react'
import { AlertCircle } from 'lucide-react'

export default function Error({ msg }: { msg: string }) {
  return (
    <div className='border-2 border-red-600/10 p-3 bg-red-500/10 text-red-500/50 rounded-md text-sm flex items-center gap-2'><AlertCircle className='w-5' /> {msg}</div>
  )
}
