'use server';

import * as fs from 'fs/promises';
import * as path from 'path';
import { revalidatePath } from 'next/cache';

const filePath = path.join(process.cwd(), 'src', 'lib', 'placeholder-images.json');

// Define a type for the structure of your JSON data
interface PlaceholderData {
  categories: {
    id: string;
    name: string;
    icon: string;
    image: string;
    aiHint: string;
  }[];
}

export async function updateCategories(newCategories: PlaceholderData['categories']) {
  try {
    const data: PlaceholderData = { categories: newCategories };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    // Revalidate paths that use this data
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to write to placeholder-images.json:', error);
    return { success: false, error: 'Failed to update categories.' };
  }
}

export async function readCategories(): Promise<PlaceholderData> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent) as PlaceholderData;
  } catch (error) {
    console.error('Failed to read placeholder-images.json:', error);
    // Return a default structure in case of an error
    return { categories: [] };
  }
}
