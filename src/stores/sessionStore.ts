import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { idbStorage } from "./idbStorage";

export interface SessionState {
	onionSkin: boolean;
	onionSkinOpacity: number;

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

	toggleOnion: () => void;
	addCapturedFrame: (
		frame: SessionState["capturedFrames"][number],
		idx: number,
	) => void;
	removeCapturedFrame: (idx: number) => void;
}
const defaultVals = {
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
};

export const useSessionStore = create<SessionState>()(
	persist(
		(set) => ({
			...defaultVals,
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

			addCapturedFrame: (frame, idx) =>
				set((state) => {
					state.capturedFrames[idx] = {
						...state.capturedFrames[idx],
						...frame,
					};
					return state;
				}),
			removeCapturedFrame: (idx) =>
				set((state) => ({
					capturedFrames: state.capturedFrames.filter((_, i) => i !== idx),
				})),
		}),
		{
			name: "dual-cam-store",
			storage: idbStorage,
			partialize: (state) => ({
				onionSkin: state.onionSkin,
				onionSkinOpacity: state.onionSkinOpacity,
				sourceFolderName: state.sourceFolderName,
				leftFramePrefix: state.leftFramePrefix,
				rightFramePrefix: state.rightFramePrefix,
				leftFolderName: state.leftFolderName,
				rightFolderName: state.rightFolderName,
				leftDeviceId: state.leftDeviceId,
				rightDeviceId: state.rightDeviceId,
				parentFolder: state.parentFolder,
			}),
			merge: (persisted: any, current) => ({
				...current,
				...persisted,
			}),
			version: 0.1,
		},
	),
);
