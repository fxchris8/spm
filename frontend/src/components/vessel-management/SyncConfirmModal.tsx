import { Button, Modal } from 'flowbite-react';
import { HiOutlineInformationCircle } from 'react-icons/hi';

interface SyncConfirmModalProps {
  show: boolean;
  currentPosition: string;
  linkedPosition: string;
  onSyncBoth: () => void;
  onSaveOnly: () => void;
  onClose: () => void;
}

export function SyncConfirmModal({
  show,
  currentPosition,
  linkedPosition,
  onSyncBoth,
  onSaveOnly,
  onClose,
}: SyncConfirmModalProps) {
  return (
    <Modal show={show} size="md" onClose={onClose} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="text-center">
          <HiOutlineInformationCircle className="mx-auto mb-4 h-14 w-14 text-blue-400" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Terapkan ke Posisi Terkait?
          </h2>
          <p className="mb-2 text-base font-normal text-gray-500">
            Posisi{' '}
            <span className="font-semibold text-gray-700">
              {currentPosition}
            </span>{' '}
            dan{' '}
            <span className="font-semibold text-gray-700">
              {linkedPosition}
            </span>{' '}
            menggunakan vessel yang sama. Apakah perubahan ini juga ingin
            diterapkan ke posisi{' '}
            <span className="font-semibold text-gray-700">
              {linkedPosition}
            </span>
            ?
          </p>
          <div className="flex justify-center gap-3">
            <Button color="blue" onClick={onSyncBoth}>
              Ya, terapkan juga ke {linkedPosition}
            </Button>
            <Button color="gray" onClick={onSaveOnly}>
              Simpan hanya {currentPosition}
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
