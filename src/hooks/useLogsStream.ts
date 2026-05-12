import { useState, useEffect, useRef } from "react";

export function useLogsStream(streamUrl: string | null, enabled: boolean) {
	const [logs, setLogs] = useState<string[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const eventSourceRef = useRef<EventSource | null>(null);

	const handleOpen = () => {
		setIsConnected(true);
		setError(null);
	};

	const handleError = (err: Event) => {
		setIsConnected(false);
		setError(new Error(err.toString()));
	};

	const handleMessage = (event: MessageEvent) => {
		const newLog = event.data;
		setLogs((prev) => [...prev, newLog]);
	};

	const handleClose = () => {
		setIsConnected(false);
	};

	useEffect(() => {
		if (!enabled || !streamUrl) {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
				handleClose();
			}
			return;
		}

		const eventSource = new EventSource(streamUrl);
		eventSourceRef.current = eventSource;

		eventSource.onopen = handleOpen;
		eventSource.onerror = handleError;
		eventSource.onmessage = handleMessage;

		return () => {
			eventSource.removeEventListener('open', handleOpen);
			eventSource.removeEventListener('error', handleError);
			eventSource.removeEventListener('message', handleMessage);
			eventSource.close();
			eventSourceRef.current = null;
		};
	}, [streamUrl, enabled]);

	const clearLogs = () => {
		setLogs([]);
	};

	return { logs, isConnected, error, clearLogs };
}
