
'use client';

import { useState, useMemo, FC, useEffect, useCallback } from 'react';
import type { Category } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2, AlertTriangle, ChevronsUpDown, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { updateCategories, readCategories } from '@/app/admin/actions';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from '@/components/ui/scroll-area';
import { iconList, DynamicIcon } from '@/lib/icons';
import { useNotifications } from '@/lib/state/notifications';

interface IconPickerProps {
  value: string;
  onSelect: (icon: string) => void;
}

interface FullCategory {
    id: string;
    name: string;
    icon: string;
    image: string;
    aiHint: string;
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
          className="w-full sm:w-[200px] justify-between"
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
      <PopoverContent className="w-[200px] p-0">
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

const CategoryEditDialog = ({ category, isOpen, onOpenChange, onSave }: { category: FullCategory | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (updatedCategory: FullCategory) => void }) => {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('');
    const [image, setImage] = useState('');
    const [aiHint, setAiHint] = useState('');

    useEffect(() => {
        if(category) {
            setName(category.name);
            setIcon(category.icon);
            setImage(category.image);
            setAiHint(category.aiHint);
        }
    }, [category]);

    if (!category) return null;

    const handleSave = () => {
        onSave({ id: category.id, name, icon, image, aiHint });
        onOpenChange(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Category: {category.name}</DialogTitle>
                    <DialogDescription>Update the details for this category.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Category Name" />
                    <IconPicker value={icon} onSelect={setIcon} />
                    <Input value={image} onChange={e => setImage(e.target.value)} placeholder="Placeholder Image URL" />
                    <Input value={aiHint} onChange={e => setAiHint(e.target.value)} placeholder="AI Hint (for image search)" />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}><Save className="w-4 h-4 mr-2"/>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function AdminCategoryManager({ onCategoriesUpdate }: { onCategoriesUpdate: () => void }) {
  const { addNotification } = useNotifications();
  const [categories, setCategories] = useState<FullCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');

  const [editingCategory, setEditingCategory] = useState<FullCategory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await readCategories();
      setCategories(data.categories);
    } catch(err: any) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);


  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !selectedIcon) {
        addNotification({ title: "Missing Information", description: "Please provide a name and select an icon for the new category.", variant: "destructive", icon: "AlertTriangle", type: 'general' });
        return;
    }
    const newCategory: FullCategory = {
      id: String(Date.now()),
      name: newCategoryName,
      icon: selectedIcon,
      image: newImageUrl || `https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1920&auto=format&fit=crop`,
      aiHint: newCategoryName.toLowerCase(),
    };

    const updatedCategories = [...categories, newCategory];
    const result = await updateCategories(updatedCategories);
    if (result.success) {
      addNotification({ title: "Category Added", description: `Successfully added '${newCategoryName}'.`, icon: "CheckCircle", type: 'general' });
      setNewCategoryName('');
      setSelectedIcon('');
      setNewImageUrl('');
      await fetchCategories();
      onCategoriesUpdate();
    } else {
      addNotification({ title: "Error", description: result.error || 'An unknown error occurred', variant: "destructive", icon: "AlertTriangle", type: 'general' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const updatedCategories = categories.filter(cat => cat.id !== id);
    const result = await updateCategories(updatedCategories);

    if (result.success) {
      addNotification({ title: "Category Removed", description: `Successfully removed category.`, icon: "Trash2", type: 'general' });
      await fetchCategories();
      onCategoriesUpdate();
    } else {
       addNotification({ title: "Error", description: result.error || 'An unknown error occurred', variant: "destructive", icon: "AlertTriangle", type: 'general' });
    }
  };

  const handleEditCategory = (category: FullCategory) => {
    setEditingCategory(category);
    setIsEditDialogOpen(true);
  }

  const handleSaveCategory = async (updatedCategory: FullCategory) => {
      const updatedCategories = categories.map(c => c.id === updatedCategory.id ? updatedCategory : c);
      const result = await updateCategories(updatedCategories);
      if(result.success) {
        addNotification({ title: "Category Updated", description: `Successfully updated '${updatedCategory.name}'.`, icon: "CheckCircle", type: 'general' });
        await fetchCategories();
        onCategoriesUpdate();
      } else {
        addNotification({ title: "Error", description: result.error || 'An unknown error occurred', variant: "destructive", icon: "AlertTriangle", type: 'general' });
      }
  }


  if (error) {
    return (
       <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/> Error Loading Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">Could not load categories from the configuration file.</p>
          <p className="text-xs text-muted-foreground mt-2">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>Create a new category for events on the platform. This will update the system's configuration file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input 
              placeholder="New Category Name" 
              className="flex-1"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <IconPicker
              value={selectedIcon}
              onSelect={setSelectedIcon}
            />
          </div>
           <Input 
              placeholder="Default Image URL (Optional)" 
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
            />
           <Button onClick={handleAddCategory} className="w-full sm:w-auto">
               <Plus className="w-4 h-4 mr-2" />
               Add Category
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
           <CardDescription>
            Manage the list of available event categories for the platform.
           </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Image URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : categories && categories.length > 0 ? (
                    categories.map(cat => (
                        <TableRow key={cat.id}>
                            <TableCell><DynamicIcon name={cat.icon} /></TableCell>
                            <TableCell className="font-medium">{cat.name}</TableCell>
                            <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{cat.image}</TableCell>
                            <TableCell className="text-right">
                               <Button size="sm" variant="ghost" onClick={() => handleEditCategory(cat)}><Edit className="w-4 h-4 text-muted-foreground" /></Button>
                               <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the "{cat.name}" category and it cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)} className="bg-destructive hover:bg-destructive/90">
                                        Yes, delete
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))
                ): (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No categories found.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CategoryEditDialog category={editingCategory} isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} onSave={handleSaveCategory} />
    </div>
  );
}

    