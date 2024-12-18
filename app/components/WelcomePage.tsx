'use client'

import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface WelcomePageProps {
  onNameSubmit: (name: string) => void;
}

export function WelcomePage({ onNameSubmit }: WelcomePageProps) {
  const [name, setName] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onNameSubmit(name.trim())
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-[400px] p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Welcome to EduEase</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              What&apos;s your name?
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full flex items-center border border-gray-300 px-3 py-1 rounded hover:bg-black hover:text-white transition-colors duration-200"
          >
            Get Started
          </Button>
        </form>
      </div>
    </div>
  )
}
