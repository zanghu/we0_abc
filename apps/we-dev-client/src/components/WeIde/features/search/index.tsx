import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { useFileSearch } from './hooks/useFileSearch';
import { cn } from '../../utils/cn';
import './styles/search.css';

interface SearchProps {
  onFileSelect: (path: string, line?: number) => void;
}

export function Search({ onFileSelect }: SearchProps) {
  const { 
    searchResults, 
    currentMatchIndex,
    totalMatches,
    handleSearch,
    navigateMatch,
    isLoading
  } = useFileSearch();

  return (
    <div className={cn(
      "h-full flex flex-col",
      "bg-[#FFFFFF] dark:bg-[#1E1E1E]",
      "text-[#333333] dark:text-[#CCCCCC]"
    )}>
      <div className={cn(
        "p-2",
        "border-b border-[#E4E4E4] dark:border-[#3C3C3C]",
        "bg-[#F3F3F3] dark:bg-[#252526]",
        "shadow-[0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-none"
      )}>
        <SearchBar 
          onSearch={handleSearch}
          totalResults={totalMatches}
          currentMatch={totalMatches > 0 ? currentMatchIndex + 1 : 0}
          onNavigate={navigateMatch}
        />
      </div>
      <div className={cn(
        "flex-1 overflow-hidden",
        "p-2",
        "bg-[#FFFFFF] dark:bg-[#1E1E1E]"
      )}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md",
              "text-[#424242] dark:text-[#CCCCCC]",
              "bg-[#F3F3F3] dark:bg-[#252526]",
              "border border-[#E4E4E4] dark:border-[#3C3C3C]",
              "shadow-sm dark:shadow-none"
            )}>
              <svg 
                className="w-4 h-4 animate-spin" 
                viewBox="0 0 24 24" 
                fill="none"
                stroke="currentColor"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm font-medium">搜索中...</span>
            </div>
          </div>
        ) : (
          <SearchResults 
            results={searchResults}
            currentMatchIndex={currentMatchIndex}
            onFileSelect={onFileSelect}
          />
        )}
      </div>
    </div>
  );
}