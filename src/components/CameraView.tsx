import { forwardRef, useEffect, useRef } from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDevices } from "@/stores/devicesStore";
import { type SessionState, useSessionStore } from "@/stores/sessionStore";

interface Props {
	stream?: MediaStream;
	overlay?: string;
	title: string;
	id?: string;
	onCamChange: (v: string | null) => void;
}

export const CameraView = forwardRef<HTMLVideoElement, Props>(
	({ stream, overlay, title, id, onCamChange }, ref) => {
		const internalRef = useRef<HTMLVideoElement>(null);
		const onionOpacity = useSessionStore((s) => s.onionSkinOpacity);

		const devices = useDevices((s) => s.devices);
		useEffect(() => {
			async function attach() {
				if (!internalRef.current || !stream) return;

				const video = internalRef.current;
				video.srcObject = stream;

				try {
					await video.play();
				} catch (err) {
					console.error("Video play failed", err);
				}
			}
			attach();
		}, [stream]);

		return (
			<div className="relative overflow-hidden border">
				<div className="border-b px-2 py-1 text-sm font-medium flex items-center justify-between">
					<p>{title}</p>
					<div>
						<Select value={id} key={id} onValueChange={(b) => onCamChange(b)}>
							<SelectTrigger className="w-full max-w-48 rounded-full" size="sm">
								<SelectValue>
									{(value) => (
										<span>
											{devices.find((f) => f.deviceId === value)?.label}
										</span>
									)}
								</SelectValue>
							</SelectTrigger>
							<SelectContent side="bottom">
								<SelectGroup>
									<SelectLabel>Select Camera</SelectLabel>
									{devices.map((item) => (
										<SelectItem key={item.deviceId} value={item.deviceId}>
											{item.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="relative aspect-video">
					{overlay && (
						<img
							src={overlay}
							className="absolute inset-0 z-10 h-full w-full object-cover"
							style={{ opacity: onionOpacity }}
							alt=""
						/>
					)}

					<video
						ref={(node) => {
							internalRef.current = node;
							if (typeof ref === "function") {
								ref(node);
							} else if (ref) {
								ref.current = node;
							}
						}}
						autoPlay
						muted
						playsInline
						preload="auto"
						className="h-full w-full object-cover"
					/>
				</div>
			</div>
		);
	},
);

CameraView.displayName = "CameraView";
