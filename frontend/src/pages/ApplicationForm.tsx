import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useApplication,
  useCreateApplication,
  useUpdateApplication,
  useUploadAttachment,
} from '../api/hooks.js';
import type { Category } from '../api/types.js';
import { ApiError } from '../api/client.js';
import { Button } from '../components/Button.js';
import { ArrowLeftIcon, FileIcon, CloseIcon, UploadIcon } from '../components/icons.js';
import { CATEGORY_LABEL } from '../lib/labels.js';

const CATEGORIES: Category[] = ['GRANT', 'EXPENSE', 'EQUIPMENT', 'TRAVEL', 'OTHER'];
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

interface FieldErrors {
  title?: string;
  amount?: string;
  file?: string;
  form?: string;
}

export function ApplicationForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const existing = useApplication(id);
  const create = useCreateApplication();
  const update = useUpdateApplication(id ?? '');
  const upload = useUploadAttachment(id ?? '');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('GRANT');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (isEdit && existing.data) {
      setTitle(existing.data.title);
      setCategory(existing.data.category);
      setAmount(existing.data.amount ?? '');
      setDescription(existing.data.description);
    }
  }, [isEdit, existing.data]);

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (title.trim() === '') e.title = 'Title is required.';
    if (amount !== '' && (Number.isNaN(Number(amount)) || Number(amount) < 0)) {
      e.amount = 'Amount must be zero or greater.';
    }
    return e;
  }

  async function save() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload = {
      title: title.trim(),
      category,
      description: description.trim(),
      amount: amount === '' ? null : Number(amount),
    };

    try {
      if (isEdit && id) {
        await update.mutateAsync(payload);
        navigate(`/applications/${id}`);
      } else {
        const created = await create.mutateAsync(payload);
        navigate(`/applications/${created.id}`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        const mapped: FieldErrors = {};
        for (const d of err.details) {
          if (d.path === 'title') mapped.title = d.message;
          else if (d.path === 'amount') mapped.amount = d.message;
        }
        mapped.form = err.message;
        setErrors(mapped);
      } else {
        setErrors({ form: err instanceof Error ? err.message : 'Could not save.' });
      }
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setErrors((p) => ({ ...p, file: 'Unsupported file type. Use PNG, JPG, WEBP or PDF.' }));
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrors((p) => ({ ...p, file: 'File is larger than 5MB.' }));
      return;
    }
    setErrors((p) => ({ ...p, file: undefined }));
    try {
      await upload.mutateAsync(file);
    } catch (err) {
      setErrors((p) => ({
        ...p,
        file: err instanceof Error ? err.message : 'Upload failed.',
      }));
    }
  }

  const attachmentName = existing.data?.attachmentName ?? null;
  const pending = create.isPending || update.isPending;
  const inputBase =
    'w-full rounded-lg border px-3 py-2.5 text-sm transition-colors';

  return (
    <div className="mx-auto max-w-[660px]">
      <button
        onClick={() => navigate(isEdit && id ? `/applications/${id}` : '/')}
        className="focusable mb-3.5 inline-flex items-center gap-1.5 py-1 text-[13px] text-muted hover:text-graphite"
      >
        <ArrowLeftIcon size={15} />
        {isEdit ? 'Back to application' : 'Back to my applications'}
      </button>
      <h1 className="font-serif text-[26px] font-medium tracking-[-0.015em]">
        {isEdit ? 'Edit draft' : 'New application'}
      </h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        {isEdit
          ? 'Update your draft, then submit it for review.'
          : 'Fill in the details. It will be saved as a draft you can submit when ready.'}
      </p>

      {errors.form && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-5 flex gap-2.5 rounded-lg border border-[#E7C9C5] bg-[#FCEBEA] px-4 py-3 text-sm text-[#8A2018]"
        >
          <strong>{errors.form}</strong>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(20,21,26,.04)]">
        <div className="mb-5">
          <label htmlFor="title" className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
            Title <span className="text-[#B42318]">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby="title-err"
            placeholder="e.g. Community data literacy workshop"
            className={`${inputBase} ${errors.title ? 'border-[#E5544B]' : 'border-[#D8D6CF]'}`}
          />
          {errors.title && (
            <p id="title-err" role="alert" className="mt-1.5 text-xs text-[#B42318]">
              {errors.title}
            </p>
          )}
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={`${inputBase} cursor-pointer border-[#D8D6CF] bg-surface`}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="amount" className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
              Amount <span className="font-normal text-faint">· optional</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint">$</span>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={Boolean(errors.amount)}
                aria-describedby="amount-err"
                placeholder="0.00"
                className={`${inputBase} pl-7 ${errors.amount ? 'border-[#E5544B]' : 'border-[#D8D6CF]'}`}
              />
            </div>
            {errors.amount && (
              <p id="amount-err" role="alert" className="mt-1.5 text-xs text-[#B42318]">
                {errors.amount}
              </p>
            )}
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="description" className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this for? Add any context a reviewer would need."
            className={`${inputBase} resize-y border-[#D8D6CF] leading-relaxed`}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-[#374151]">
            Attachment <span className="font-normal text-faint">· optional</span>
          </label>
          {!isEdit ? (
            <p className="rounded-lg border-[1.5px] border-dashed border-line px-3 py-2.5 text-[13px] text-faint">
              Save the draft first, then you can attach a file.
            </p>
          ) : (
            <>
              {attachmentName && (
                <div className="mb-2 flex items-center gap-2.5 rounded-lg border-[1.5px] border-[#D8D6CF] bg-[#FCFCFA] px-3 py-2.5">
                  <FileIcon size={18} className="text-graphite" />
                  <span className="flex-1 truncate text-[13px]">{attachmentName}</span>
                  {existing.data?.attachmentUrl && (
                    <a
                      href={existing.data.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="focusable text-xs font-semibold text-graphite"
                    >
                      View
                    </a>
                  )}
                </div>
              )}
              <label
                htmlFor="file"
                className="focusable flex cursor-pointer items-center gap-2.5 rounded-lg border-[1.5px] border-dashed border-[#D8D6CF] px-3 py-2.5 text-[13px] text-muted hover:border-graphite hover:text-graphite"
              >
                <UploadIcon size={17} />
                {upload.isPending
                  ? 'Uploading…'
                  : attachmentName
                    ? 'Replace file — PNG, JPG, WEBP or PDF, up to 5MB'
                    : 'Choose a file — PNG, JPG, WEBP or PDF, up to 5MB'}
              </label>
              <input
                id="file"
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.pdf"
                onChange={(e) => void onFile(e.target.files?.[0])}
                className="sr-only"
              />
            </>
          )}
          {errors.file && (
            <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-[#B42318]">
              <CloseIcon size={12} />
              {errors.file}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2.5">
        <Button variant="secondary" onClick={() => navigate(isEdit && id ? `/applications/${id}` : '/')}>
          Cancel
        </Button>
        <Button onClick={() => void save()} disabled={pending}>
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Save draft'}
        </Button>
      </div>
    </div>
  );
}
