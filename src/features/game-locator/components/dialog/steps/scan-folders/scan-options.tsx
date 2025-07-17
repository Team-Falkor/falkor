import { Settings, HardDrive, Clock, Users, FolderX, ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ScanOptions } from "@/@types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { TypographyMuted } from "@/components/ui/typography";

interface ScanOptionsProps {
	options: ScanOptions;
	onOptionsChange: (options: ScanOptions) => void;
	onUpdateOptions?: (options: ScanOptions) => Promise<void>;
	isScanning: boolean;
}

const DEFAULT_OPTIONS: ScanOptions = {
	minFileSize: 1024 * 1024, // 1MB
	maxFileSize: 50 * 1024 * 1024 * 1024, // 50GB
	maxDepth: 10,
	timeout: 300000, // 5 minutes
	concurrency: 4,
	extraSkipFolders: [],
};

const formatFileSize = (bytes: number): string => {
	if (bytes >= 1024 * 1024 * 1024) {
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
	}
	if (bytes >= 1024 * 1024) {
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
	if (bytes >= 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}
	return `${bytes} B`;
};

const parseFileSize = (value: string): number | undefined => {
	const trimmed = value.trim().toLowerCase();
	if (!trimmed) return undefined;
	
	const match = trimmed.match(/^([0-9.]+)\s*(b|kb|mb|gb)?$/);
	if (!match) return undefined;
	
	const num = parseFloat(match[1]);
	if (isNaN(num)) return undefined;
	
	const unit = match[2] || 'b';
	switch (unit) {
		case 'gb': return Math.round(num * 1024 * 1024 * 1024);
		case 'mb': return Math.round(num * 1024 * 1024);
		case 'kb': return Math.round(num * 1024);
		case 'b': return Math.round(num);
		default: return undefined;
	}
};

export const ScanOptions = ({ 
	options, 
	onOptionsChange, 
	onUpdateOptions,
	isScanning 
}: ScanOptionsProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [localOptions, setLocalOptions] = useState<ScanOptions>({
		...DEFAULT_OPTIONS,
		...options,
	});
	
	// Form state for display values
	const [minSizeDisplay, setMinSizeDisplay] = useState(
		localOptions.minFileSize ? formatFileSize(localOptions.minFileSize) : ""
	);
	const [maxSizeDisplay, setMaxSizeDisplay] = useState(
		localOptions.maxFileSize ? formatFileSize(localOptions.maxFileSize) : ""
	);
	const [skipFoldersText, setSkipFoldersText] = useState(
		localOptions.extraSkipFolders?.join("\n") || ""
	);
	
	useEffect(() => {
		setLocalOptions({ ...DEFAULT_OPTIONS, ...options });
		setMinSizeDisplay(options.minFileSize ? formatFileSize(options.minFileSize) : "");
		setMaxSizeDisplay(options.maxFileSize ? formatFileSize(options.maxFileSize) : "");
		setSkipFoldersText(options.extraSkipFolders?.join("\n") || "");
	}, [options]);
	
	const handleApplyOptions = useCallback(async () => {
		const newOptions: ScanOptions = {
			...localOptions,
			minFileSize: parseFileSize(minSizeDisplay),
			maxFileSize: parseFileSize(maxSizeDisplay),
			extraSkipFolders: skipFoldersText
				.split("\n")
				.map(line => line.trim())
				.filter(line => line.length > 0),
		};
		
		onOptionsChange(newOptions);
		if (onUpdateOptions) {
			try {
				await onUpdateOptions(newOptions);
			} catch (error) {
				console.error('Failed to update scan options:', error);
			}
		}
		setIsOpen(false);
	}, [localOptions, minSizeDisplay, maxSizeDisplay, skipFoldersText, onOptionsChange, onUpdateOptions]);
	
	const handleResetToDefaults = useCallback(() => {
		setLocalOptions(DEFAULT_OPTIONS);
		setMinSizeDisplay(formatFileSize(DEFAULT_OPTIONS.minFileSize!));
		setMaxSizeDisplay(formatFileSize(DEFAULT_OPTIONS.maxFileSize!));
		setSkipFoldersText("");
	}, []);
	
	return (
		<Card>
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-primary/10">
									<Settings className="h-4 w-4 text-primary" />
								</div>
								<div>
									<CardTitle className="text-base">Advanced Scan Options</CardTitle>
									<TypographyMuted className="text-xs">
										Fine-tune scan parameters for better performance
									</TypographyMuted>
								</div>
							</div>
							<div className="flex items-center gap-2">
								{!isOpen && (
									<Badge variant="secondary" className="text-xs">
										{localOptions.extraSkipFolders && localOptions.extraSkipFolders.length > 0 ? 'Custom' : 'Default'}
									</Badge>
								)}
								{isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
							</div>
						</div>
					</CardHeader>
				</CollapsibleTrigger>
			
				<CollapsibleContent>
					<CardContent className="space-y-6">
						{/* File Size Filters */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<HardDrive className="h-4 w-4 text-muted-foreground" />
								<h4 className="font-medium text-sm">File Size Limits</h4>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="minFileSize" className="text-xs font-medium">Minimum File Size</Label>
									<Input
										id="minFileSize"
										value={minSizeDisplay}
										onChange={(e) => setMinSizeDisplay(e.target.value)}
										placeholder="e.g., 1MB, 500KB, 1024B"
										className="text-sm"
									/>
									<TypographyMuted className="text-xs">
										Ignore files smaller than this size
									</TypographyMuted>
								</div>
								
								<div className="space-y-2">
									<Label htmlFor="maxFileSize" className="text-xs font-medium">Maximum File Size</Label>
									<Input
										id="maxFileSize"
										value={maxSizeDisplay}
										onChange={(e) => setMaxSizeDisplay(e.target.value)}
										placeholder="e.g., 50GB, 10GB, 1000MB"
										className="text-sm"
									/>
									<TypographyMuted className="text-xs">
										Ignore files larger than this size
									</TypographyMuted>
								</div>
							</div>
						</div>
						
						<Separator />
						
						{/* Performance Settings */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<h4 className="font-medium text-sm">Performance Settings</h4>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="maxDepth" className="text-xs font-medium">Max Directory Depth</Label>
									<Input
										id="maxDepth"
										type="number"
										min="1"
										max="50"
										value={localOptions.maxDepth || ""}
										onChange={(e) => setLocalOptions(prev => ({
											...prev,
											maxDepth: e.target.value ? parseInt(e.target.value) : undefined
										}))}
										className="text-sm"
									/>
									<TypographyMuted className="text-xs">
										How deep to scan subdirectories
									</TypographyMuted>
								</div>
								
								<div className="space-y-2">
									<Label htmlFor="concurrency" className="text-xs font-medium">Concurrency</Label>
									<Input
										id="concurrency"
										type="number"
										min="1"
										max="16"
										value={localOptions.concurrency || ""}
										onChange={(e) => setLocalOptions(prev => ({
											...prev,
											concurrency: e.target.value ? parseInt(e.target.value) : undefined
										}))}
										className="text-sm"
									/>
									<TypographyMuted className="text-xs">
										Number of parallel scan operations
									</TypographyMuted>
								</div>
								
								<div className="space-y-2">
									<div className="flex items-center gap-1">
										<Clock className="h-3 w-3 text-muted-foreground" />
										<Label htmlFor="timeout" className="text-xs font-medium">Timeout (seconds)</Label>
									</div>
									<Input
										id="timeout"
										type="number"
										min="30"
										max="3600"
										value={localOptions.timeout ? Math.round(localOptions.timeout / 1000) : ""}
										onChange={(e) => setLocalOptions(prev => ({
											...prev,
											timeout: e.target.value ? parseInt(e.target.value) * 1000 : undefined
										}))}
										className="text-sm"
									/>
									<TypographyMuted className="text-xs">
										Maximum scan duration
									</TypographyMuted>
								</div>
							</div>
						</div>
						
						<Separator />
						
						{/* Skip Folders */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<FolderX className="h-4 w-4 text-muted-foreground" />
								<h4 className="font-medium text-sm">Folder Exclusions</h4>
							</div>
							<div className="space-y-2">
								<Label htmlFor="skipFolders" className="text-xs font-medium">Additional Folders to Skip</Label>
								<Textarea
									id="skipFolders"
									value={skipFoldersText}
									onChange={(e) => setSkipFoldersText(e.target.value)}
									placeholder="node_modules\n.git\n.vscode\ntemp"
									rows={4}
									className="font-mono text-sm"
								/>
								<TypographyMuted className="text-xs">
									Enter one folder name per line. These folders will be skipped during scanning.
								</TypographyMuted>
							</div>
						</div>
						
						{/* Action Buttons */}
						<div className="flex justify-between pt-4">
							<Button
								variant="outline"
								onClick={handleResetToDefaults}
							>
								Reset to Defaults
							</Button>
							
							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={() => setIsOpen(false)}
								>
									Cancel
								</Button>
								<Button onClick={handleApplyOptions}>
									Apply Options
								</Button>
							</div>
						</div>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
};