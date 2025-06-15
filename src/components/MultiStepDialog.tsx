import { Loader2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface Step {
	title: string;
	description?: string | React.ReactNode;
	component: React.ReactNode;
	beforeNext?: () => boolean | Promise<boolean>;
	footer?: React.ReactNode;
}

interface MultiStepDialogProps {
	isOpen: boolean;
	onClose: () => void;
	steps: Step[];
	onConfirm?: () => void;
	onCancel?: (reason: "close" | "reset") => void;
	onStepChange?: (newStep: number, oldStep: number) => void;
	initialStep?: number;
	dialogContentClassName?: string;
	nextLabel?: string;
	prevLabel?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	resetOnCancel?: boolean;
}

export const MultiStepDialog: React.FC<MultiStepDialogProps> = ({
	isOpen,
	onClose,
	steps,
	onConfirm,
	onCancel,
	onStepChange,
	initialStep = 0,
	dialogContentClassName,
	nextLabel = "Next",
	prevLabel = "Previous",
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	resetOnCancel = false,
}) => {
	const [currentStep, setCurrentStep] = React.useState(initialStep);
	const [isNavigating, setIsNavigating] = React.useState(false);

	React.useEffect(() => {
		if (isOpen) {
			setCurrentStep(initialStep);
		}
	}, [isOpen, initialStep]);

	const totalSteps = steps.length;
	const isLastStep = currentStep === totalSteps - 1;
	const currentStepData = steps[currentStep];

	const navigate = (newStep: number) => {
		if (onStepChange) {
			onStepChange(newStep, currentStep);
		}
		setCurrentStep(newStep);
	};

	const handleNext = async () => {
		if (currentStepData.beforeNext) {
			setIsNavigating(true);
			try {
				const canProceed = await currentStepData.beforeNext();
				if (!canProceed) return;
			} finally {
				setIsNavigating(false);
			}
		}
		if (currentStep < totalSteps - 1) {
			navigate(currentStep + 1);
		}
	};

	const handlePrev = () => {
		if (currentStep > 0) {
			navigate(currentStep - 1);
		}
	};

	const handleConfirm = () => {
		onConfirm?.();
		onClose();
	};

	// --- MODIFIED FUNCTION ---
	const handleCancel = () => {
		if (resetOnCancel) {
			onCancel?.("reset");
			navigate(initialStep);
		} else {
			onCancel?.("close");
			onClose();
		}
	};

	const renderFooter = () => {
		if (currentStepData.footer) {
			return currentStepData.footer;
		}

		return (
			<DialogFooter>
				{currentStep > 0 && (
					<Button
						variant="outline"
						onClick={handlePrev}
						disabled={isNavigating}
					>
						{prevLabel}
					</Button>
				)}
				{!isLastStep && (
					<Button onClick={handleNext} disabled={isNavigating}>
						{isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{nextLabel}
					</Button>
				)}
				{isLastStep && (
					<Button onClick={handleConfirm} disabled={isNavigating}>
						{confirmLabel}
					</Button>
				)}
				<Button variant="ghost" onClick={handleCancel} disabled={isNavigating}>
					{cancelLabel}
				</Button>
			</DialogFooter>
		);
	};

	if (!isOpen) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className={cn(dialogContentClassName)}>
				<DialogHeader>
					<DialogTitle>{currentStepData.title}</DialogTitle>
					{currentStepData.description && (
						<DialogDescription>{currentStepData.description}</DialogDescription>
					)}
				</DialogHeader>
				{currentStepData.component}
				{renderFooter()}
			</DialogContent>
		</Dialog>
	);
};
