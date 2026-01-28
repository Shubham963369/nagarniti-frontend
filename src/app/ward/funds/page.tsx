"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { wardApi } from "@/lib/api";
import { formatCurrency, formatDate, getFundSourceColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, IndianRupee, TrendingUp, TrendingDown } from "lucide-react";
import { SingleDocumentUpload, DocumentList } from "@/components/ui/document-upload";
import { ExportButtons } from "@/components/reports/export-buttons";
import { generateFundsPDF, generateFundsExcel } from "@/lib/reports";
import { useAuthStore } from "@/stores/auth-store";

const FUND_SOURCES = ["Ward Fund", "MLA Fund", "MP Fund", "CSR", "State Grant", "Central Grant", "Other"];

export default function FundsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<any>(null);
  const [formData, setFormData] = useState({
    source: "",
    amount: "",
    financialYear: "",
    description: "",
    receivedDate: "",
    documentUrl: null as string | null,
  });

  const { data: funds, isLoading } = useQuery({
    queryKey: ["ward-funds"],
    queryFn: async () => {
      const res = await wardApi.getFunds();
      return res.success ? (res as any).data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => wardApi.createFund(data),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Fund created successfully" });
        queryClient.invalidateQueries({ queryKey: ["ward-funds"] });
        queryClient.invalidateQueries({ queryKey: ["ward-stats"] });
        closeDialog();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => wardApi.updateFund(id, data),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Fund updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["ward-funds"] });
        queryClient.invalidateQueries({ queryKey: ["ward-stats"] });
        closeDialog();
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => wardApi.deleteFund(id),
    onSuccess: (res) => {
      if (res.success) {
        toast({ title: "Success", description: "Fund deleted successfully" });
        queryClient.invalidateQueries({ queryKey: ["ward-funds"] });
        queryClient.invalidateQueries({ queryKey: ["ward-stats"] });
      } else {
        toast({ title: "Error", description: res.error, variant: "destructive" });
      }
    },
  });

  const openCreateDialog = () => {
    setEditingFund(null);
    const currentYear = new Date().getFullYear();
    setFormData({
      source: "",
      amount: "",
      financialYear: `${currentYear}-${currentYear + 1}`,
      description: "",
      receivedDate: new Date().toISOString().split("T")[0],
      documentUrl: null,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (fund: any) => {
    setEditingFund(fund);
    setFormData({
      source: fund.source,
      amount: fund.amount?.toString() || "",
      financialYear: fund.financialYear || "",
      description: fund.description || "",
      receivedDate: fund.receivedDate?.split("T")[0] || "",
      documentUrl: fund.documentUrl || null,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingFund(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    if (editingFund) {
      updateMutation.mutate({ id: editingFund.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  // Calculate summary stats
  const totalFunds = funds?.reduce((sum: number, f: any) => sum + parseFloat(f.amount || 0), 0) || 0;
  const usedFunds = funds?.reduce((sum: number, f: any) => sum + parseFloat(f.usedAmount || 0), 0) || 0;
  const availableFunds = totalFunds - usedFunds;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Funds Management</h1>
          <p className="text-muted-foreground">Manage ward funds and allocations</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            onExportPDF={() => generateFundsPDF(funds || [], user?.ward?.name || "Ward")}
            onExportExcel={() => generateFundsExcel(funds || [], user?.ward?.name || "Ward")}
            disabled={!funds?.length}
          />
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Fund
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFunds)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Funds</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(usedFunds)}</div>
            <p className="text-xs text-muted-foreground">
              {totalFunds > 0 ? Math.round((usedFunds / totalFunds) * 100) : 0}% utilized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Funds</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(availableFunds)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Financial Year</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Allocated Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : funds?.length > 0 ? (
                funds.map((fund: any) => {
                  const amount = parseFloat(fund.amount || 0);
                  const used = parseFloat(fund.usedAmount || 0);
                  const available = amount - used;
                  return (
                    <TableRow key={fund.id}>
                      <TableCell>
                        <Badge className={getFundSourceColor(fund.source)}>{fund.source}</Badge>
                      </TableCell>
                      <TableCell>{fund.financialYear}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(amount)}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(used)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(available)}</TableCell>
                      <TableCell>{formatDate(fund.receivedDate)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(fund)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this fund?")) {
                              deleteMutation.mutate(fund.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No funds added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFund ? "Edit Fund" : "Add New Fund"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Source and Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Fund Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUND_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (INR)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {/* Row 2: Financial Year and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="financialYear">Financial Year</Label>
                <Input
                  id="financialYear"
                  value={formData.financialYear}
                  onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                  placeholder="e.g., 2024-2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedDate">Allocated Date</Label>
                <Input
                  id="receivedDate"
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Row 3: Description and Document side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about this fund..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Sanction Order (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload the official sanction order document (PDF)
                </p>
                <SingleDocumentUpload
                  value={formData.documentUrl}
                  onChange={(url) => setFormData({ ...formData, documentUrl: url })}
                  folder="documents"
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingFund ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
