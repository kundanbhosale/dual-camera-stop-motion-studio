import { useEffect, useState } from "react";
import type { SessionState } from "@/stores/sessionStore";
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "./ui/carousel";

interface Props {
	frames: SessionState["capturedFrames"];
}

export function TimelineFrames({ frames }: Props) {
	const [api, setApi] = useState<CarouselApi>();

	useEffect(() => {
		if (!api) return;

		requestAnimationFrame(() => {
			api.reInit();

			api.scrollTo(api.slideNodes().length - 1);
		});
	}, [frames.length, api]);

	if (frames.length === 0) {
		return (
			<div className="h-16 bg-muted items-center justify-center flex">
				<p>No Frames Yet.</p>
			</div>
		);
	}
	return (
		<Carousel
			setApi={setApi}
			opts={{
				align: "start",
				dragFree: true,
			}}
			className="w-full border-t pt-2"
		>
			<CarouselContent>
				{frames.map((frame, i) => (
					<CarouselItem key={i} className="basis-auto">
						<div className="flex flex-col gap-2">
							<div className="text-xs text-zinc-400">Frame {i + 1}</div>

							<div className="flex gap-1">
								{frame.left && (
									<img
										src={frame.left.file}
										className="h-16 w-16 rounded object-cover"
										alt={frame.left.name}
									/>
								)}

								{frame.right && (
									<img
										src={frame.right.file}
										className="h-16 w-16 rounded object-cover"
										alt={frame.right.name}
									/>
								)}
							</div>
						</div>
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious className={"-left-2 mt-4"} />
			<CarouselNext className={"-right-2 mt-4"} />
		</Carousel>
	);
}
