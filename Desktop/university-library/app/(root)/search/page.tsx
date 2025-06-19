import React from "react";
import { searchBooks, getFilterOptions } from "@/lib/actions/search";
import BookSearchInterface from "@/components/BookSearchInterface";

interface SearchPageProps {
  searchParams: {
    query?: string;
    genre?: string;
    author?: string;
    availability?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
  };
}

const SearchPage = async ({ searchParams }: SearchPageProps) => {
  const filters = {
    query: searchParams.query || "",
    genre: searchParams.genre || "",
    author: searchParams.author || "",
    availability: (searchParams.availability as "all" | "available" | "unavailable") || "all",
    sortBy: (searchParams.sortBy as "title" | "author" | "rating" | "publishedYear" | "availableCopies") || "title",
    sortOrder: (searchParams.sortOrder as "asc" | "desc") || "asc",
    page: parseInt(searchParams.page || "1"),
    limit: 12,
  };

  const [searchResult, filterOptionsResult] = await Promise.all([
    searchBooks(filters),
    getFilterOptions(),
  ]);

  const searchData = searchResult.success ? searchResult.data : null;
  const filterOptions = filterOptionsResult.success ? filterOptionsResult.data : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Search Books</h1>
        <p className="text-gray-600 mt-2">Find your next great read from our collection</p>
      </div>

      <BookSearchInterface 
        initialSearchData={searchData}
        filterOptions={filterOptions}
        initialFilters={filters}
      />
    </div>
  );
};

export default SearchPage;
