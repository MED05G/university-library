"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Search, Download, BookOpen, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  isbn13?: string;
  isbn10?: string;
  publisherId: string;
  publicationYear: number;
  edition?: string;
  pages?: number;
  language: string;
  description?: string;
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  coverUrl?: string;
  coverColor: string;
  createdAt: string;
  publisher?: {
    name: string;
  };
  authors?: Array<{
    fullName: string;
  }>;
  subjects?: Array<{
    name: string;
  }>;
}

interface Publisher {
  id: string;
  name: string;
}

interface Author {
  id: string;
  fullName: string;
}

interface Subject {
  id: string;
  name: string;
}

const BooksPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [newBook, setNewBook] = useState({
    title: "",
    subtitle: "",
    isbn13: "",
    isbn10: "",
    publisherId: "",
    publicationYear: new Date().getFullYear(),
    edition: "",
    pages: 0,
    language: "English",
    description: "",
    shelfLocation: "",
    totalCopies: 1,
    coverColor: "#3B82F6",
    authorIds: [] as string[],
    subjectIds: [] as string[]
  });

  // Fetch books from API
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/books");
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les livres",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching books:", error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch publishers
  const fetchPublishers = async () => {
    try {
      const response = await fetch("/api/admin/publishers");
      if (response.ok) {
        const data = await response.json();
        setPublishers(data);
      }
    } catch (error) {
      console.error("Error fetching publishers:", error);
    }
  };

  // Fetch authors
  const fetchAuthors = async () => {
    try {
      const response = await fetch("/api/admin/authors");
      if (response.ok) {
        const data = await response.json();
        setAuthors(data);
      }
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/admin/subjects");
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  // Add new book
  const handleAddBook = async () => {
    try {
      const response = await fetch("/api/admin/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBook),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Livre ajouté avec succès"
        });
        setIsAddDialogOpen(false);
        setNewBook({
          title: "",
          subtitle: "",
          isbn13: "",
          isbn10: "",
          publisherId: "",
          publicationYear: new Date().getFullYear(),
          edition: "",
          pages: 0,
          language: "English",
          description: "",
          shelfLocation: "",
          totalCopies: 1,
          coverColor: "#3B82F6",
          authorIds: [],
          subjectIds: []
        });
        fetchBooks();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.message || "Impossible d'ajouter le livre",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error adding book:", error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  // Update book
  const handleUpdateBook = async () => {
    if (!selectedBook) return;

    try {
      const response = await fetch(`/api/admin/books/${selectedBook.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedBook),
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Livre mis à jour avec succès"
        });
        setIsEditDialogOpen(false);
        setSelectedBook(null);
        fetchBooks();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.message || "Impossible de mettre à jour le livre",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating book:", error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  // Delete book
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce livre ?")) return;

    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Livre supprimé avec succès"
        });
        fetchBooks();
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.message || "Impossible de supprimer le livre",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  // Export books to CSV
  const handleExportBooks = () => {
    const csvContent = [
      ["Titre", "Auteurs", "ISBN-13", "Éditeur", "Année", "Langue", "Copies totales", "Copies disponibles", "Emplacement"],
      ...filteredBooks.map(book => [
        book.title,
        book.authors?.map(a => a.fullName).join("; ") || "",
        book.isbn13 || "",
        book.publisher?.name || "",
        book.publicationYear.toString(),
        book.language,
        book.totalCopies.toString(),
        book.availableCopies.toString(),
        book.shelfLocation
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "books.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchBooks();
    fetchPublishers();
    fetchAuthors();
    fetchSubjects();
  }, []);

  // Filter books based on search and filters
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.authors?.some(author => author.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (book.isbn13 && book.isbn13.includes(searchTerm)) ||
                         (book.isbn10 && book.isbn10.includes(searchTerm));
    const matchesLanguage = languageFilter === "all" || book.language === languageFilter;
    const matchesAvailability = availabilityFilter === "all" || 
                               (availabilityFilter === "available" && book.availableCopies > 0) ||
                               (availabilityFilter === "unavailable" && book.availableCopies === 0);
    
    return matchesSearch && matchesLanguage && matchesAvailability;
  });

  const getAvailabilityBadgeColor = (availableCopies: number, totalCopies: number) => {
    if (availableCopies === 0) return "bg-red-100 text-red-800";
    if (availableCopies < totalCopies * 0.3) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  if (loading) {
    return (
      <div className="admin-content">
        <div className="admin-header">
          <h1>Tous les livres</h1>
          <p>Chargement des livres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content p-6">
      <div className="admin-header mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tous les livres</h1>
            <p className="text-gray-600">Gérer tous les livres de la bibliothèque</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportBooks} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un livre
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau livre</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Titre *</Label>
                      <Input
                        id="title"
                        value={newBook.title}
                        onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtitle">Sous-titre</Label>
                      <Input
                        id="subtitle"
                        value={newBook.subtitle}
                        onChange={(e) => setNewBook({...newBook, subtitle: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="isbn13">ISBN-13</Label>
                      <Input
                        id="isbn13"
                        value={newBook.isbn13}
                        onChange={(e) => setNewBook({...newBook, isbn13: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="isbn10">ISBN-10</Label>
                      <Input
                        id="isbn10"
                        value={newBook.isbn10}
                        onChange={(e) => setNewBook({...newBook, isbn10: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="publisher">Éditeur *</Label>
                      <Select value={newBook.publisherId} onValueChange={(value) => setNewBook({...newBook, publisherId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un éditeur" />
                        </SelectTrigger>
                        <SelectContent>
                          {publishers.map(publisher => (
                            <SelectItem key={publisher.id} value={publisher.id}>
                              {publisher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="publicationYear">Année de publication *</Label>
                      <Input
                        id="publicationYear"
                        type="number"
                        value={newBook.publicationYear}
                        onChange={(e) => setNewBook({...newBook, publicationYear: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edition">Édition</Label>
                      <Input
                        id="edition"
                        value={newBook.edition}
                        onChange={(e) => setNewBook({...newBook, edition: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pages">Pages</Label>
                      <Input
                        id="pages"
                        type="number"
                        value={newBook.pages}
                        onChange={(e) => setNewBook({...newBook, pages: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="language">Langue</Label>
                      <Select value={newBook.language} onValueChange={(value) => setNewBook({...newBook, language: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">Anglais</SelectItem>
                          <SelectItem value="French">Français</SelectItem>
                          <SelectItem value="Spanish">Espagnol</SelectItem>
                          <SelectItem value="German">Allemand</SelectItem>
                          <SelectItem value="Arabic">Arabe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shelfLocation">Emplacement *</Label>
                      <Input
                        id="shelfLocation"
                        value={newBook.shelfLocation}
                        onChange={(e) => setNewBook({...newBook, shelfLocation: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalCopies">Nombre de copies</Label>
                      <Input
                        id="totalCopies"
                        type="number"
                        value={newBook.totalCopies}
                        onChange={(e) => setNewBook({...newBook, totalCopies: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newBook.description}
                      onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="coverColor">Couleur de couverture</Label>
                    <Input
                      id="coverColor"
                      type="color"
                      value={newBook.coverColor}
                      onChange={(e) => setNewBook({...newBook, coverColor: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="authors">Auteurs</Label>
                    <Select
                      value={newBook.authorIds[0] || ""}
                      onValueChange={(value) => setNewBook({...newBook, authorIds: [value]})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un auteur" />
                      </SelectTrigger>
                      <SelectContent>
                        {authors.map(author => (
                          <SelectItem key={author.id} value={author.id}>
                            {author.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subjects">Sujets</Label>
                    <Select
                      value={newBook.subjectIds[0] || ""}
                      onValueChange={(value) => setNewBook({...newBook, subjectIds: [value]})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un sujet" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddBook} className="w-full">
                    Ajouter le livre
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par titre, auteur, ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Langue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les langues</SelectItem>
                <SelectItem value="English">Anglais</SelectItem>
                <SelectItem value="French">Français</SelectItem>
                <SelectItem value="Spanish">Espagnol</SelectItem>
                <SelectItem value="German">Allemand</SelectItem>
                <SelectItem value="Arabic">Arabe</SelectItem>
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Disponibilité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les disponibilités</SelectItem>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="unavailable">Non disponible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des livres ({filteredBooks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Titre</th>
                  <th className="text-left p-2">Auteurs</th>
                  <th className="text-left p-2">Éditeur</th>
                  <th className="text-left p-2">Année</th>
                  <th className="text-left p-2">Langue</th>
                  <th className="text-left p-2">Copies</th>
                  <th className="text-left p-2">Emplacement</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="font-medium">{book.title}</div>
                      {book.subtitle && <div className="text-sm text-gray-500">{book.subtitle}</div>}
                    </td>
                    <td className="p-2">{book.authors?.map(a => a.fullName).join(", ") || "-"}</td>
                    <td className="p-2">{book.publisher?.name || "-"}</td>
                    <td className="p-2">{book.publicationYear}</td>
                    <td className="p-2">{book.language}</td>
                    <td className="p-2">
                      <Badge className={getAvailabilityBadgeColor(book.availableCopies, book.totalCopies)}>
                        {book.availableCopies} / {book.totalCopies}
                      </Badge>
                    </td>
                    <td className="p-2">{book.shelfLocation}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBook(book);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBook(book);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBook(book.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Book Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le livre</DialogTitle>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editTitle">Titre *</Label>
                  <Input
                    id="editTitle"
                    value={selectedBook.title}
                    onChange={(e) => setSelectedBook({...selectedBook, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editSubtitle">Sous-titre</Label>
                  <Input
                    id="editSubtitle"
                    value={selectedBook.subtitle || ""}
                    onChange={(e) => setSelectedBook({...selectedBook, subtitle: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editIsbn13">ISBN-13</Label>
                  <Input
                    id="editIsbn13"
                    value={selectedBook.isbn13 || ""}
                    onChange={(e) => setSelectedBook({...selectedBook, isbn13: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editIsbn10">ISBN-10</Label>
                  <Input
                    id="editIsbn10"
                    value={selectedBook.isbn10 || ""}
                    onChange={(e) => setSelectedBook({...selectedBook, isbn10: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editPublisher">Éditeur *</Label>
                  <Select value={selectedBook.publisherId} onValueChange={(value) => setSelectedBook({...selectedBook, publisherId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un éditeur" />
                    </SelectTrigger>
                    <SelectContent>
                      {publishers.map(publisher => (
                        <SelectItem key={publisher.id} value={publisher.id}>
                          {publisher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editPublicationYear">Année de publication *</Label>
                  <Input
                    id="editPublicationYear"
                    type="number"
                    value={selectedBook.publicationYear}
                    onChange={(e) => setSelectedBook({...selectedBook, publicationYear: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="editEdition">Édition</Label>
                  <Input
                    id="editEdition"
                    value={selectedBook.edition || ""}
                    onChange={(e) => setSelectedBook({...selectedBook, edition: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editPages">Pages</Label>
                  <Input
                    id="editPages"
                    type="number"
                    value={selectedBook.pages || 0}
                    onChange={(e) => setSelectedBook({...selectedBook, pages: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="editLanguage">Langue</Label>
                  <Select value={selectedBook.language} onValueChange={(value) => setSelectedBook({...selectedBook, language: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">Anglais</SelectItem>
                      <SelectItem value="French">Français</SelectItem>
                      <SelectItem value="Spanish">Espagnol</SelectItem>
                      <SelectItem value="German">Allemand</SelectItem>
                      <SelectItem value="Arabic">Arabe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editShelfLocation">Emplacement *</Label>
                  <Input
                    id="editShelfLocation"
                    value={selectedBook.shelfLocation}
                    onChange={(e) => setSelectedBook({...selectedBook, shelfLocation: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editTotalCopies">Nombre de copies</Label>
                  <Input
                    id="editTotalCopies"
                    type="number"
                    value={selectedBook.totalCopies}
                    onChange={(e) => setSelectedBook({...selectedBook, totalCopies: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={selectedBook.description || ""}
                  onChange={(e) => setSelectedBook({...selectedBook, description: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editCoverColor">Couleur de couverture</Label>
                <Input
                  id="editCoverColor"
                  type="color"
                  value={selectedBook.coverColor}
                  onChange={(e) => setSelectedBook({...selectedBook, coverColor: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editAuthors">Auteurs</Label>
                <Select
                  value={selectedBook.authors?.[0]?.id || ""}
                  onValueChange={(value) => setSelectedBook({...selectedBook, authors: [{ id: value, fullName: authors.find(a => a.id === value)?.fullName || "" }]})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un auteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map(author => (
                      <SelectItem key={author.id} value={author.id}>
                        {author.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editSubjects">Sujets</Label>
                <Select
                  value={selectedBook.subjects?.[0]?.id || ""}
                  onValueChange={(value) => setSelectedBook({...selectedBook, subjects: [{ id: value, name: subjects.find(s => s.id === value)?.name || "" }]})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un sujet" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateBook} className="w-full">
                Mettre à jour le livre
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Book Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du livre</DialogTitle>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-32 rounded-lg flex-shrink-0" style={{ backgroundColor: selectedBook.coverColor }}>
                  {/* Book cover placeholder */}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedBook.title}</h2>
                  {selectedBook.subtitle && <p className="text-gray-600">{selectedBook.subtitle}</p>}
                  <p className="text-gray-700">par {selectedBook.authors?.map(a => a.fullName).join(", ") || "Inconnu"}</p>
                  <p className="text-gray-500">{selectedBook.publisher?.name || "Inconnu"}, {selectedBook.publicationYear}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">ISBN-13:</p>
                  <p>{selectedBook.isbn13 || "-"}</p>
                </div>
                <div>
                  <p className="font-medium">ISBN-10:</p>
                  <p>{selectedBook.isbn10 || "-"}</p>
                </div>
                <div>
                  <p className="font-medium">Langue:</p>
                  <p>{selectedBook.language}</p>
                </div>
                <div>
                  <p className="font-medium">Pages:</p>
                  <p>{selectedBook.pages || "-"}</p>
                </div>
                <div>
                  <p className="font-medium">Édition:</p>
                  <p>{selectedBook.edition || "-"}</p>
                </div>
                <div>
                  <p className="font-medium">Emplacement:</p>
                  <p>{selectedBook.shelfLocation}</p>
                </div>
                <div>
                  <p className="font-medium">Copies totales:</p>
                  <p>{selectedBook.totalCopies}</p>
                </div>
                <div>
                  <p className="font-medium">Copies disponibles:</p>
                  <p>{selectedBook.availableCopies}</p>
                </div>
              </div>
              <div>
                <p className="font-medium">Description:</p>
                <p>{selectedBook.description || "Aucune description disponible."}</p>
              </div>
              <div>
                <p className="font-medium">Sujets:</p>
                <p>{selectedBook.subjects?.map(s => s.name).join(", ") || "-"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BooksPage;
