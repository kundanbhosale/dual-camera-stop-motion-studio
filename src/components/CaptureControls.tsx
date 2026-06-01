import { Button } from "./ui/button";

interface Props {
	frame: number;
	onionSkin: boolean;
	onCapture: () => void;
	onToggleOnion: () => void;
}

export function CaptureControls({
	frame,
	onionSkin,
	onCapture,
	onToggleOnion,
}: Props) {
	return (
		<div className="flex items-center gap-4 rounded-xl border border-zinc-700 p-4">
			<Button onClick={onCapture}>Capture</Button>

			<Button variant={"outline"} onClick={onToggleOnion}>
				Onion Skin: {onionSkin ? "ON" : "OFF"}
			</Button>

			<div className="ml-auto text-lg font-bold">Frame #{frame}</div>
		</div>
	);
}
