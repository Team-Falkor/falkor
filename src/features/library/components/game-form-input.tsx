import type { InputHTMLAttributes, JSX } from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import {
	FormControl,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib";

interface GameFormInputProps<T extends FieldValues>
	extends InputHTMLAttributes<HTMLInputElement> {
	text: string;
	description: string;
	required?: boolean;
	field: ControllerRenderProps<T>;
	Button?: JSX.Element;
}

const GameFormInput = <T extends FieldValues>({
	description,
	required,
	field,
	Button,
	className,
	text,
	...props
}: GameFormInputProps<T>) => {
	return (
		<FormItem>
			<FormLabel>
				{text}
				{required ? "*" : null}
			</FormLabel>
			<div className="flex flex-1 flex-row">
				<FormControl>
					<Input
						placeholder={description}
						{...props}
						{...field}
						className={cn(
							"rounded-lg focus-visible:ring-0",
							{
								"rounded-r-none": !!Button,
							},
							className,
						)}
					/>
				</FormControl>
				{Button}
			</div>
			<FormMessage />
		</FormItem>
	);
};

export default GameFormInput;
