import { useEffect, useMemo, useRef, type ChangeEvent } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@paw-match/utilities";
import { VisuallyHidden } from "./VisuallyHidden";

export interface ImageUploaderProps {
  label: string;
  hideLabel?: boolean;
  /** Add to the existing selection on each pick; false replaces it (single-file mode). */
  multiple?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string | null;
  files: File[];
  onFilesChange: (files: File[]) => void;
  className?: string;
}

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/gif,image/webp";

/**
 * Generic staged-file picker with thumbnail previews and per-file removal —
 * the caller owns when to actually upload the staged files (mirrors the
 * "pick, preview, then Save" flow already used by the Public Website's
 * ProfileImageManager, generalized to support multiple files). Manages its
 * own object-URL preview lifecycle; the caller only ever deals in `File[]`.
 */
export const ImageUploader = ({
  label,
  hideLabel = false,
  multiple = false,
  disabled = false,
  hint,
  error,
  files,
  onFilesChange,
  className,
}: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const staged = useMemo(
    () => files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => {
    return () => {
      staged.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    };
  }, [staged]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) return;

    onFilesChange(multiple ? [...files, ...selected] : selected);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <Upload className="h-4 w-4" aria-hidden />
        {hideLabel ? <VisuallyHidden>{label}</VisuallyHidden> : label}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          multiple={multiple}
          className="sr-only"
          onChange={handleChange}
          disabled={disabled}
        />
      </label>

      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {staged.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {staged.map(({ file, previewUrl }, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200"
            >
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
