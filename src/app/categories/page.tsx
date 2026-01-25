'use client';

import { useState } from 'react';
import {
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useCategories } from '@/hooks/useDatabase';
import { Category } from '@/types';

const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f97316', // orange
  '#eab308', // yellow
  '#ef4444', // red
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#a855f7', // purple
  '#6b7280', // gray
  '#22c55e', // green
  '#06b6d4', // cyan
];

export default function CategoriesPage() {
  const { categories, isLoading, update, add } = useCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: CATEGORY_COLORS[0],
  });

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    try {
      await update(id, { name: editName.trim() });
      toast.success('Category updated');
      setEditingId(null);
    } catch {
      toast.error('Failed to update category');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleToggleVisibility = async (category: Category) => {
    try {
      await update(category.id, { isHidden: !category.isHidden });
      toast.success(
        category.isHidden ? 'Category shown' : 'Category hidden'
      );
    } catch {
      toast.error('Failed to update category');
    }
  };

  const handleColorChange = async (id: string, color: string) => {
    try {
      await update(id, { color });
    } catch {
      toast.error('Failed to update color');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    try {
      await add({
        name: newCategory.name.trim(),
        color: newCategory.color,
        isDefault: false,
        isHidden: false,
        order: categories.length,
      });
      toast.success('Category added');
      setIsAddDialogOpen(false);
      setNewCategory({ name: '', color: CATEGORY_COLORS[0] });
    } catch {
      toast.error('Failed to add category');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const visibleCategories = categories.filter((c) => !c.isHidden);
  const hiddenCategories = categories.filter((c) => c.isHidden);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Manage your expense categories
        </p>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Active Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Active Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {visibleCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />

                {/* Color Picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={category.color || '#6b7280'}
                    onChange={(e) =>
                      handleColorChange(category.id, e.target.value)
                    }
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div
                    className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: category.color || '#6b7280' }}
                  />
                </div>

                {/* Name */}
                <div className="flex-1">
                  {editingId === category.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(category.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleSaveEdit(category.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="font-medium">{category.name}</span>
                  )}
                </div>

                {/* Badges */}
                {category.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}

                {/* Actions */}
                {editingId !== category.id && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleStartEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleToggleVisibility(category)}
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hidden Categories */}
      {hiddenCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Hidden Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hiddenCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div
                    className="h-6 w-6 rounded-full opacity-50"
                    style={{ backgroundColor: category.color || '#6b7280' }}
                  />
                  <span className="flex-1 text-muted-foreground">
                    {category.name}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleToggleVisibility(category)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      newCategory.color === color
                        ? 'border-primary scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setNewCategory((prev) => ({ ...prev, color }))
                    }
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>Add Category</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
