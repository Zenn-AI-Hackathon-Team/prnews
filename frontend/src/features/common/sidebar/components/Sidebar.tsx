import { TooltipProvider } from "@/components/ui/tooltip";
import Logo from "../../logo/components/Logo";
import Footer from "./Footer";
import Navigation from "./Navigation";

const Sidebar = () => {
	return (
		<TooltipProvider delayDuration={0}>
			<aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r transition-all duration-300 z-40 w-48">
				<div className="flex flex-col h-full">
					{/* Logo Section */}
					<div className="p-6 border-b">
						<div className="flex items-center justify-between">
							<Logo />
						</div>
					</div>

					{/* Navigation */}
					<Navigation />
					{/* Footer Section */}
					<Footer />
				</div>
			</aside>
		</TooltipProvider>
	);
};

export default Sidebar;
