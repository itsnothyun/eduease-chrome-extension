"use client";

import { EduEaseSidebar } from '@/components/EduEaseSidebar'
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1"></main>
      <EduEaseSidebar />
      <Toaster />
    </div>
  )
}
