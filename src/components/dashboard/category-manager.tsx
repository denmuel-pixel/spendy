"use client";

import { useState } from "react";
import { Plus, Trash2, Tags, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCategories } from "@/hooks/useCategories";
import { Toaster, toast } from "sonner";

const COLOR_OPTIONS = [
  "#10B981", "#6366F1", "#EC4899", "#F59E0B",
  "#EF4444", "#8B5CF6", "#06B6D4", "#22C55E", "#F97316",
];

export default function CategoryManager() {
  const { categories, refetch } = useCategories();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#10B981");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error("Nama kategori diperlukan");
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Kategori "${newName}" ditambahkan!`);
      setNewName("");
      setNewColor("#10B981");
      refetch();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menambah kategori";
      toast.error(msg);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?\nTransaksi dengan kategori ini akan dipindahkan ke kategori default.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Kategori "${name}" dihapus`);
      refetch();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal menghapus";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <>
      <Toaster position="top-center" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="outline" size="sm" className="gap-1.5">
              <Tags className="w-3.5 h-3.5" />
              <span className="text-xs">Kategori</span>
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="w-5 h-5 text-emerald-500" />
              Kelola Kategori
            </DialogTitle>
            <DialogDescription>
              Tambah kategori pengeluaran baru
            </DialogDescription>
          </DialogHeader>

          {/* Add new category */}
          <div className="space-y-3 p-3 rounded-xl bg-muted/50">
            <Label className="text-xs font-bold">Tambah Kategori Baru</Label>
            <Input
              placeholder="Nama kategori"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-9 text-sm"
            />
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">Warna</span>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      newColor === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <Button
              size="sm"
              className="w-full gap-1.5"
              onClick={handleAdd}
              disabled={isAdding}
            >
              <Plus className="w-3.5 h-3.5" />
              {isAdding ? "Menambah..." : "Tambah Kategori"}
            </Button>
          </div>

          {/* Existing categories */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              Daftar Kategori ({expenseCategories.length})
              {expenseCategories.length > 4 && <span className="text-[9px] text-muted-foreground/60 italic">— scroll ↓</span>}
            </span>
            {expenseCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2 rounded-xl bg-card border text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id, cat.name)}
                    disabled={deletingId === cat.id}
                    className="p-1 text-muted-foreground/30 hover:text-rose-500 transition-colors"
                  >
                    {deletingId === cat.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                  {cat.isDefault && (
                    <span className="text-[9px] text-muted-foreground/40 italic">default</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
