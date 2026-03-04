import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  clientName: string;
  clientNip: string;
  issueDate: string;
  dueDate: string | null;
  amount: number;
  paymentStatus: string;
}

interface InvoiceListSectionProps {
  invoices: InvoiceListItem[];
}

const invoiceTypeLabels: Record<string, string> = {
  advance: "Zaliczkowa",
  final: "Końcowa",
  full: "Całościowa",
};

const invoiceTypeColors: Record<string, string> = {
  advance: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  final: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  full: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const InvoiceListSection = ({ invoices }: InvoiceListSectionProps) => {
  const paidCount = invoices.filter(i => i.paymentStatus === 'paid').length;
  const pendingCount = invoices.filter(i => i.paymentStatus === 'pending').length;
  const overdueCount = invoices.filter(i => i.paymentStatus === 'overdue').length;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Wszystkie faktury</span>
            </div>
            <p className="text-2xl font-bold">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Opłacone</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{paidCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-muted-foreground">Oczekujące</span>
            </div>
            <p className="text-2xl font-bold text-orange-400">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-muted-foreground">Zaległe</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice table */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Lista faktur
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Brak faktur w wybranym miesiącu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nr faktury</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Data wystawienia</TableHead>
                    <TableHead>Termin płatności</TableHead>
                    <TableHead className="text-right">Kwota</TableHead>
                    <TableHead>Status płatności</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <Badge className={invoiceTypeColors[invoice.invoiceType] || invoiceTypeColors.full}>
                          {invoiceTypeLabels[invoice.invoiceType] || "Całościowa"}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">{invoice.clientNip || '—'}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.issueDate), "dd.MM.yyyy")}
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate
                          ? format(new Date(invoice.dueDate), "dd.MM.yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        {invoice.paymentStatus === 'paid' && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            Opłacona
                          </Badge>
                        )}
                        {invoice.paymentStatus === 'pending' && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            Oczekuje
                          </Badge>
                        )}
                        {invoice.paymentStatus === 'overdue' && (
                          <Badge variant="destructive">
                            Zaległa
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
