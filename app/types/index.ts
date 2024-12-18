export interface Message {
    id: number
    content: string
    sender: 'user' | 'bot'
  }
  
  export interface Resource {
    id: string
    title: string
    description: string
    link: string
  }
  
  export interface UserSettings {
    name: string
    email: string
    darkMode: boolean
  }
  
  