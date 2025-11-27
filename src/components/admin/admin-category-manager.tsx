
'use client';

import { useState, useMemo, FC } from 'react';
import type { Category } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2, AlertTriangle, ChevronsUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { addCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from '@/components/ui/scroll-area';
import { iconList, DynamicIcon } from '@/lib/icons';

interface IconPickerProps {
  value: string;
  onSelect: (icon: string) => void;
}

const IconPicker: FC<IconPickerProps> = ({ value, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filteredIcons = useMemo(() => iconList.filter(icon => icon.toLowerCase().includes(search.toLowerCase())), [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-[280px] justify-between"
        >
          {value ? (
            <div className="flex items-center gap-2">
              <DynamicIcon name={value} className="w-4 h-4" />
              <span>{value}</span>
            </div>
          ) : (
            "Select an icon..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Input
          placeholder="Search icons..."
          className="h-9 rounded-b-none border-x-0 border-t-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ScrollArea className="h-72">
          <div className="p-1">
            {filteredIcons.map((icon) => (
              <Button
                variant="ghost"
                key={icon}
                onClick={() => {
                  onSelect(icon);
                  setOpen(false);
                  setSearch('');
                }}
                className="w-full justify-start gap-2"
              >
                <DynamicIcon name={icon} className="w-4 h-4" />
                {icon}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};


export function AdminCategoryManager({ categories, loading, error }: { categories: Category[] | null, loading: boolean, error: Error | null }) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryIcon.trim()) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a name and select an icon.' });
      return;
    }
    setIsAdding(true);
    try {
      await addCategory({ name: newCategoryName, icon: newCategoryIcon });
      toast({ title: 'Success', description: 'New category added.' });
      setNewCategoryName('');
      setNewCategoryIcon('');
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error Adding Category', description: e.message || 'You do not have permission to perform this action.' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim() || !editingCategory.icon.trim()) {
       toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a name and an icon.' });
      return;
    }
     setIsProcessing(prev => ({...prev, [editingCategory.id as string]: true}));
    try {
      await updateCategory(editingCategory.id as string, { name: editingCategory.name, icon: editingCategory.icon });
      toast({ title: 'Success', description: 'Category updated.' });
      setEditingCategory(null);
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error Updating Category', description: e.message || 'You do not have permission to perform this action.' });
    } finally {
      if (editingCategory?.id) {
        setIsProcessing(prev => ({...prev, [editingCategory.id as string]: false}));
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setIsProcessing(prev => ({...prev, [categoryId]: true}));
    try {
      await deleteCategory(categoryId);
      toast({ title: 'Success', description: 'Category deleted.' });
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error Deleting Category', description: e.message || 'You do not have permission to perform this action.' });
    } finally {
       setIsProcessing(prev => ({...prev, [categoryId]: false}));
    }
  };

  if (error) {
    return (
       <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/> Error Loading Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">Could not load categories from Firestore.</p>
          <p className="text-xs text-muted-foreground mt-2">{error.message}</p>
           <p className="text-sm text-muted-foreground mt-4">
              This usually happens when client-side database reads are blocked by security rules.
              Please ensure your `firestore.rules` are configured to allow reads on the `categories` collection.
            </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>Create a new category for events on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input placeholder="New Category Name (e.g., Entertainment)" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1"/>
            <IconPicker
              value={newCategoryIcon}
              onSelect={setNewCategoryIcon}
            />
            <Button onClick={handleAddCategory} disabled={isAdding} className="w-full sm:w-auto">
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
               <span className="sm:hidden ml-2">Add Category</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
           <CardDescription>Manage the categories currently available on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : categories && categories.length > 0 ? (
                categories.map(cat => (
                editingCategory?.id === cat.id ? (
                  <TableRow key={cat.id} className="bg-muted/50">
                    <TableCell>
                      <IconPicker
                        value={editingCategory.icon}
                        onSelect={(icon) => setEditingCategory({...editingCategory, icon})}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingCategory(null); }} disabled={isProcessing[cat.id as string]}>Cancel</Button>
                      <Button size="sm" onClick={handleUpdateCategory} disabled={isProcessing[cat.id as string]}>
                         {isProcessing[cat.id as string] && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Save
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                <TableRow key={cat.id}>
                  <TableCell><DynamicIcon name={cat.icon}/></TableCell>
                  <TableCell>{cat.name}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setEditingCategory(cat); }} disabled={Object.values(isProcessing).some(Boolean)}>
                      <Edit className="w-4 h-4" />
                       <span className="sr-only">Edit</span>
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8" disabled={Object.values(isProcessing).some(Boolean)}>
                            {isProcessing[cat.id as string] ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                             <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-neutral-900 border-neutral-800">
                          <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription className="text-white/60">
                                  This will permanently delete the "{cat.name}" category. This action cannot be undone.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="border-t border-white/10 pt-4">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(cat.id as string)}>Yes, Delete</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
                )
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No categories found. Add one to get started.
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
