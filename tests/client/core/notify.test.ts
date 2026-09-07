// Basic tests for the notify wrappers: correct color/autoClose per notification
// kind, and title fallback via i18n when none is provided.
import { notifySuccess, notifyInfo, notifyError } from '@/client/core/notify';

vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

import { notifications } from '@mantine/notifications';

describe('notify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('notifySuccess shows a green, auto-closing notification', () => {
    notifySuccess('Done', 'Saved');
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Saved', message: 'Done', color: 'green', autoClose: 3000 })
    );
  });

  it('notifyInfo shows a blue, auto-closing notification', () => {
    notifyInfo('Heads up');
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Heads up', color: 'blue', autoClose: 3000 })
    );
  });

  it('notifyError defaults to persistent (autoClose: false)', () => {
    notifyError('Something broke');
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Something broke', color: 'red', autoClose: false })
    );
  });

  it('notifyError auto-closes when marked non-persistent', () => {
    notifyError('Retry later', 'Upload failed', false);
    expect(notifications.show).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Upload failed', autoClose: 5000 })
    );
  });

  it('falls back to a translated title when none is given', () => {
    notifySuccess('Done');
    const call = (notifications.show as any).mock.calls[0][0];
    expect(typeof call.title).toBe('string');
    expect(call.title.length).toBeGreaterThan(0);
  });
});
