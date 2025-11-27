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
  const [selectedIcon, setSelectedIcon] = useState('');
  
  const handleAction = () => {
    toast({
      title: "Action Not Available",
      description: "Category management is an off-chain feature. This UI is a functional placeholder to demonstrate how such a system would be integrated.",
    });
  }

  if (error) {
    return (
       <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle/> Error Loading Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive-foreground">Could not load categories.</p>
          <p className="text-xs text-muted-foreground mt-2">{error.message}</p>
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
            <Input placeholder="New Category Name (e.g., Entertainment)" className="flex-1"/>
            <IconPicker
              value={selectedIcon}
              onSelect={setSelectedIcon}
            />
            <Button onClick={handleAction} className="w-full sm:w-auto">
               <Plus className="w-4 h-4 mr-2" />
               Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
           <CardDescription>
            Category management is an off-chain activity. This UI is for demonstration purposes.
           </CardDescription>
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
                    Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : categories && categories.length > 0 ? (
                    categories.map(cat => (
                        <TableRow key={cat.id}>
                            <TableCell><DynamicIcon name={cat.icon} /></TableCell>
                            <TableCell className="font-medium">{cat.name}</TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="ghost" onClick={handleAction}><Trash2 className="w-4 h-4" /></Button>
                            </TableCell>
                        </TableRow>
                    ))
                ): (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                            No categories found.
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
