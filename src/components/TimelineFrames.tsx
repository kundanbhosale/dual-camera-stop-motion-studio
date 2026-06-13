import { ControlIcon } from "@phosphor-icons/react";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { CommandIcon, ImagePlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getFrameNumber } from "@/lib/frame";
import { cn } from "@/lib/utils";
import type { SessionState } from "@/stores/sessionStore";
import { Button, buttonVariants } from "./ui/button";
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "./ui/carousel";
import { Separator } from "./ui/separator";

interface Props {
	frames: SessionState["capturedFrames"];
	currentFrameIdx: number | undefined;
	setCurrentFrameIdx: (v: number) => void;
	addNewFrame: () => void;
	addSource: (file: File, i: number) => void;
}

export function TimelineFrames({
	frames,
	currentFrameIdx,
	setCurrentFrameIdx,
	addNewFrame,
	addSource,
}: Props) {
	const [api, setApi] = useState<CarouselApi>();
	const isMac = useMemo(
		() => /Mac|iPhone|iPod|iPad/.test(navigator.platform),
		[],
	);
	useEffect(() => {
		if (!api) return;

		requestAnimationFrame(() => {
			api.reInit();

			api.scrollTo(api.slideNodes().length - 1);
		});
	}, [frames.length, api]);

	if (frames.length === 0) {
		return (
			<div className="h-68 bg-muted items-center justify-center flex">
				<p>No Frames Yet.</p>
			</div>
		);
	}
	return (
		<div className="border divide-y">
			<div className="flex border-x p-2 text-xs">
				<p>
					Current Frame&nbsp;
					<span className="font-bold">{currentFrameIdx + 1}</span>
				</p>
			</div>
			<div className="flex select-none">
				<div className="flex flex-col text-xs border-r">
					<div className="aspect-square w-full min-w-14 max-w-16 font-medium border-b items-center text-center justify-center align-middle  flex h-8 p-2">
						#
					</div>
					<div className="aspect-square w-full min-w-14 max-w-16 font-medium border-b items-center text-center justify-center align-middle  flex px-2">
						S
					</div>
					<div className="aspect-square w-full min-w-14 max-w-16 font-medium border-b items-center text-center justify-center align-middle  flex px-2">
						L
					</div>
					<div className="aspect-square w-full min-w-14 max-w-16 font-medium  items-center text-center justify-center align-middle  flex px-2">
						R
					</div>
				</div>
				<div className="flex-1 overflow-hidden">
					<Carousel
						setApi={setApi}
						opts={{
							align: "start",
							dragFree: true,
						}}
						// className="w-full"
					>
						<CarouselContent className="ml-0 flex-1">
							{frames.map((frame, i) => (
								<CarouselItem key={i} className="basis-auto pl-1">
									<button
										type="button"
										onClick={() => setCurrentFrameIdx(i)}
										className={cn(
											"flex flex-col items-center justify-center border-x hover:bg-muted cursor-pointer hover:text-muted-foreground transition-all ease-in-out",
										)}
									>
										<div
											className={cn(
												"p-2 text-xs border-b text-center w-full min-w-14 max-w-16 relative",
												currentFrameIdx === i &&
													"bg-primary text-primary-foreground",
											)}
										>
											{/* {currentFrameIdx === i && (
										<span className="absolute block -top-2 size-4 rounded-full border left-1/2 -translate-x-1/2 bg-green-500"></span>
									)} */}
											<span className="line-clamp-1" title="">
												{/* {[
													getFrameNumber(frame.source?.name),
													getFrameNumber(frame.left?.name),
													getFrameNumber(frame.right?.name),
												]
													.filter((v) => !!v)
													.join("/") || i + 1} */}
												{i + 1}
											</span>
										</div>
										<div className="aspect-square w-full min-w-14 max-w-16 p-1 overflow-hidden border-b">
											{frame.source?.file ? (
												<img
													src={frame.source.file}
													className="size-full object-cover"
													alt={frame.source.name}
												/>
											) : (
												<label
													title="Add Source Image"
													className="aspect-square w-full min-w-14 max-w-16 p-1 border-b overflow-hidden text-center flex items-center justify-center hover:bg-primary hover:text-prim"
												>
													<input
														type="file"
														accept="image/*"
														className="hidden"
														onChange={(e) => {
															const file = e.target.files?.[0];
															if (!file || currentFrameIdx === -1) return;
															addSource(file, i);
														}}
													/>
													<PlusIcon />
												</label>
											)}
										</div>
										<div className="aspect-square w-full min-w-14 max-w-16 p-1 overflow-hidden border-b">
											{frame.left && (
												<img
													src={frame.left.file}
													className="size-full object-cover"
													alt={frame.left.name}
												/>
											)}
										</div>
										<div className="aspect-square w-full min-w-14 max-w-16 p-1 overflow-hidden">
											{frame.right && (
												<img
													src={frame.right.file}
													className="size-full object-cover"
													alt={frame.right.name}
												/>
											)}
										</div>
									</button>
									{/* <div className="text-xs text-zinc-400 truncate">
								Frame {getFrameNumber(frame.left?.name) ?? "NA"}/
								{getFrameNumber(frame.right?.name) ?? "NA"}
							</div> */}
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious className={"-left-2 mt-4"} />
						<CarouselNext className={"-right-2 mt-4"} />
					</Carousel>
				</div>
				<div>
					<button
						type="button"
						onClick={() => addNewFrame()}
						className={cn(
							"flex flex-col h-full w-10 bg-muted  items-center justify-center border-x hover:bg-muted cursor-pointer hover:text-muted-foreground transition-all ease-in-out",
						)}
					>
						<span
							style={{
								writingMode: "vertical-rl",
								textOrientation: "mixed",
							}}
							// className="rotate-90 inline-block w-full"
						>
							Add Frame&nbsp;&nbsp;
							{/* <span
								className={cn(
									buttonVariants({ variant: "outline" }),
									"size-4 2xl:size-6",
								)}
							>
								{isMac ? <CommandIcon /> : <ControlIcon />}
							</span>
							&nbsp; */}
							<span
								className={cn(
									"sm:text-xs",
									buttonVariants({ variant: "outline" }),
									"size-4 2xl:size-6",
								)}
							>
								N
							</span>
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}
