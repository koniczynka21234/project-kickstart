import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import agencyLogo from '@/assets/agency-logo.png';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }
    
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Nieprawidłowy email lub hasło');
      } else {
        toast.error('Błąd logowania: ' + error.message);
      }
    } else {
      toast.success('Zalogowano pomyślnie');
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupEmail || !signupPassword || !signupName) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }
    
    if (signupPassword.length < 6) {
      toast.error('Hasło musi mieć minimum 6 znaków');
      return;
    }
    
    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setLoading(false);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        toast.error('Użytkownik o tym emailu już istnieje');
      } else {
        toast.error('Błąd rejestracji: ' + error.message);
      }
    } else {
      toast.success('Konto utworzone! Możesz się zalogować.');
      navigate('/');
    }
  };

  if (authLoading) {
    return (
      <div className="h-[100dvh] overflow-y-auto bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-y-auto bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 flex items-center justify-center overflow-hidden">
            <img src={agencyLogo} alt="Aurine" className="w-14 h-14 object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Aurine CRM</h1>
            <p className="text-muted-foreground mt-1">System zarządzania klientami</p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Witaj</CardTitle>
            <CardDescription>Zaloguj się lub utwórz konto</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Logowanie</TabsTrigger>
                <TabsTrigger value="signup">Rejestracja</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="twoj@email.pl"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="form-input-elegant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Hasło</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="form-input-elegant"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Zaloguj się
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Imię i nazwisko</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Jan Kowalski"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="form-input-elegant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="twoj@email.pl"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="form-input-elegant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Hasło</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Min. 6 znaków"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="form-input-elegant"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Utwórz konto
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 text-pink-400" />
          <span>Powered by Aurine</span>
        </div>
      </div>
    </div>
  );
}
