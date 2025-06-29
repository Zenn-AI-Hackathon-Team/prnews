import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/features/common/header/components/Header";
import Sidebar from "@/features/common/sidebar/components/Sidebar";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "PRNews",
	description: "PRNews",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<AuthProvider>
					<TooltipProvider>
						<Header />
						<Sidebar />
						<main className="ml-48 min-h-screen bg-background">
							<div className="p-6">{children}</div>
						</main>
					</TooltipProvider>
					<Toaster richColors />
				</AuthProvider>
			</body>
		</html>
	);
}
