import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SubjectSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount: number;
}

export function SubjectSearch({
  searchQuery,
  onSearchChange,
  resultCount,
}: SubjectSearchProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-9 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {searchQuery && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}