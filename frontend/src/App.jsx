import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AdminRoute } from './components/common/AdminRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BrowseItemsPage } from './pages/BrowseItemsPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { AddEditItemPage } from './pages/AddEditItemPage';
import { MyItemsPage } from './pages/MyItemsPage';
import { IncomingRequestsPage } from './pages/IncomingRequestsPage';
import { MyRentalsPage } from './pages/MyRentalsPage';
import { ChatAssistantPage } from './pages/ChatAssistantPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/items" element={<BrowseItemsPage />} />
                <Route path="/items/:id" element={<ItemDetailPage />} />
                <Route path="/chat" element={<ChatAssistantPage />} />

                {/* Authenticated Student Routes */}
                <Route
                  path="/items/new"
                  element={
                    <ProtectedRoute>
                      <AddEditItemPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/items/:id/edit"
                  element={
                    <ProtectedRoute>
                      <AddEditItemPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-items"
                  element={
                    <ProtectedRoute>
                      <MyItemsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/incoming-requests"
                  element={
                    <ProtectedRoute>
                      <IncomingRequestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-rentals"
                  element={
                    <ProtectedRoute>
                      <MyRentalsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Administrator Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />

                {/* Fallback 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
