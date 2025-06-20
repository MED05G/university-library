"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Clock, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  overdueBooks: number;
  pendingRequests: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    overdueBooks: 0,
    pendingRequests: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    subtitle?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'borrow': return '📚';
      case 'return': return '✅';
      case 'overdue': return '⚠️';
      case 'user_registered': return '👤';
      case 'book_added': return '📖';
      default: return '📋';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'borrow': return 'text-blue-600';
      case 'return': return 'text-green-600';
      case 'overdue': return 'text-red-600';
      case 'user_registered': return 'text-purple-600';
      case 'book_added': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
        <p className="text-gray-600">Vue d'ensemble de votre système de bibliothèque</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Utilisateurs totaux"
          value={stats.totalUsers}
          subtitle={`${stats.activeUsers} actifs`}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Livres totaux"
          value={stats.totalBooks}
          subtitle={`${stats.availableBooks} disponibles`}
          icon={BookOpen}
          color="bg-green-500"
        />
        <StatCard
          title="Livres empruntés"
          value={stats.borrowedBooks}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Livres en retard"
          value={stats.overdueBooks}
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="w-6 h-6" />
              <span>Gérer les utilisateurs</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <BookOpen className="w-6 h-6" />
              <span>Gérer les livres</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Clock className="w-6 h-6" />
              <span>Demandes d'emprunt</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity and Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                        {activity.description}
                      </p>
                      {activity.user && (
                        <p className="text-xs text-gray-500">Par: {activity.user}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>État du système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Demandes en attente</span>
                <Badge variant={stats.pendingRequests > 0 ? "destructive" : "secondary"}>
                  {stats.pendingRequests}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Livres en retard</span>
                <Badge variant={stats.overdueBooks > 0 ? "destructive" : "secondary"}>
                  {stats.overdueBooks}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Taux d'occupation</span>
                <Badge variant="outline">
                  {stats.totalBooks > 0 
                    ? Math.round((stats.borrowedBooks / stats.totalBooks) * 100)
                    : 0}%
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Utilisateurs actifs</span>
                <Badge variant="outline">
                  {stats.totalUsers > 0 
                    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
                    : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Management Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Outils de gestion de base de données</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <span className="font-medium">Sauvegarde DB</span>
              <span className="text-xs text-gray-500">Créer une sauvegarde</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <span className="font-medium">Optimiser DB</span>
              <span className="text-xs text-gray-500">Optimiser les performances</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <span className="font-medium">Nettoyer DB</span>
              <span className="text-xs text-gray-500">Supprimer les données obsolètes</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <span className="font-medium">Rapports</span>
              <span className="text-xs text-gray-500">Générer des rapports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

