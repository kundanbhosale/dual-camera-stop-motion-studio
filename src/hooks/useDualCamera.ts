import { useEffect, useRef, useState } from "react";

type UseDualCameraReturn = {
	leftStream?: MediaStream;
	rightStream?: MediaStream;
	error?: Error;
};

export function useDualCamera(
	leftDeviceId?: string,
	rightDeviceId?: string,
): UseDualCameraReturn {
	const [leftStream, setLeftStream] = useState<MediaStream>();

	const [rightStream, setRightStream] = useState<MediaStream>();

	const [error, setError] = useState<Error>();

	const leftMediaRef = useRef<MediaStream | undefined>(undefined);

	const rightMediaRef = useRef<MediaStream | undefined>(undefined);

	async function startCameras(): Promise<void> {
		try {
			if (!leftDeviceId || !rightDeviceId) {
				return;
			}

			// already running
			if (leftMediaRef.current || rightMediaRef.current) {
				return;
			}

			const leftMedia = await navigator.mediaDevices.getUserMedia({
				video: {
					deviceId: {
						exact: leftDeviceId,
					},
				},
				audio: false,
			});

			const rightMedia = await navigator.mediaDevices.getUserMedia({
				video: {
					deviceId: {
						exact: rightDeviceId,
					},
				},
				audio: false,
			});

			leftMediaRef.current = leftMedia;
			rightMediaRef.current = rightMedia;

			setLeftStream(leftMedia);
			setRightStream(rightMedia);
		} catch (err) {
			console.error(err);

			setError(err as Error);
		}
	}

	function stopStream(stream?: MediaStream | null): void {
		if (!stream) return;

		for (const track of stream.getTracks()) {
			track.stop();

			stream.removeTrack(track);
		}
	}

	function stopCameras(): void {
		stopStream(leftMediaRef.current);

		stopStream(rightMediaRef.current);

		leftMediaRef.current = undefined;
		rightMediaRef.current = undefined;

		setLeftStream(undefined);
		setRightStream(undefined);
	}

	useEffect(() => {
		startCameras();

		function handleVisibilityChange(): void {
			if (document.hidden) {
				stopCameras();
			} else {
				void startCameras();
			}
		}

		function handleBlur(): void {
			stopCameras();
		}

		function handleFocus(): void {
			void startCameras();
		}

		document.addEventListener("visibilitychange", handleVisibilityChange);

		window.addEventListener("blur", handleBlur);

		window.addEventListener("focus", handleFocus);

		return () => {
			stopCameras();

			document.removeEventListener("visibilitychange", handleVisibilityChange);

			window.removeEventListener("blur", handleBlur);

			window.removeEventListener("focus", handleFocus);
		};
	}, [leftDeviceId, rightDeviceId]);

	return {
		leftStream,
		rightStream,
		error,
	};
}
