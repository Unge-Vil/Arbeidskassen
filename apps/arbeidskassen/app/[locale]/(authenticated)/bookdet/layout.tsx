import type { Metadata } from "next";
import { BookdetShell } from "./bookdet-shell";

export const metadata: Metadata = {
  title: "BookDet",
  description: "BookDet — bookingmodul i Arbeidskassen",
};

export default function BookdetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BookdetShell>{children}</BookdetShell>;
}
