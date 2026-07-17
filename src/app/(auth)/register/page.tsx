"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Fingerprint, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Toaster, toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/");
    return null;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Masukkan email Anda");
      return;
    }
    setIsLoading(true);
    try {
      await register(email);
      toast.success("Pendaftaran berhasil! Selamat datang di Spendy 🎉");
      router.push("/");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Pendaftaran gagal";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto bg-emerald-100 dark:bg-emerald-900/30 w-14 h-14 rounded-2xl flex items-center justify-center mb-2">
            <Smartphone className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Daftar Spendy</CardTitle>
          <CardDescription>
            Daftar dengan email, lalu scan Face ID Anda untuk aktivasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">📱 Persiapan Registrasi:</p>
              <ul className="mt-1 list-disc list-inside text-amber-700 dark:text-amber-300">
                <li>Pastikan perangkat Anda mendukung Face ID / Touch ID</li>
                <li>Di iPhone: buka via Safari untuk hasil terbaik</li>
                <li>Anda akan diminta memverifikasi identitas dengan biometrik</li>
              </ul>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Fingerprint className="w-5 h-5" />
              )}
              {isLoading ? "Memproses..." : "Daftar dengan Face ID"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
