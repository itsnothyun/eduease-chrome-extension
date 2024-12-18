import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const sidebarVariants = cva(
  "fixed top-0 bottom-0 z-40 flex flex-col bg-background transition-all",
  {
    variants: {
      side: {
        left: "left-0",
        right: "right-0",
      },
      collapsible: {
        none: "",
        full: "w-[var(--sidebar-width)]",
        thin: "w-[var(--sidebar-width-collapsed)]",
      },
    },
    defaultVariants: {
      side: "left",
      collapsible: "none",
    },
  }
)

export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  asChild?: boolean
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, side, collapsible, ...props }, ref) => (
    <div
      className={cn(sidebarVariants({ side, collapsible }), className)}
      ref={ref}
      {...props}
    />
  )
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 overflow-auto", className)} {...props} />
))
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mt-auto", className)} {...props} />
))
SidebarFooter.displayName = "SidebarFooter"

export interface SidebarProviderProps {
  children: React.ReactNode
}

const SidebarContext = React.createContext<{
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}>({
  collapsed: false,
  setCollapsed: () => {},
})

const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarProvider }

