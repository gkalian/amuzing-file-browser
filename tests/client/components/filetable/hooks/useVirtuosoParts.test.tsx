import React from 'react';
import { render, screen, fireEvent } from '../../../../utils/test-utils';
import { useVirtuosoParts } from '@/client/components/filetable/hooks/useVirtuosoParts';

function TestComp({ clear }: { clear: () => void }) {
  const { VirtTable, VirtTableBody } = useVirtuosoParts(clear);
  return (
    <VirtTable>
      <VirtTableBody>
        <tr>
          <td>cell</td>
        </tr>
      </VirtTableBody>
    </VirtTable>
  );
}

describe('useVirtuosoParts', () => {
  it('calls clearDragOverPath when dragging over non-folder background', () => {
    const clear = vi.fn();
    render(<TestComp clear={clear} />);
    const tbody = screen.getByTestId('table-body');
    fireEvent.dragOver(tbody);
    fireEvent.dragEnter(tbody);
    expect(clear).toHaveBeenCalledTimes(2);
  });
});
