import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ExternalLink, Globe, Search } from "lucide-react";

interface ExaSearchResult {
  title: string;
  link: string;
  snippet: string;
  publishedDate?: string;
  source?: string;
  fullContent?: string;
}

interface ExaSearchResultsProps {
  results: ExaSearchResult[];
  isDark: boolean;
}

export function ExaSearchResults({ results, isDark }: ExaSearchResultsProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <Search className="w-3.5 h-3.5" />
        <span>Exa Search Results</span>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        {results.map((result, idx) => (
          <motion.button
            key={`search-${idx}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + (idx * 0.1), duration: 0.2 }}
            onClick={() => window.open(result.link, '_blank')}
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md text-xs transition-all",
              "border shadow-sm hover:shadow-md hover:-translate-y-0.5",
              isDark
                ? "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300"
                : "bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 text-blue-700"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
              isDark ? "bg-blue-500/20" : "bg-blue-500/10"
            )}>
              <Globe className="w-3 h-3" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium truncate max-w-[150px]">{result.title}</span>
              {result.source && (
                <span className="text-[10px] opacity-70 truncate max-w-[150px]">{result.source}</span>
              )}
            </div>
            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
