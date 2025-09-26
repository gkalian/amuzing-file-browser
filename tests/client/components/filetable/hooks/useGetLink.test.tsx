import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../../utils/test-utils';
import { useGetLink } from '@/client/components/filetable/hooks/useGetLink';

vi.mock('@/client/services/apiClient', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    api: {
      ...actual.api,
      publicFileUrl: async (p: string) => `https://example.com/files${p}`,
    },
  };
});

vi.mock('@/client/core/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

function TestComp() {
  const getLink = useGetLink();
  return <button onClick={() => getLink('/a.txt')}>Get link</button>;
}

describe('useGetLink', () => {
  const writeText = vi.fn(() => Promise.resolve());
  beforeAll(() => {
    Object.assign(navigator, { clipboard: { writeText } });
  });

  beforeEach(() => {
    writeText.mockClear();
  });

  it('copies public url to clipboard', async () => {
    render(<TestComp />);
    fireEvent.click(screen.getByText('Get link'));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://example.com/files/a.txt'));
  });
});
