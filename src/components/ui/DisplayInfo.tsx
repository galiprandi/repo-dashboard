import { Clock, GitCommit, MessageSquare, Tag, User } from "lucide-react";
import DayJS from "@/lib/dayjs";
import { cn } from "@/lib/utils";

export const DisplayInfo = ({
	type,
	value,
	maxChar,
	hideIcon,
	hideTooltip,
	className,
	iconSize = 4,
}: Props) => {
	const icon =
		type === "commit"
			? "commit"
			: type === "tag"
				? "tag"
				: type === "dates"
					? "dates"
					: type === "author"
						? "author"
						: "message";
	const iconComponent =
		icon === "commit" ? (
			<GitCommit className="w-full h-full" />
		) : icon === "tag" ? (
			<Tag className="w-full h-full" />
		) : icon === "dates" ? (
			<Clock className="w-full h-full" />
		) : icon === "author" ? (
			<User className="w-full h-full" />
		) : (
			<MessageSquare className="w-full h-full" />
		);
	const iconColor =
		type === "commit"
			? "text-blue-500 dark:text-blue-400"
			: type === "tag"
				? "text-purple-500 dark:text-purple-400"
				: "text-muted-foreground";

	const displayValue =
		value && maxChar && value.length > maxChar
			? `${value.substring(0, maxChar)}...`
			: value;

	if (!value) return <span className="text-muted-foreground">-</span>;

	const tooltip = getTooltipValue({ value, type });
	const hasTooltip = !!tooltip && !hideTooltip;

	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			{!hideIcon && (
				<div
					className={cn(
						iconColor,
						"flex items-center justify-center shrink-0",
						`w-${iconSize} h-${iconSize}`,
					)}
				>
					{iconComponent}
				</div>
			)}
			<span
				className={cn(
					"text-sm text-foreground/80 transition-colors",
					hasTooltip && "cursor-help underline decoration-dotted decoration-muted-foreground/50 underline-offset-4 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm",
				)}
				title={hasTooltip ? tooltip : undefined}
				tabIndex={hasTooltip ? 0 : undefined}
			>
				{type === "dates" ? DayJS(value).fromNow() : displayValue}
			</span>
		</div>
	);
};

const getTooltipValue = ({ value, type }: Pick<Props, "value" | "type">) => {
	if (!value) return undefined;
	if (type === "dates") {
		const utcISO = DayJS(value).utc().format("YYYY-MM-DD HH:mm:ss");
		const localISO = DayJS(value).local().format("YYYY-MM-DD HH:mm:ss");
		return `🌎 ${utcISO}\n👩‍💻 ${localISO}`;
	}
	if (type === "message" && value && value.length > 50) {
		return value;
	}
	return undefined;
};

type Props = {
	type: "commit" | "tag" | "dates" | "author" | "message";
	value?: string | null;
	maxChar?: number;
	hideIcon?: boolean;
	hideTooltip?: boolean;
	className?: string;
	iconSize?: number;
};
