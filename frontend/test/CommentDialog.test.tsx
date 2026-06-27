import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { CommentDialog } from '../src/components/CommentDialog.js';

// A small harness so the dialog has a real trigger button to restore focus to.
function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Reject</button>
      <CommentDialog
        open={open}
        title="Reject"
        description="Explain why."
        confirmLabel="Reject"
        confirmVariant="danger"
        onConfirm={() => setOpen(false)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

describe('CommentDialog — accessibility & required comment', () => {
  it('confirm is disabled until a non-empty comment is entered', async () => {
    const onConfirm = vi.fn();
    render(
      <CommentDialog
        open
        title="Reject"
        description="Explain why."
        confirmLabel="Reject"
        onConfirm={onConfirm}
        onClose={() => {}}
      />,
    );

    const confirm = screen.getByRole('button', { name: 'Reject' });
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/comment/i), '   ');
    expect(confirm).toBeDisabled(); // whitespace-only is still empty

    await userEvent.type(screen.getByLabelText(/comment/i), 'not eligible');
    expect(confirm).toBeEnabled();

    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith('not eligible');
  });

  it('is a labelled modal dialog and moves focus to the textarea on open', async () => {
    render(
      <CommentDialog
        open
        title="Return for changes"
        description="Tell the applicant what to change."
        confirmLabel="Return for changes"
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Return for changes');
    // Focus is moved in a requestAnimationFrame, so wait for it.
    await waitFor(() => expect(screen.getByLabelText(/comment/i)).toHaveFocus());
  });

  it('restores focus to the trigger when closed via Escape', async () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Reject' });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
