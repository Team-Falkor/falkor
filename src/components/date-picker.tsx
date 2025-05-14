import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { SelectSingleEventHandler } from "react-day-picker";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "./ui/calendar";

interface DatePickerProps {
	/** The currently selected date */
	value?: Date;
	/** Handler called when a date is selected */
	onChange: SelectSingleEventHandler;
	/** Placeholder text when no date is selected */
	placeholder?: string;
	/** Additional classes for the trigger button */
	className?: string;
	/** Earliest selectable date (inclusive) */
	minDate?: Date;
	/** Latest selectable date (inclusive) */
	maxDate?: Date;
}

export function DatePicker({
	value,
	onChange,
	placeholder = "Pick a date",
	className,
	minDate = new Date("1900-01-01"),
	maxDate,
}: DatePickerProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"w-[240px] pl-3 text-left font-normal",
						!value && "text-muted-foreground",
						className,
					)}
				>
					{value ? format(value, "PPP") : <span>{placeholder}</span>}
					<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={value}
					onSelect={onChange}
					disabled={(date) =>
						(!!maxDate && date > maxDate) || (!!minDate && date < minDate)
					}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
