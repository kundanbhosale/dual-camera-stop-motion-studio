import { PlusIcon } from "@phosphor-icons/react";
import { useSessionStore } from "@/stores/sessionStore";

export function SourceReference() {
	const sourceFrame = useSessionStore((s) => s.sourceFrame);
	async function uploadSourceFrames(e: React.ChangeEvent<HTMLInputElement>) {
		const files = Array.from(e.target.files || []);

		const urls = files.map((file) => URL.createObjectURL(file));

		useSessionStore.setState({ sourceFrame: urls[0] });
	}

	return (
		<div className="aspect-video bg-foreground">
			<label className="cursor-pointer">
				{sourceFrame ? (
					<>
						<img src={sourceFrame} className="h-full w-full object-contain" />
					</>
				) : (
					<div className="flex flex-col gap-2 h-full items-center justify-center text-background text-sm border  p-6 hover:opacity-90 transition">
						<span>
							<PlusIcon className="size-6" />
						</span>

						<span>Add Source Frame</span>
					</div>
				)}

				<input
					type="file"
					accept="image/*"
					onChange={uploadSourceFrames}
					className="hidden"
				/>
			</label>
		</div>
	);
}
