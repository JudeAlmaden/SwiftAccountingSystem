import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IncomeEntryCalendarProps {
    date: Date | undefined;
    onDateChange: (date: Date | undefined) => void;
    entriesDates: Date[];
    pendingEditDates: Date[];
}

export default function IncomeEntryCalendar({
    date,
    onDateChange,
    entriesDates,
    pendingEditDates,
}: IncomeEntryCalendarProps) {
    return (
        <Card className="h-fit">
            <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Date</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={onDateChange}
                    className="rounded-md border-none"
                    showOutsideDays={true}
                    modifiers={{
                        hasEntry: entriesDates,
                        pendingEdit: pendingEditDates,
                    }}
                />
            </CardContent>
        </Card>
    );
}
