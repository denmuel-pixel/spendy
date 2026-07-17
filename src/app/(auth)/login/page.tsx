"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Fingerprint, KeyRound, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Toaster, toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPin } = useAuth();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [usePin, setUsePin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFaceIdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Masukkan email terlebih dahulu");
      return;
    }
    setIsLoading(true);
    try {
      await login(email);
      toast.success("Login berhasil!");
      router.push("/");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Login gagal";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pin) {
      toast.error("Masukkan email dan PIN");
      return;
    }
    setIsLoading(true);
    try {
      await loginWithPin(email, pin);
      toast.success("Login berhasil!");
      router.push("/");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Login gagal";
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
          <CardTitle className="text-2xl font-bold">Masuk ke Spendy</CardTitle>
          <CardDescription>
            {usePin
              ? "Masukkan PIN cadangan Anda"
              : "Gunakan Face ID untuk login cepat"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!usePin ? (
            <form onSubmit={handleFaceIdLogin} className="space-y-4">
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
                {isLoading ? "Memproses..." : "Login dengan Face ID"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setUsePin(true)}
                  className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 inline mr-1" />
                  Login dengan PIN sebagai gantinya
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePinLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin-email">Email</Label>
                <Input
                  id="pin-email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN (4-6 digit)</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="******"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base gap-2"
                disabled={isLoading}
                variant="secondary"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <KeyRound className="w-5 h-5" />
                )}
                {isLoading ? "Memproses..." : "Login dengan PIN"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setUsePin(false)}
                  className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors"
                >
                  <Fingerprint className="w-3.5 h-3.5 inline mr-1" />
                  Gunakan Face ID
                </button>
              </div>
            </form>
          )}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Daftar
            </Link>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
