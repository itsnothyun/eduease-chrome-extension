'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ResourceExpandViewProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  expandedContent?: string
  isLoading: boolean
}

export function ResourceExpandView({
  isOpen,
  onClose,
  title,
  description,
  expandedContent,
  isLoading
}: ResourceExpandViewProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {description}
              </p>
            </div>

            <ScrollArea className="h-[60vh] pr-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">{children}</h3>,
                      p: ({ children }) => <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4">{children}</ul>,
                      li: ({ children }) => <li className="text-gray-600 dark:text-gray-300">{children}</li>,
                      code: ({ children }) => (
                        <code className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded-md text-sm">
                          {children}
                        </code>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 italic text-gray-600 dark:text-gray-300">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {expandedContent || ''}
                  </ReactMarkdown>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          <Button
            onClick={onClose}
            className="w-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
