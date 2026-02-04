import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  // Still loading auth or role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // User is logged in but has no role assigned
  if (!role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Brak dostępu</h1>
            <p className="text-muted-foreground">
              Twoje konto nie ma przypisanej roli. Skontaktuj się z administratorem systemu, 
              aby otrzymać uprawnienia (szef lub pracownik).
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Zalogowano jako: {user.email}
            </p>
            <Button 
              variant="outline" 
              onClick={() => signOut()}
              className="w-full"
            >
              Wyloguj się
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
