
import { CreateEventForm } from '@/components/create-event-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { readCategories } from '../admin/actions';

// This is now a Server Component to fetch data
export default async function CreateEventPage() {
    // Fetch categories on the server
    const categoryData = await readCategories();
    const categories = categoryData.categories;

  return (
    <>
        <PageHeader 
            title="Create New Event"
            description="Define a new event for users to place their bets on. Ensure all details are accurate before submitting to the blockchain."
        />

      <Card>
        <CardHeader>
          <CardTitle>Manual Event Details</CardTitle>
          <CardDescription>
            This action is irreversible. Double-check all fields before submitting.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <CreateEventForm 
            categories={categories}
          />
        </CardContent>
      </Card>
    </>
  );
}
