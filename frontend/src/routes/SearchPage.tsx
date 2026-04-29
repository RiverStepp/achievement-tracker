import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchService } from "@/services/search";
import type { AchievementSearchResult, PagedResult } from "@/types/search";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const FIRST_PAGE_NUMBER = 1;

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : FIRST_PAGE_NUMBER;
}

function buildGameHeaderFallback(gameId: number) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${gameId}/header.jpg`;
}

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") ?? "";
  const pageFromUrl = parsePage(searchParams.get("page"));
  const [inputValue, setInputValue] = useState(queryFromUrl);
  const [result, setResult] = useState<PagedResult<AchievementSearchResult> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const trimmedQuery = queryFromUrl.trim();
    if (!trimmedQuery) {
      setResult(null);
      setError(null);
      return;
    }

    if (trimmedQuery.length < MIN_QUERY_LENGTH || trimmedQuery.length > MAX_QUERY_LENGTH) {
      setResult(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    searchService
      .searchAchievements({
        query: trimmedQuery,
        pageNumber: pageFromUrl,
      })
      .then((response) => setResult(response))
      .catch(() => setError("Failed to load search results."))
      .finally(() => setIsLoading(false));
  }, [queryFromUrl, pageFromUrl]);

  const totalPages = useMemo(() => {
    if (!result || result.pageSize <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(result.totalCount / result.pageSize));
  }, [result]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      setValidationError("Enter a search term.");
      return;
    }

    if (trimmedValue.length < MIN_QUERY_LENGTH) {
      setValidationError(`Search term must be at least ${MIN_QUERY_LENGTH} characters.`);
      return;
    }

    if (trimmedValue.length > MAX_QUERY_LENGTH) {
      setValidationError(`Search term must be at most ${MAX_QUERY_LENGTH} characters.`);
      return;
    }

    setValidationError(null);
    setSearchParams({ q: trimmedValue, page: String(FIRST_PAGE_NUMBER) });
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < FIRST_PAGE_NUMBER) {
      return;
    }

    setSearchParams({ q: queryFromUrl.trim(), page: String(nextPage) });
  };

  return (
    <div className="w-full flex justify-center min-h-0">
      <div className="w-full max-w-[900px] space-y-4">
        <div className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border">
          <h1 className="app-heading">Achievement Search</h1>
          <p className="text-sm text-app-muted mt-1">
            Search achievements by name and jump directly to the game they belong to.
          </p>
          <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
            <Input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Search achievements..."
              aria-label="Search achievements by name"
            />
            <Button type="submit" className="inline-flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
          {validationError ? <p className="text-sm text-red-400 mt-2">{validationError}</p> : null}
        </div>

        {!queryFromUrl.trim() ? (
          <div className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border text-sm text-app-muted">
            Enter a search term and submit to see results.
          </div>
        ) : null}

        {isLoading ? (
          <div className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border text-sm text-app-muted">
            Loading results...
          </div>
        ) : null}

        {error ? (
          <div className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border text-sm text-red-400">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && result && result.items.length === 0 ? (
          <div className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border text-sm text-app-muted">
            No achievements found for "{queryFromUrl}".
          </div>
        ) : null}

        {!isLoading && !error && result && result.items.length > 0 ? (
          <div className="space-y-3">
            <div className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border text-sm text-app-muted">
              Showing {result.items.length} of {result.totalCount} results.
            </div>

            {result.items.map((item) => (
              <div
                key={item.achievementId}
                className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={item.achievementIconUrl ?? undefined}
                    alt={item.achievementName}
                    className="h-14 w-14 rounded-md border border-app-border object-cover bg-app-panel2"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="app-heading text-sm">{item.achievementName}</h2>
                    <p className="text-xs text-app-muted mt-1">
                      {item.achievementDescription ?? "No description available."}
                    </p>
                    <p className="text-xs text-app-muted mt-2">
                      {item.achievementPoints} pts
                      {item.globalPercentage != null
                        ? ` • ${item.globalPercentage.toFixed(1)}% global unlock`
                        : " • Global unlock rate unavailable"}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/games/${item.gameId}`}
                  className="block rounded-md border border-app-border bg-app-bg p-3 hover:border-brand transition-colors"
                >
                  <img
                    src={item.gameHeaderImageUrl ?? buildGameHeaderFallback(item.gameId)}
                    alt={`${item.gameName} header`}
                    className="w-full h-28 rounded-md object-cover"
                  />
                  <p className="app-heading text-sm mt-2">{item.gameName}</p>
                </Link>
              </div>
            ))}

            <div className="bg-app-panel rounded-lg p-4 shadow-md shadow-app-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePageChange(pageFromUrl - 1)}
                disabled={pageFromUrl <= FIRST_PAGE_NUMBER}
              >
                Previous
              </Button>
              <span className="text-sm text-app-muted">
                Page {pageFromUrl} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePageChange(pageFromUrl + 1)}
                disabled={pageFromUrl >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
