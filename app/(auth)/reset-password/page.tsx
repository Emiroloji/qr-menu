import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Yeni şifre" };

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token, error } = await searchParams;
  const validToken = typeof token === "string" && !error ? token : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Yeni şifre belirleyin</CardTitle>
        {validToken && (
          <CardDescription>En az 8 karakter kullanın.</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {validToken ? (
          <ResetPasswordForm token={validToken} />
        ) : (
          <div role="alert" className="flex flex-col gap-4 text-sm">
            <p>Bağlantının süresi dolmuş veya geçersiz.</p>
            <Link
              href="/forgot-password"
              className="font-medium underline-offset-4 hover:underline"
            >
              Yeni bağlantı iste
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
