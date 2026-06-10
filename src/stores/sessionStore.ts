import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { idbStorage } from "./idbStorage";

export interface SessionState {
	onionSkin: boolean;
	onionSkinOpacity: number;
	sourceImage: boolean;
	sourceImgOpacity: number;

	leftFramePrefix: string;
	rightFramePrefix: string;
	sourceFramePrefix: string;
	leftFolderName: string;
	rightFolderName: string;
	sourceFolderName: string;

	leftDeviceId?: string;
	rightDeviceId?: string;

	parentFolder?: FileSystemDirectoryHandle;

	capturedFrames: {
		left?: { name: string; file: string };
		right?: { name: string; file: string };
		source?: { name: string; file: string };
	}[];

	setParentFolder: (handle: FileSystemDirectoryHandle) => void;

	setDevices: (left?: string, right?: string) => void;
	toggleSourceImage: () => void;

	toggleOnion: () => void;
	addCapturedFrame: (
		frame: SessionState["capturedFrames"][number],
		idx: number,
	) => void;
}

export const useSessionStore = create<SessionState>()(
	persist(
		(set) => ({
			onionSkin: true,
			onionSkinOpacity: 0.5,
			sourceImage: true,
			sourceImgOpacity: 0.5,
			sourceFramePrefix: "S",
			leftFramePrefix: "L",
			rightFramePrefix: "R",
			sourceFolderName: "Source",
			leftFolderName: "Left Cam",
			rightFolderName: "Right Cam",

			capturedFrames: [],

			setDevices: (left, right) =>
				set({
					leftDeviceId: left,
					rightDeviceId: right,
				}),

			setParentFolder: (handle) =>
				set({
					parentFolder: handle,
				}),

			toggleOnion: () =>
				set((s) => ({
					onionSkin: !s.onionSkin,
				})),
			toggleSourceImage: () =>
				set((s) => ({
					sourceImage: !s.sourceImage,
				})),

			addCapturedFrame: (frame, idx) =>
				set((state) => {
					state.capturedFrames[idx] = {
						...state.capturedFrames[idx],
						...frame,
					};
					return state;
				}),
		}),
		{
			name: "dual-cam-store",
			storage: idbStorage,
			partialize: (state) => ({
				onionSkin: state.onionSkin,
				onionSkinOpacity: state.onionSkinOpacity,
				sourceImage: state.sourceImage,
				sourceImgOpacity: state.sourceImgOpacity,
				leftFramePrefix: state.leftFramePrefix,
				rightFramePrefix: state.rightFramePrefix,
				leftFolderName: state.leftFolderName,
				rightFolderName: state.rightFolderName,
				leftDeviceId: state.leftDeviceId,
				rightDeviceId: state.rightDeviceId,
				parentFolder: state.parentFolder,
			}),
		},
	),
);
