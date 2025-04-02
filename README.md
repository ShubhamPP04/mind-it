# Mind-It: Personal Knowledge Management & AI Assistant

Mind-It is a modern knowledge management application built with Next.js and Supabase that helps you organize your thoughts, notes, and research with AI assistance. It features a space-based organization system, rich text editing, and an integrated AI chat assistant.

![Mind-It Logo](public/logo.png)

## ✨ Features

- **Spaces**: Organize your content with customizable spaces
- **Multiple Content Types**: Store notes, websites, and documents
- **AI Integration**: Generate and enhance content with AI assistance
- **Chat Interface**: Interact with your knowledge base through an intuitive chat interface
- **Markdown Support**: Write notes with rich markdown formatting
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Toggle between light and dark themes
- **Real-time Updates**: Changes sync instantly via Supabase's real-time API
- **Enhanced UI/UX**: Animated interactions, glass morphism effects, and responsive layouts
- **Beautiful Authentication**: Stylish signin/signup pages with animated backgrounds

## 🎨 UI/UX Features

### Authentication Pages
Mind-It features beautifully designed authentication pages with:
- **Animated Background Effects**: Dynamic floating particles and gradient orbs
- **Glass Morphism Cards**: Semi-transparent cards with subtle backdrop blur
- **Interactive Elements**: Animation effects on buttons and links with hover/click feedback
- **Adaptive Theming**: Seamless transitions between light and dark modes
- **Responsive Design**: Optimized for all screen sizes

### Dashboard Experience
- **Intuitive Space Management**: Easy-to-use interface for creating and organizing spaces
- **Interactive Memory Button**: Enhanced with animation effects for better visibility
- **Mobile Optimized Layout**: Carefully adjusted spacing and navigation for small screens

## 🛠️ Tech Stack

- **Framework**: [Next.js 13+](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.io/)
- **Authentication**: Supabase Auth
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: Custom components with [shadcn/ui](https://ui.shadcn.com/) styling
- **AI Models**: Gemini & OpenRouter integration
- **Storage**: Supabase Storage for images and documents
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 📋 Requirements

- Node.js 16+ 
- Supabase account (free tier works)
- Gemini API key and/or OpenRouter API key for AI features

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/mind-it.git
cd mind-it
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/` or set up the following tables manually:

#### Database Schema

- **profiles**: User profiles with preferences
- **spaces**: Content organization spaces
- **notes**: Text notes with markdown support
- **websites**: Saved website content
- **documents**: Uploaded document files
- **chat_conversations**: Chat history organization
- **chat_messages**: Individual chat messages

### 4. Configure environment variables

Copy the `.env.example` file to `.env.local` and update the values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your own credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
NEXT_PUBLIC_SITE_URL=your_deployment_url
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📚 Supabase Setup Guide

### Create Required Tables

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Profiles table (created automatically via migration)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  email_notifications BOOLEAN DEFAULT FALSE,
  dark_mode BOOLEAN DEFAULT FALSE,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Spaces table
CREATE TABLE public.spaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-zinc-950',
  icon TEXT NOT NULL DEFAULT 'folder'
);

-- Notes table
CREATE TABLE public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users NOT NULL,
  space_id UUID REFERENCES public.spaces,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  color TEXT,
  image_url TEXT
);

-- Websites table
CREATE TABLE public.websites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users NOT NULL,
  space_id UUID REFERENCES public.spaces,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content TEXT NOT NULL,
  color TEXT
);

-- Documents table
CREATE TABLE public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users NOT NULL,
  space_id UUID REFERENCES public.spaces,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  document_url TEXT,
  color TEXT
);

-- Chat conversations table
CREATE TABLE public.chat_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conversation_id UUID REFERENCES public.chat_conversations NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources JSONB
);
```

### Set up Row Level Security (RLS)

Secure your tables with these RLS policies:

```sql
-- Spaces RLS
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own spaces"
  ON public.spaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spaces"
  ON public.spaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spaces"
  ON public.spaces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spaces"
  ON public.spaces FOR DELETE
  USING (auth.uid() = user_id);

-- Notes RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- Apply similar RLS policies for websites, documents, chat_conversations, and chat_messages
```

### Create Storage Buckets

Set up storage for images and documents:

```sql
-- Create images bucket for note backgrounds
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true);

-- Create documents bucket for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Set permissions for images
CREATE POLICY "Images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.uid() = auth.uid());

-- Set permissions for documents
CREATE POLICY "Users can access their own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 📦 Common Supabase Queries

### Fetch Notes by Space

```typescript
const { data, error } = await supabase
  .from('notes')
  .select('*')
  .eq('user_id', userId)
  .eq('space_id', spaceId)
  .order('created_at', { ascending: false });
```

### Create a Chat Conversation

```typescript
const { data, error } = await supabase
  .from('chat_conversations')
  .insert({
    user_id: userId,
    title: conversationTitle,
    updated_at: new Date().toISOString()
  })
  .select()
  .single();
```

### Add a Message to a Conversation

```typescript
const { data, error } = await supabase
  .from('chat_messages')
  .insert({
    conversation_id: conversationId,
    role: 'user', // or 'assistant'
    content: messageContent,
    sources: relevantSources || null
  })
  .select()
  .single();
```

### Fetch Chat History

```typescript
const { data, error } = await supabase
  .from('chat_messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true });
```

### Real-time Subscriptions

```typescript
const channel = supabase
  .channel('notes_channel')
  .on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'notes',
      filter: `user_id=eq.${userId}`
    }, 
    (payload) => {
      // Handle changes
    }
  )
  .subscribe();
```

## 🔧 Version Control & Contributing

### Environment Variables

The `.env.example` file is included in the repository to help new contributors set up their local environment. It contains all necessary environment variables with placeholder values.

- Do not commit your actual `.env.local` file with real credentials
- If you add new environment variables, update the `.env.example` file accordingly
- The `.gitignore` file is configured to ignore all `.env` files except `.env.example`

To use in your local environment:

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your own credentials
nano .env.local
```

### Pull Requests

When submitting a pull request:

1. Ensure any new features are documented in the README
2. Update any relevant environment variables in `.env.example`
3. Make sure your code passes existing tests
4. Add tests for new features when applicable

## 📝 License

[MIT License](LICENSE)
