"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancelReservation } from "@/lib/actions/reservation";
import { toast } from "@/hooks/use-toast";
import { 
  Clock, 
  XCircle,
  Calendar,
  Users,
  BookOpen
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string | null;
  reservationDate: string;
  expiryDate: string;
  queuePosition: number;
  status: string;
  notificationSent: boolean;
  createdAt: string;
}

interface UserReservationsProps {
  reservations: Reservation[];
}

const UserReservations = ({ reservations: initialReservations }: UserReservationsProps) => {
  const { data: session } = useSession();
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const activeReservations = reservations.filter(r => r.status === "active");
  const expiredReservations = reservations.filter(r => r.status === "expired");
  const cancelledReservations = reservations.filter(r => r.status === "cancelled");

  const handleCancelReservation = async () => {
    if (!selectedReservation || !session?.user?.id) return;

    const result = await cancelReservation({
      reservationId: selectedReservation.id,
      userId: session.user.id,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Reservation cancelled successfully",
      });
      
      // Update the reservation in the local state
      setReservations(reservations.map(reservation => 
        reservation.id === selectedReservation.id 
          ? { ...reservation, status: "cancelled" }
          : reservation
      ));
      
      setIsCancelDialogOpen(false);
      setSelectedReservation(null);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (reservation: Reservation) => {
    switch (reservation.status) {
      case "active":
        if (reservation.notificationSent) {
          return <Badge variant="default">Ready to Borrow</Badge>;
        }
        return <Badge variant="secondary">In Queue</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{reservation.status}</Badge>;
    }
  };

  const isExpiringSoon = (reservation: Reservation) => {
    if (!reservation.notificationSent) return false;
    const expiryDate = new Date(reservation.expiryDate);
    const now = new Date();
    const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;
  };

  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No reservations</h3>
          <p className="text-gray-600 text-center">
            You don't have any book reservations. Reserve unavailable books to be notified when they become available!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Reservations */}
      {activeReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>Active Reservations ({activeReservations.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeReservations.map((reservation) => (
                <Card key={reservation.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{reservation.bookTitle}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{reservation.bookAuthor}</p>
                      </div>
                      {reservation.bookCover && (
                        <div className="ml-3 flex-shrink-0">
                          <Image
                            src={reservation.bookCover}
                            alt={reservation.bookTitle}
                            width={60}
                            height={80}
                            className="rounded object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      {getStatusBadge(reservation)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Queue Position:</span>
                      <span className="text-sm font-medium">#{reservation.queuePosition}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Reserved:</span>
                      <span className="text-sm">{new Date(reservation.reservationDate).toLocaleDateString()}</span>
                    </div>
                    
                    {reservation.notificationSent && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <p className="text-green-800 text-xs">
                          📚 Book is ready! You have until {new Date(reservation.expiryDate).toLocaleDateString()} to borrow it.
                        </p>
                        {isExpiringSoon(reservation) && (
                          <p className="text-red-600 text-xs mt-1 font-semibold">
                            ⚠️ Expires soon!
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setIsCancelDialogOpen(true);
                        }}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {activeReservations.length}
                </div>
                <div className="text-sm text-gray-600">Active Reservations</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {expiredReservations.length}
                </div>
                <div className="text-sm text-gray-600">Expired</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-gray-500" />
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {cancelledReservations.length}
                </div>
                <div className="text-sm text-gray-600">Cancelled</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Reservation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="py-4">
              <p><strong>Book:</strong> {selectedReservation.bookTitle}</p>
              <p><strong>Author:</strong> {selectedReservation.bookAuthor}</p>
              <p><strong>Queue Position:</strong> #{selectedReservation.queuePosition}</p>
              <p><strong>Reserved Date:</strong> {new Date(selectedReservation.reservationDate).toLocaleDateString()}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Keep Reservation
            </Button>
            <Button variant="destructive" onClick={handleCancelReservation}>
              Cancel Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserReservations;

