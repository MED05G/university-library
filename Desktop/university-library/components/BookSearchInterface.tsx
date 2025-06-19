"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Star,
  Calendar
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SearchFilters } from "@/lib/actions/search";

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  isbn: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  description: string;
  coverUrl: string | null;
  coverColor: string;
  rating: number;
  shelfLocation: string;
  createdAt: string;
}

interface SearchData {
  books: Book[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: SearchFilters;
}

interface FilterOptions {
  genres: string[];
  authors: string[];
  availabilityStats: {
    totalBooks: number;
    availableBooks: number;
  };
}

interface BookSearchInterfaceProps {
  initialSearchData: SearchData | null;
  filterOptions: FilterOptions | null;
  initialFilters: SearchFilters;
}

const BookSearchInterface = ({ 
  initialSearchData, 
  filterOptions, 
  initialFilters 
}: BookSearchInterfaceProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(initialFilters.query || "");
  const [selectedGenre, setSelectedGenre] = useState(initialFilters.genre || "");
  const [selectedAuthor, setSelectedAuthor] = useState(initialFilters.author || "");
  const [selectedAvailability, setSelectedAvailability] = useState(initialFilters.availability || "all");
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || "title");
  const [sortOrder, setSortOrder] = useState(initialFilters.sortOrder || "asc");

  const updateURL = (newFilters: Partial<SearchFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "" && value !== "all") {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    if (Object.keys(newFilters).some(key => key !== 'page')) {
      params.delete('page');
    }

    router.push(`/search?${params.toString()}`);
  };

  const handleSearch = () => {
    updateURL({
      query: searchQuery,
      genre: selectedGenre,
      author: selectedAuthor,
      availability: selectedAvailability,
      sortBy,
      sortOrder,
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedGenre("");
    setSelectedAuthor("");
    setSelectedAvailability("all");
    setSortBy("title");
    setSortOrder("asc");
    router.push("/search");
  };

  const handlePageChange = (page: number) => {
    updateURL({ page });
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    updateURL({ sortOrder: newOrder });
  };

  const getAvailabilityBadge = (book: Book) => {
    if (book.availableCopies > 0) {
      return <Badge variant="default">Available ({book.availableCopies})</Badge>;
    } else {
      return <Badge variant="secondary">Unavailable</Badge>;
    }
  };

  if (!initialSearchData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load search results. Please try again.</p>
      </div>
    );
  }

  const { books, pagination } = initialSearchData;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by title, author, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Mobile Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Books</SheetTitle>
                <SheetDescription>
                  Narrow down your search results
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div>
                  <label className="text-sm font-medium">Genre</label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Genres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Genres</SelectItem>
                      {filterOptions?.genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Author</label>
                  <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Authors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Authors</SelectItem>
                      {filterOptions?.authors.map((author) => (
                        <SelectItem key={author} value={author}>
                          {author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Availability</label>
                  <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Books</SelectItem>
                      <SelectItem value="available">Available Only</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={handleSearch} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Filters */}
          <div className="hidden lg:flex gap-2">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Genres</SelectItem>
                {filterOptions?.genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Authors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Authors</SelectItem>
                {filterOptions?.authors.map((author) => (
                  <SelectItem key={author} value={author}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Books</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="author">Author</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="publishedYear">Year</SelectItem>
              <SelectItem value="availableCopies">Availability</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={toggleSortOrder}>
            {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {books.length} of {pagination.totalCount} books
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      {/* Books Grid */}
      {books.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/books/${book.id}`}>
                <div className="aspect-[3/4] relative bg-gray-100">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: book.coverColor }}
                    >
                      {book.title.charAt(0)}
                    </div>
                  )}
                </div>
              </Link>
              <CardContent className="p-4">
                <Link href={`/books/${book.id}`}>
                  <h3 className="font-semibold text-lg line-clamp-2 hover:text-blue-600 transition-colors">
                    {book.title}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm mt-1">{book.author}</p>
                <p className="text-gray-500 text-xs mt-1">{book.genre}</p>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm">{book.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{book.publishedYear}</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  {getAvailabilityBadge(book)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPreviousPage}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={page === pagination.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default BookSearchInterface;

