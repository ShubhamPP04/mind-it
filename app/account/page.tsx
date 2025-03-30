'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Bell, Lock, User as UserIcon, Mail, Globe, Shield, Moon, Sun, Upload } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { cn } from '@/lib/utils'
import { useUser } from '@/contexts/UserContext'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  email_notifications: boolean
  dark_mode: boolean
  updated_at: string
}

export default function AccountPage() {
  const { user, profile, updateProfile } = useUser()
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    website: '',
  })
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        website: profile.website || '',
      })
    }
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProfileUpdate = async (field: string, value: string | boolean) => {
    try {
      if (!user) throw new Error('No user')

      await updateProfile({
        [field]: value
      })

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      })
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').pop()
        if (oldFileName) {
          const { error: removeError } = await supabase.storage
            .from('avatars')
            .remove([oldFileName])
          
          if (removeError) {
            console.error('Error removing old avatar:', removeError)
          }
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      await updateProfile({
        avatar_url: publicUrl
      })

      toast({
        title: "Success",
        description: "Avatar updated successfully.",
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload avatar.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  async function updatePassword() {
    try {
      if (!user) throw new Error('No user')
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Password updated successfully.",
      })

      // Clear password fields
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error updating password:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password.",
        variant: "destructive",
      })
    }
  }

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to access your account settings.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.href = '/auth/signin'} className="w-full">
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container relative mx-auto min-h-screen max-w-4xl px-4 py-8 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      <div className="flex flex-col space-y-8 pb-16">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight animate-in fade-in slide-in-from-left-2 duration-700">
            Account Settings
          </h1>
          <p className="text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-700 delay-200">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="w-full justify-start border-b bg-transparent p-0 animate-in fade-in-50 duration-1000 delay-300">
            <TabsTrigger
              value="general"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-all hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-all hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Preferences
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-all hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-x-6">
                  <Avatar className="h-20 w-20 transition-all duration-300 hover:scale-105 ring-2 ring-offset-2 ring-offset-background ring-border/50">
                    <AvatarImage 
                      src={profile?.avatar_url || undefined} 
                      alt="User avatar" 
                      className="object-cover object-center"
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    />
                    <AvatarFallback className="animate-pulse bg-muted">
                      <UserIcon className="h-10 w-10 text-muted-foreground/60" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Upload a new avatar
                    </div>
                    <div className="relative group">
                      <Button variant="outline" size="sm" className="transition-all duration-300 group-hover:border-primary">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={uploadAvatar}
                          disabled={uploading}
                        />
                        <Upload className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                        {uploading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2 transition-all duration-300 hover:scale-[1.02]">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="grid gap-2 transition-all duration-300 hover:scale-[1.02]">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input 
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      onBlur={() => handleProfileUpdate('full_name', formData.full_name)}
                      placeholder="Enter your full name"
                      className="transition-all duration-300 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="grid gap-2 transition-all duration-300 hover:scale-[1.02]">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      onBlur={() => handleProfileUpdate('username', formData.username)}
                      placeholder="Enter your username"
                      className="transition-all duration-300 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="grid gap-2 transition-all duration-300 hover:scale-[1.02]">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleInputChange}
                      onBlur={() => handleProfileUpdate('website', formData.website)}
                      placeholder="https://example.com"
                      className="transition-all duration-300 focus:scale-[1.02]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Manage your notification and display preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 transition-all duration-300 hover:scale-[1.02]">
                  <Label htmlFor="notifications" className="flex flex-col space-y-1">
                    <span>Email Notifications</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Receive email notifications about account activity.
                    </span>
                  </Label>
                  <Switch 
                    id="notifications"
                    checked={profile?.email_notifications || false}
                    onCheckedChange={(checked) => handleProfileUpdate('email_notifications', checked)}
                    className="transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 transition-all duration-300 hover:scale-[1.02]">
                  <Label htmlFor="dark_mode" className="flex flex-col space-y-1">
                    <span>Dark Mode</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Toggle between light and dark mode.
                    </span>
                  </Label>
                  <Switch 
                    id="dark_mode"
                    checked={profile?.dark_mode || false}
                    onCheckedChange={(checked) => handleProfileUpdate('dark_mode', checked)}
                    className="transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card className="transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your security settings and devices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2 transition-all duration-300 hover:scale-[1.02]">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input 
                      id="current_password" 
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="transition-all duration-300 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="grid gap-2 transition-all duration-300 hover:scale-[1.02]">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input 
                      id="new_password" 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="transition-all duration-300 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="grid gap-2 transition-all duration-300 hover:scale-[1.02]">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input 
                      id="confirm_password" 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="transition-all duration-300 focus:scale-[1.02]"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  onClick={updatePassword}
                  className="transition-all duration-300 hover:scale-105 active:scale-95"
                  disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                >
                  Update Password
                </Button>
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  className="transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Sign Out
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 