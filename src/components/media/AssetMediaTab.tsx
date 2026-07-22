import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { assetsApi } from "@/lib/api/assets";
import { getErrorMessage } from "@/lib/api/errors";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Trash2, Star, ImageIcon, Loader2 } from "lucide-react";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX = 10 * 1024 * 1024;

export function AssetMediaTab({ assetId }: { assetId: string }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const query = useQuery({
    queryKey: ["asset-media", assetId],
    queryFn: () => assetsApi.media.list(assetId),
  });

  const upload = useMutation({
    mutationFn: (files: File[]) => assetsApi.media.upload(assetId, files),
    onMutate: () => setUploading(true),
    onSettled: () => setUploading(false),
    onSuccess: (items) => {
      toast.success(`Đã tải lên ${items.length} ảnh`);
      qc.invalidateQueries({ queryKey: ["asset-media", assetId] });
      qc.invalidateQueries({ queryKey: ["asset", assetId] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Không tải được ảnh")),
  });

  const remove = useMutation({
    mutationFn: (mediaId: string) => assetsApi.media.remove(assetId, mediaId),
    onSuccess: () => {
      toast.success("Đã xoá ảnh");
      qc.invalidateQueries({ queryKey: ["asset-media", assetId] });
      qc.invalidateQueries({ queryKey: ["asset", assetId] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Không xoá được ảnh")),
  });

  const setThumb = useMutation({
    mutationFn: (file: File) => assetsApi.media.setThumbnail(assetId, file),
    onSuccess: () => {
      toast.success("Đã đặt làm ảnh đại diện");
      qc.invalidateQueries({ queryKey: ["asset", assetId] });
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Không đặt được ảnh đại diện")),
  });

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files: File[] = [];
    for (const f of Array.from(fileList).slice(0, 10)) {
      if (!ACCEPT.includes(f.type) && !f.name.toLowerCase().endsWith(".heic")) {
        toast.error(`${f.name}: định dạng không hỗ trợ`);
        continue;
      }
      if (f.size > MAX) {
        toast.error(`${f.name}: vượt quá 10MB`);
        continue;
      }
      files.push(f);
    }
    if (files.length > 0) upload.mutate(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleThumbFromUrl = async (item: { file: { url: string; fileName?: string; contentType?: string } }) => {
    try {
      const res = await fetch(item.file.url);
      const blob = await res.blob();
      const file = new File([blob], item.file.fileName ?? "thumbnail.jpg", { type: item.file.contentType ?? blob.type });
      setThumb.mutate(file);
    } catch {
      toast.error("Không tải lại được ảnh để đặt đại diện");
    }
  };

  if (query.isLoading) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}</div>;
  }

  const items = (query.data ?? []).slice().sort((a, b) => {
    const ta = a.takenAt ? new Date(a.takenAt).getTime() : 0;
    const tb = b.takenAt ? new Date(b.takenAt).getTime() : 0;
    return tb - ta;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent
          className="p-6 border-dashed border-2 flex flex-col items-center justify-center text-center gap-2 hover:bg-muted/40 cursor-pointer transition"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm font-medium">Kéo-thả ảnh vào đây hoặc bấm để chọn</div>
          <div className="text-xs text-muted-foreground">JPEG / PNG / WEBP / HEIC · tối đa 10MB · tối đa 10 file/lần</div>
          {uploading && <div className="flex items-center gap-2 text-xs text-primary mt-2"><Loader2 className="h-3 w-3 animate-spin" />Đang tải lên...</div>}
          <input ref={inputRef} type="file" hidden multiple accept="image/*" onChange={(e) => handleFiles(e.target.files)} />
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">
          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
          Chưa có ảnh nào. Tải lên để bắt đầu.
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((m) => (
            <div key={m.id} className="group relative rounded-md overflow-hidden border bg-muted aspect-square">
              <img src={m.file.url} alt={m.caption ?? ""} className="w-full h-full object-cover" loading="lazy" />
              {m.takenAt && (
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent text-xs text-white">{formatDate(m.takenAt)}</div>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition">
                <Button size="sm" variant="secondary" onClick={() => handleThumbFromUrl(m)} disabled={setThumb.isPending}>
                  <Star className="h-3.5 w-3.5 mr-1" />Đại diện
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove.mutate(m.id)} disabled={remove.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
