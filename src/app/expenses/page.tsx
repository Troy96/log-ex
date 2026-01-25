'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { ExpenseList } from '@/components/expenses/expense-list';
import { useExpenses } from '@/hooks/useDatabase';
import { Expense } from '@/types';

export default function ExpensesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { expenses, isLoading, add, update, remove } = useExpenses();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle ?action=add from dashboard
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsDialogOpen(true);
      // Clear the URL param
      router.replace('/expenses');
    }
  }, [searchParams, router]);

  const handleAdd = () => {
    setEditingExpense(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await remove(id);
        toast.success('Expense deleted');
      } catch {
        toast.error('Failed to delete expense');
      }
    }
  };

  const handleSubmit = async (
    data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await update(editingExpense.id, data);
        toast.success('Expense updated');
      } else {
        await add(data);
        toast.success('Expense added');
      }
      setIsDialogOpen(false);
      setEditingExpense(undefined);
    } catch {
      toast.error('Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingExpense(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Manage and track your expenses
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <ExpenseList
        expenses={expenses}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Expense' : 'Add Expense'}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm
            expense={editingExpense}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
