'use client'

import * as React from 'react'
import { Book, Bookmark, ExternalLink, Home, Send, Settings, Save, LogOut, RefreshCw, X, Search, PenTool, Trash2, Globe, Maximize2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import {
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Message as MessageType, Resource as ResourceType } from '@/types'
import { ResourceExpandView } from './ResourceExpandView'
import Image from "next/image";

const shakeAnimation = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}
.shake-animation:hover {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}
` as const;

interface UserSettings {
  name: string;
  email: string;
  darkMode: boolean;
}

const EduEaseSidebar = () => {
  const [messages, setMessages] = React.useState<MessageType[]>([])
  const [input, setInput] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('home')
  const [searchHistory, setSearchHistory] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [userName, setUserName] = React.useState<string | null>(null)
  const [userNameInput, setUserNameInput] = React.useState('')
  const [userSettings, setUserSettings] = React.useState<UserSettings>({
    name: 'Guest',
    email: 'user@example.com',
    darkMode: false,
  })
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [collections, setCollections] = React.useState<{ name: string; resources: ResourceType[] }[]>([])
  const [activeCollection, setActiveCollection] = React.useState<string | null>(null)
  const [newCollectionName, setNewCollectionName] = React.useState('')
  const [deleteCollectionName, setDeleteCollectionName] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = React.useState(false);
  const [selectedResource, setSelectedResource] = React.useState<ResourceType | null>(null);
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [expandedResource, setExpandedResource] = React.useState<ResourceType | null>(null);
  const [expandedContent, setExpandedContent] = React.useState<string>('');
  const [isExpandedLoading, setIsExpandedLoading] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const { addToast } = useToast()

  const [sidebarWidth, setSidebarWidth] = React.useState(400); // Default width
  const [isResizing, setIsResizing] = React.useState(false);

  const darkModeStyles = {
    backgroundColor: '#1E1E1E',
    color: '#D1D1D1',
    inputBackground: '#2A2A2A',
    inputText: '#E0E0E0',
    buttonBackground: '#3A3A3A',
    buttonText: '#FFFFFF',
    iconColor: '#B0B0B0',
  };

  const inputStyle = {
    backgroundColor: userSettings.darkMode ? darkModeStyles.inputBackground : '#F0F0F0',
    color: userSettings.darkMode ? darkModeStyles.inputText : '#000000',
  };

  const buttonStyle = {
    backgroundColor: userSettings.darkMode ? darkModeStyles.buttonBackground : '#000000',
    color: userSettings.darkMode ? darkModeStyles.buttonText : '#FFFFFF',
  };

  // Handle localStorage after mount
  React.useEffect(() => {
    const savedName = localStorage.getItem('eduease-user-name')
    if (savedName) {
      setUserName(savedName)
      setUserSettings(prev => ({ ...prev, name: savedName }))
    }
  }, [])

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      if (error.message.includes('ResizeObserver loop completed with undelivered notifications')) {
        // Suppress this specific error
        return;
      }
      console.error("Unhandled error:", error.message);
      addToast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    };

    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  React.useEffect(() => {
    // Add the animation styles to the document
    const styleSheet = document.createElement("style");
    styleSheet.textContent = shakeAnimation;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  React.useEffect(() => {
    addToast();
  }, [addToast]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      console.warn("Input is empty. No action taken.");
      return;
    }

    setIsLoading(true);
    console.log("Sending input to API:", input);

    // Add user message to the chat
    const userMessage = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      // Prepare conversation history with system message and recent messages
      const recentMessages = messages.slice(-5); // Keep last 5 messages to prevent token limit
      const conversationHistory = [
        { role: "system", content: "You are Scholar GPT, an academic assistant that provides academic information in a structured format." },
        ...recentMessages.map((msg) => ({
          role: msg.sender,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        })),
        { role: "user", content: input }
      ];

      // Call Scholar GPT API with conversation history
      const response = await fetch("/api/scholar-gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: conversationHistory,
          userPrompt: input // Keep for backward compatibility
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received response from API:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant message with parsed resources
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: data.result,
        sender: "assistant",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error fetching GPT response:", error);

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: [
          {
            id: "error",
            title: "Error",
            description: error.message || "Failed to process request. Please try again.",
            link: "#",
          },
        ],
        sender: "assistant",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = userNameInput.trim()
    if (name) {
      localStorage.setItem('eduease-user-name', name)
      setUserName(name)
      setUserSettings(prev => ({ ...prev, name }))
      setUserNameInput('')
      addToast({
        title: "Welcome!",
        description: `Great to have you here, ${name}!`,
        variant: "success",
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('eduease-user-name')
    setUserName(null)
    setUserSettings(prev => ({ ...prev, name: 'Guest' }))
    setMessages([])
    addToast({
      title: "Logged out successfully",
      description: "See you next time!",
      variant: "success",
    })
  }

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, addToast]);

  React.useEffect(() => {
    document.body.classList.toggle('dark', userSettings.darkMode);
  }, [userSettings.darkMode]);

  const handleCreateCollection = (name: string) => {
    if (collections.some(c => c.name === name)) {
      addToast({
        title: "Collection exists",
        description: "A collection with this name already exists.",
        variant: "destructive",
      });
      return false;
    }
    
    setCollections(prev => [...prev, { name, resources: [] }]);
    addToast({
      title: "Collection created",
      description: `Created collection &quot;${name}&quot;`,
      variant: "success",
    });
    return true;
  };

  const handleAddToCollection = (collectionName: string, resource: ResourceType) => {
    setCollections(prev => prev.map(collection => {
      if (collection.name === collectionName) {
        // Check if resource already exists in collection
        if (collection.resources.some(r => r.id === resource.id)) {
          addToast({
            title: "Already saved",
            description: "This resource is already in the collection.",
            variant: "destructive",
          });
          return collection;
        }
        return {
          ...collection,
          resources: [...collection.resources, resource],
        };
      }
      return collection;
    }));
  };

  const handleSaveToCollection = (resource: ResourceType, collectionName: string) => {
    if (collections.length === 0) {
      const created = handleCreateCollection(collectionName);
      if (created) {
        handleAddToCollection(collectionName, resource);
      }
    } else {
      const collectionExists = collections.some((collection) => collection.name === collectionName);
      if (!collectionExists) {
        const createNew = confirm("Collection not found. Would you like to create it?");
        if (createNew) {
          const created = handleCreateCollection(collectionName);
          if (created) {
            handleAddToCollection(collectionName, resource);
          }
        } else {
          addToast({
            title: "Collection Not Found",
            description: "The specified collection does not exist.",
            variant: "destructive",
          });
        }
        return;
      }

      handleAddToCollection(collectionName, resource);
    }
  };

  const handleRemoveSearch = (_: number, index: number) => {
    setSearchHistory(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearChat = () => {
    setMessages([]);
    addToast({
      title: "Chat Cleared",
      description: "All messages have been removed.",
      variant: "success",
    });
  };

  const handleExpandResource = async (resource: ResourceType) => {
    setExpandedResource(resource);
    setIsExpandedLoading(true);
    
    try {
      const response = await fetch('/api/expand-resource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: resource.title,
          description: resource.description,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setExpandedContent(data.content);
    } catch (error) {
      console.error('Error fetching expanded content:', error);
      setExpandedContent('Failed to load detailed content. Please try again.');
    } finally {
      setIsExpandedLoading(false);
    }
  };

  const MessageCard = ({ message }: { message: MessageType }) => {
    const handleSaveClick = (resource: ResourceType) => {
      setSelectedResource(resource);
      setIsSaveDialogOpen(true);
    };

    if (message.sender === 'user') {
      return (
        <div className="flex justify-end mb-4">
          <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-3 max-w-[80%] transform transition-all hover:scale-[1.02]">
            <p className="text-sm">{message.content as string}</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex flex-col space-y-4 mb-4">
          {Array.isArray(message.content) ? (
            message.content.map((resource: ResourceType, _) => (
              <Card 
                key={resource.id} 
                className="w-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-transform transform hover:scale-[1.02] rounded-lg p-4 border border-gray-200 dark:border-gray-800"
              >
                <CardHeader>
                  <CardTitle className={cn(
                    "text-lg font-semibold",
                    userSettings.darkMode ? "text-white" : "text-gray-900"
                  )}>{resource.title}</CardTitle>
                  <CardDescription className={cn(
                    "text-sm",
                    userSettings.darkMode ? "text-gray-300" : "text-gray-500"
                  )}>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className={cn(
                    "text-gray-600 dark:text-gray-300",
                    userSettings.darkMode ? "text-gray-300" : "text-gray-500"
                  )}>{resource.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <Button
                    variant="link"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors"
                    onClick={() => window.open(resource.link, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Resource
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleSaveClick(resource)}
                    className={cn(
                      "flex items-center transition-colors duration-200",
                      userSettings.darkMode
                        ? "text-white hover:text-blue-400 hover:bg-gray-700/50"
                        : "text-black hover:text-blue-600 hover:bg-gray-100"
                    )}
                  >
                    <Save className={cn(
                      "w-4 h-4 mr-1",
                      userSettings.darkMode ? "text-white" : "text-black"
                    )} />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExpandResource(resource);
                    }}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      userSettings.darkMode 
                        ? "text-white hover:text-white/90 hover:bg-gray-700/50" 
                        : "text-black hover:text-black/90 hover:bg-gray-100"
                    )}
                  >
                    <Maximize2 className={cn(
                      "h-4 w-4",
                      userSettings.darkMode ? "text-white" : "text-black"
                    )} />
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 transform transition-all hover:scale-[1.02]">
              <p className="text-sm">{message.content}</p>
            </div>
          )}
        </div>

        {isSaveDialogOpen && selectedResource && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[400px] max-w-[90vw] overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className={cn(
                    "text-lg font-semibold",
                    userSettings.darkMode ? "text-white" : "text-gray-900"
                  )}>Save to Collection</h3>
                  <button
                    onClick={() => {
                      setIsSaveDialogOpen(false);
                      setNewCollectionName('');
                    }}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <Input
                      ref={(input) => {
                        if (input) {
                          input.focus();
                        }
                      }}
                      value={newCollectionName}
                      onChange={(e) => {
                        e.preventDefault();
                        const value = e.target.value;
                        setNewCollectionName(value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      placeholder="Enter collection name"
                      className={cn(
                        "w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
                        userSettings.darkMode ? "text-white" : "text-gray-900"
                      )}
                      autoFocus
                    />
                    <p className={cn(
                      "mt-2 text-sm",
                      userSettings.darkMode ? "text-gray-300" : "text-gray-500"
                    )}>
                      Create a new collection or choose from existing ones below
                    </p>
                  </div>

                  {collections.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-sm font-medium",
                          userSettings.darkMode ? "text-white" : "text-gray-900"
                        )}>Existing Collections</p>
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded-full",
                          userSettings.darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                        )}>{collections.length}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                        {collections.map((collection) => (
                          <Button
                            key={collection.name}
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left p-3",
                              userSettings.darkMode 
                                ? "text-white hover:text-white border-gray-700 bg-gray-800/50 hover:bg-gray-700/50" 
                                : "text-black hover:text-black border-gray-200 bg-gray-50/50 hover:bg-gray-100/50"
                            )}
                            onClick={() => {
                              handleSaveToCollection(selectedResource, collection.name);
                              setIsSaveDialogOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Book className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{collection.name}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsSaveDialogOpen(false);
                    setNewCollectionName('');
                  }}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!newCollectionName.trim()) {
                      addToast({
                        title: "Error",
                        description: "Collection name cannot be empty",
                        variant: "destructive",
                      });
                      return;
                    }
                    handleSaveToCollection(selectedResource, newCollectionName);
                    setIsSaveDialogOpen(false);
                    setNewCollectionName('');
                  }}
                  disabled={!newCollectionName.trim()}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  Create & Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const handleConfirmCreateCollection = (name: string) => {
    if (collections.some(c => c.name === name)) {
      addToast({
        title: "Collection exists",
        description: "A collection with this name already exists.",
        variant: "destructive",
      });
      return false;
    }
    
    setCollections(prev => [...prev, { name, resources: [] }]);
    addToast({
      title: "Collection created",
      description: `Created collection &quot;${name}&quot;`,
      variant: "success",
    });
    return true;
  };

  const handleDeleteCollection = (collectionName: string) => {
    setCollections(prev => prev.filter(c => c.name !== collectionName));
    setActiveCollection(null);
    addToast({
      title: "Collection Deleted",
      description: `Successfully deleted &quot;${collectionName}&quot;`,
      variant: "success",
    });
    setDeleteCollectionName(null);
  };

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'courses', icon: Book, label: 'Courses' },
    { id: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'courses':
        return (
          <div>
            <h2 className={cn(
              "text-lg font-semibold mb-4",
              userSettings.darkMode ? "text-white" : "text-gray-900"
            )}>Search History</h2>
            <div className="relative mb-2">
              <Search className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5", userSettings.darkMode ? "text-gray-400" : "text-black")} />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={inputStyle}
                className={cn(
                  "w-full pl-10 rounded-md border-none py-2",
                  userSettings.darkMode ? "bg-gray-700 text-white placeholder-white" : "bg-white text-black"
                )}
              />
            </div>
            <ul className="space-y-1">
              {searchHistory.map((item, _) => (
                <li key={item} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded-md">
                  <div>
                    <p className={cn(
                      "font-medium text-sm",
                      userSettings.darkMode ? "text-white" : "text-gray-900"
                    )}>{item}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSearch(_, searchHistory.indexOf(item))}
                    className="text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )
      case 'bookmarks':
        return (
          <div className="p-4 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className={cn(
                "text-xl font-semibold",
                userSettings.darkMode ? "text-white" : "text-gray-900"
              )}>Collections</h2>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-md px-4 py-2 shadow-md"
              >
                + New Collection
              </Button>
            </div>
            
            {collections.length === 0 ? (
              <div className="flex flex-col items-center justify-center space-y-4 text-gray-500">
                <Bookmark className="w-12 h-12 text-gray-400" />
                <p className={cn(
                  "text-lg font-medium",
                  userSettings.darkMode ? "text-white" : "text-gray-900"
                )}>No collections yet</p>
                <p className={cn(
                  "text-sm",
                  userSettings.darkMode ? "text-gray-300" : "text-gray-500"
                )}>
                  Create a collection to start organizing your resources
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {collections.map((collection) => (
                  <div
                    key={collection.name}
                    onClick={() => setActiveCollection(collection.name)}
                    className={`group relative p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      activeCollection === collection.name
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    } border dark:border-gray-700`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bookmark className={`w-5 h-5 ${
                          activeCollection === collection.name
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-gray-400 dark:text-gray-500'
                        }`} />
                        <h3 className={cn(
                          "font-medium",
                          userSettings.darkMode ? "text-white" : "text-gray-900"
                        )}>{collection.name}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCollectionName(collection.name);
                        }}
                        className={`h-8 w-8 p-0 transition-all duration-200 ${
                          activeCollection === collection.name
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        } hover:bg-red-50 dark:hover:bg-red-900/20`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                    <p className={cn(
                      "text-sm",
                      userSettings.darkMode ? "text-gray-300" : "text-gray-500"
                    )}>
                      {collection.resources.length} resources saved
                    </p>
                  </div>
                ))}
              </div>
            )}

            {isDialogOpen && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[400px] max-w-[90vw] overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className={cn(
                        "text-lg font-semibold",
                        userSettings.darkMode ? "text-white" : "text-gray-900"
                      )}>Create New Collection</h3>
                      <button
                        onClick={() => setIsDialogOpen(false)}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Input
                          ref={(input) => {
                            if (input) {
                              input.focus();
                            }
                          }}
                          value={newCollectionName}
                          onChange={(e) => {
                            e.preventDefault();
                            const value = e.target.value;
                            setNewCollectionName(value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                            }
                          }}
                          placeholder="Enter collection name"
                          className={cn(
                            "w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400",
                            userSettings.darkMode ? "text-white" : "text-gray-900"
                          )}
                          autoFocus
                        />
                        <p className={cn(
                          "mt-2 text-sm",
                          userSettings.darkMode ? "text-gray-300" : "text-gray-500"
                        )}>
                          Create a new collection to organize your saved resources
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      onClick={() => setIsDialogOpen(false)}
                      className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (!newCollectionName.trim()) {
                          addToast({
                            title: "Error",
                            description: "Collection name cannot be empty",
                            variant: "destructive",
                          });
                          return;
                        }
                        handleConfirmCreateCollection(newCollectionName);
                        setIsDialogOpen(false);
                        setNewCollectionName('');
                      }}
                      disabled={!newCollectionName.trim()}
                      className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      Create Collection
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      case 'settings':
        return (
          <div className={cn(
            "space-y-6",
            userSettings.darkMode ? "text-white" : "text-gray-900"
          )}>
            <div>
              <h2 className={cn(
                "text-lg font-semibold mb-2",
                userSettings.darkMode ? "text-white" : "text-gray-900"
              )}>Profile Information</h2>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" alt={userSettings.name} />
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                      {userSettings.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={userSettings.name}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, name: e.target.value }))}
                        className="font-medium bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 px-1 py-0.5 text-white dark:text-white"
                      />
                    ) : (
                      <p className={cn(
                        "font-medium",
                        userSettings.darkMode ? "text-white" : "text-gray-900"
                      )}>{userSettings.name}</p>
                    )}
                    {isEditingProfile ? (
                      <input
                        type="email"
                        value={userSettings.email}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                        className="text-sm text-muted-foreground text-gray-500 opacity-75 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:ring-blue-400 px-1 py-0.5 mt-1 text-white dark:text-white"
                      />
                    ) : (
                      <p className={cn(
                        "text-sm text-muted-foreground",
                        userSettings.darkMode ? "text-gray-300" : "text-gray-500"
                      )}>{userSettings.email}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isEditingProfile) {
                      addToast({
                        title: "Profile Updated",
                        description: "Your profile information has been saved.",
                        variant: "success",
                      });
                    }
                    setIsEditingProfile(!isEditingProfile);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {isEditingProfile ? 'Save' : 'Edit'}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={cn(
                    "text-lg font-semibold mb-1",
                    userSettings.darkMode ? "text-white" : "text-gray-900"
                  )}>Dark Mode</h3>
                  <p className={cn(
                    "text-sm",
                    userSettings.darkMode ? "text-gray-300" : "text-gray-500"
                  )}>
                    Toggle between light and dark themes
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={userSettings.darkMode}
                  onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, darkMode: checked }))}
                />
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className={cn(
                  "text-lg font-semibold mb-2",
                  userSettings.darkMode ? "text-white" : "text-gray-900"
                )}>About EduEase</h3>
                <p className={cn(
                  "text-sm text-muted-foreground",
                  userSettings.darkMode ? "text-gray-300" : "text-gray-500"
                )}>
                  EduEase is your AI-powered study buddy, designed to help you find and organize learning resources efficiently.
                </p>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className={cn(
                    "flex items-center bg-red-600 hover:bg-red-700 transition-colors duration-200 shake-animation",
                    userSettings.darkMode ? "text-white" : "text-white"
                  )}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <>
            {!userName ? (
              <div className="h-[calc(100vh-200px)] flex items-center justify-center text-muted-foreground">
                <div className="w-[80%]">
                  <p className={cn(
                    "text-lg font-semibold mb-4",
                    userSettings.darkMode ? "text-white" : "text-gray-900"
                  )}>Welcome to EduEase</p>
                  <form onSubmit={handleNameSubmit} className="space-y-4">
                    <div className="mb-6">
                      <Input
                        type="text"
                        placeholder="Enter your name"
                        value={userNameInput}
                        onChange={(e) => setUserNameInput(e.target.value)}
                        style={inputStyle}
                        className={cn(
                          "w-full rounded-md border-none resize-none pl-3 py-2",
                          userSettings.darkMode ? "text-white" : "text-gray-900"
                        )}
                        required
                      />
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="solid"
                        size="lg"
                        className="hover:bg-gray-800 px-6 py-2"
                        style={buttonStyle}
                      >
                        Get Started
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-[calc(100vh-200px)] flex items-center justify-center text-muted-foreground">
                <div className="w-[80%]">
                  <p className={cn(
                    "text-lg font-semibold mb-2",
                    userSettings.darkMode ? "text-white" : "text-gray-900"
                  )}>Welcome, {userName}!</p>
                  <p className={cn(
                    "text-gray-500 opacity-75",
                    userSettings.darkMode ? "text-gray-300" : "text-gray-500"
                  )}>
                    Start by asking a question or searching for a topic.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <MessageCard key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex justify-start items-center space-x-2 text-gray-500">
                    <div className="animate-spin h-5 w-5 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    <p className={cn(
                      "text-sm",
                      userSettings.darkMode ? "text-gray-300" : "text-gray-500"
                    )}>Searching...</p>
                  </div>
                )}
              </div>
            )}
          </>
        )
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true);
  }, []);

  React.useEffect(() => {
    const resize = (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        // Calculate the new width by taking the window width minus the mouse position from the right edge
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        if (newWidth >= 300 && newWidth <= 800) {
          setSidebarWidth(newWidth);
        }
      }
    };

    const stopResizing = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  return (
    <SidebarProvider>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(true)}
        style={{
          position: 'fixed',
          right: '20px',
          top: '20px',
          zIndex: 40,
          transition: 'transform 0.3s ease-in-out, opacity 0.2s ease-in-out',
          transform: sidebarOpen ? 'translateX(100%)' : 'translateX(0)',
          opacity: sidebarOpen ? 0 : 1
        }}
        className="rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-110 w-10 h-10 flex items-center justify-center"
      >
        <Book className="h-5 w-5 text-blue-600" />
      </Button>
      <div 
        ref={sidebarRef}
        style={{ 
          position: 'fixed',
          right: '0',
          top: '0',
          bottom: '0',
          width: `${sidebarWidth}px`,
          zIndex: 50,
          transition: isResizing ? 'none' : 'width 0.3s ease-in-out',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          opacity: sidebarOpen ? 1 : 0,
          visibility: sidebarOpen ? 'visible' : 'hidden'
        }}
        className="flex flex-col bg-white dark:bg-gray-900 shadow-lg border-l border-gray-200 dark:border-gray-800"
      >
        <div
          onMouseDown={startResizing}
          className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:w-1.5 group ${
            isResizing ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500'
          }`}
          style={{
            transform: 'translateX(-50%)'
          }}
        />

        <SidebarHeader className="p-4 text-center relative border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
          <Image src="/assets/logo.png" alt="EduEase Logo" width={100} height={50} />
          <h1 className={cn(
            "text-2xl font-bold",
            userSettings.darkMode ? "text-white" : "text-gray-900"
          )}>EduEase</h1>
          <p className={cn(
            "mt-2 text-sm text-muted-foreground",
            userSettings.darkMode ? "text-gray-300" : "text-gray-500"
          )}>
            Your AI-powered study buddy
          </p>
        </SidebarHeader>
        <SidebarContent className="flex flex-1 flex-col relative">
          {deleteCollectionName && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100]">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[400px] max-w-[90vw] overflow-hidden animate-in fade-in duration-200">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                      <Trash2 className="w-5 h-5" />
                      <h3 className={cn(
                        "text-lg font-semibold",
                        userSettings.darkMode ? "text-white" : "text-gray-900"
                      )}>Delete Collection</h3>
                    </div>
                    <button
                      onClick={() => setDeleteCollectionName(null)}
                      className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <p className={cn(
                      "text-gray-600 dark:text-gray-300",
                      userSettings.darkMode ? "text-gray-300" : "text-gray-500"
                    )}>
                      Are you sure you want to delete <span className={cn(
                        "font-semibold",
                        userSettings.darkMode ? "text-white" : "text-gray-900"
                      )}>"{deleteCollectionName}"</span>?
                    </p>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-4">
                      <div className="flex space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <p className={cn(
                            "text-sm font-medium",
                            userSettings.darkMode ? "text-red-800 dark:text-red-300" : "text-red-800"
                          )}>Warning: This action cannot be undone</p>
                          <p className={cn(
                            "mt-1 text-sm",
                            userSettings.darkMode ? "text-red-700 dark:text-red-200" : "text-red-700"
                          )}>
                            All resources in this collection will be permanently deleted.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteCollectionName(null)}
                    className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDeleteCollection(deleteCollectionName)}
                    className="bg-red-600 hover:bg-red-700 text-white focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    Delete Collection
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-1 flex-col h-full">
            <div className={cn(
              "flex py-3",
              userSettings.darkMode 
                ? "border-t-0 border-b-0" 
                : "border-t border-b"
            )}> 
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  className="flex-1 justify-center py-3"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon
                    className={cn(
                      "h-6 w-6 transition-transform duration-200 transform hover:scale-105",
                      activeTab === tab.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : userSettings.darkMode
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  />
                  <span className="sr-only">{tab.label}</span>
                </Button>
              ))}
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {renderContent()}
            </div>
            {activeTab === 'home' && (
              <>
                <Separator />
                <div className="p-4">
                  {userName && (
                    <>
                      <div className="flex justify-end mb-2 space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearChat}
                          className={cn(
                            "hover:bg-gray-100 dark:hover:bg-gray-800 transition-transform duration-200 transform hover:scale-110",
                            userSettings.darkMode ? "text-white" : "text-gray-600"
                          )}
                          title="Clear Chat"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "hover:bg-gray-100 dark:hover:bg-gray-800 transition-transform duration-200 transform hover:scale-110",
                            userSettings.darkMode ? "text-white" : "text-gray-600"
                          )}
                          title="Browser"
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "hover:bg-gray-100 dark:hover:bg-gray-800 transition-transform duration-200 transform hover:scale-110",
                            userSettings.darkMode ? "text-white" : "text-gray-600"
                          )}
                          title="Tools"
                        >
                          <PenTool className="h-4 w-4" />
                        </Button>
                      </div>
                      <form onSubmit={handleSend} className="flex items-center gap-2">
                        <div className="relative flex-1 flex items-center">
                          <textarea
                            rows={3}
                            placeholder="Ask about a topic..."
                            value={input}
                            onChange={handleInputChange}
                            className={cn(
                              "w-full bg-gray-100 dark:bg-gray-800 rounded-md border-none resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 pr-12",
                              userSettings.darkMode ? "text-white placeholder-gray-400" : "text-gray-900 placeholder-gray-500"
                            )}
                            style={{ wordBreak: "break-word" }}
                          />
                          <Button type="submit" size="icon" className="absolute right-0">
                            <Send className={cn(
                              "h-5 w-5",
                              userSettings.darkMode ? "text-white" : "text-gray-900"
                            )} />
                          </Button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </SidebarContent>
      </div>
      <ResourceExpandView
        isOpen={!!expandedResource}
        onClose={() => {
          setExpandedResource(null);
          setExpandedContent('');
        }}
        title={expandedResource?.title || ''}
        description={expandedResource?.description || ''}
        expandedContent={expandedContent}
        isLoading={isExpandedLoading}
      />
    </SidebarProvider>
  );
};

export default EduEaseSidebar;
