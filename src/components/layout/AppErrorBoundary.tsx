import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App render error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4 p-6 max-w-md">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 text-destructive animate-spin" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-1">Coś poszło nie tak</h1>
              <p className="text-sm text-muted-foreground">
                Wystąpił błąd podczas wyświetlania aplikacji. Odśwież stronę, aby spróbować ponownie.
              </p>
            </div>
            <Button onClick={this.handleReload} className="w-full">
              Odśwież aplikację
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
