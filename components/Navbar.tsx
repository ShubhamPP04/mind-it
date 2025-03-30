import { useUser } from '@/contexts/UserContext'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User as UserIcon } from 'lucide-react'

export default function Navbar() {
  const { profile } = useUser()

  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center px-4">
        <div className="ml-auto flex items-center space-x-4">
          {/* Other navbar items */}
          
          <Avatar className="h-8 w-8 transition-all duration-300 hover:scale-105">
            <AvatarImage 
              src={profile?.avatar_url || undefined} 
              alt="User avatar" 
              className="object-cover object-center"
            />
            <AvatarFallback className="animate-pulse bg-muted">
              <UserIcon className="h-4 w-4 text-muted-foreground/60" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  )
} 