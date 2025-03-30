import { Preview } from "@/components/ui/preview"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function Home() {
  return (
    <main className="w-full h-screen">
      <div className="fixed top-6 right-6 z-[100]">
        <ThemeToggle className="shadow-lg" />
      </div>
      <Preview />
    </main>
  )
}
