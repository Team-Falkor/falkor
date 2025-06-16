import { Loader2 } from "lucide-react";
import {
	createContext,
	type FC,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
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

type BeforeNextHandler = () => boolean | Promise<boolean>;

interface MultiStepDialogContextType {
	currentStep: number;
	totalSteps: number;
	isFirstStep: boolean;
	isLastStep: boolean;
	isNavigating: boolean;
	goToNextStep: () => Promise<void>;
	goToPrevStep: () => void;
	goToStep: (step: number) => void;
	close: () => void;
	setTitle: (title: string) => void;
	setDescription: (description: ReactNode) => void;
	setFooter: (footer: ReactNode) => void;
	setIsNavigating: (isNavigating: boolean) => void;
	setBeforeNext: (handler: BeforeNextHandler | null) => void;
}

const MultiStepDialogContext = createContext<MultiStepDialogContextType | null>(
	null,
);

export const useMultiStepDialog = () => {
	const context = useContext(MultiStepDialogContext);
	if (!context) {
		throw new Error(
			"useMultiStepDialog must be used within a MultiStepDialog component",
		);
	}
	return context;
};

export interface Step {
	title?: string;
	description?: ReactNode;
	component: ReactNode;
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

export const MultiStepDialog: FC<MultiStepDialogProps> = ({
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
	const [currentStep, setCurrentStep] = useState(initialStep);
	const [isNavigating, setIsNavigating] = useState(false);
	const [title, setTitle] = useState(steps[currentStep]?.title);
	const [description, setDescription] = useState(
		steps[currentStep]?.description,
	);
	const [footer, setFooter] = useState<ReactNode>(null);

	const beforeNextHandlerRef = useRef<BeforeNextHandler | null>(null);

	const setBeforeNext = useCallback((handler: BeforeNextHandler | null) => {
		beforeNextHandlerRef.current = handler;
	}, []);

	useEffect(() => {
		if (isOpen) {
			setCurrentStep(initialStep);
		}
	}, [isOpen, initialStep]);

	const totalSteps = steps.length;
	const isLastStep = currentStep === totalSteps - 1;
	const isFirstStep = currentStep === 0;

	const goToStep = useCallback(
		(newStep: number) => {
			if (newStep >= 0 && newStep < totalSteps) {
				setCurrentStep((oldStep) => {
					onStepChange?.(newStep, oldStep);
					return newStep;
				});
			}
		},
		[totalSteps, onStepChange],
	);

	const goToNextStep = useCallback(async () => {
		if (isLastStep) return;

		const handler = beforeNextHandlerRef.current;

		if (handler) {
			setIsNavigating(true);
			try {
				const canProceed = await handler();
				if (!canProceed) {
					return;
				}
			} finally {
				setIsNavigating(false);
			}
		}

		goToStep(currentStep + 1);
	}, [isLastStep, goToStep, currentStep]);

	const goToPrevStep = useCallback(() => {
		if (!isFirstStep) {
			goToStep(currentStep - 1);
		}
	}, [isFirstStep, goToStep, currentStep]);

	const handleConfirm = () => {
		onConfirm?.();
		onClose();
	};

	const handleCancel = () => {
		if (resetOnCancel) {
			onCancel?.("reset");
			goToStep(initialStep);
		} else {
			onCancel?.("close");
		}
		onClose();
	};

	useEffect(() => {
		setTitle(steps[currentStep]?.title);
		setDescription(steps[currentStep]?.description);
		setFooter(null);
		beforeNextHandlerRef.current = null;
	}, [currentStep, steps]);

	const defaultFooter = (
		<DialogFooter>
			{!isFirstStep && (
				<Button
					variant="outline"
					onClick={goToPrevStep}
					disabled={isNavigating}
				>
					{prevLabel}
				</Button>
			)}
			{!isLastStep && (
				<Button onClick={goToNextStep} disabled={isNavigating}>
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

	const contextValue = useMemo(
		() => ({
			currentStep,
			totalSteps,
			isFirstStep,
			isLastStep,
			isNavigating,
			goToNextStep,
			goToPrevStep,
			goToStep,
			close: onClose,
			setTitle,
			setDescription,
			setFooter,
			setIsNavigating,
			setBeforeNext,
		}),
		[
			currentStep,
			totalSteps,
			isFirstStep,
			isLastStep,
			isNavigating,
			goToNextStep,
			goToPrevStep,
			goToStep,
			onClose,
			setBeforeNext,
		],
	);

	if (!isOpen) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className={cn(dialogContentClassName)}>
				<MultiStepDialogContext.Provider value={contextValue}>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						{description && (
							<DialogDescription>{description}</DialogDescription>
						)}
					</DialogHeader>

					{steps[currentStep]?.component}

					{footer || defaultFooter}
				</MultiStepDialogContext.Provider>
			</DialogContent>
		</Dialog>
	);
};
