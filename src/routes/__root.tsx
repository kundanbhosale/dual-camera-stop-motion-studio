import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect, useState } from "react";
import PromptPermission from "@/components/PromptPermission";
import { Toaster } from "@/components/ui/sonner";
import { useSessionStore } from "@/stores/sessionStore";
import Footer from "../components/Footer";
import Header from "../components/Header";
import appCss from "../global.css?url";

// const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Camera Capture",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	component: RootDocument,
});

function RootDocument() {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		async function bootstrap() {
			setReady(true);
		}

		bootstrap();
	}, []);

	return (
		<div className="antialiased [overflow-wrap:anywhere]">
			{/* <Header /> */}
			<Outlet />
			<div className="md:hidden  size-full fixed top-0 left-0 z-10 bg-black text-white flex items-center justify-center text-center text-pretty p-4">
				<h1>Mobile & Tablet screens not supported! </h1>
			</div>

			{/* <Footer /> */}
			<Toaster position="top-center" />
			<PromptPermission />
			<TanStackDevtools
				config={{
					position: "bottom-right",
				}}
				plugins={[
					{
						name: "Tanstack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
				]}
			/>
			<Scripts />
		</div>
	);
}
