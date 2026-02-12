import { Button, Modal } from 'flowbite-react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

interface DeleteConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
}

export function DeleteConfirmModal({
  show,
  onClose,
  onConfirm,
  title = 'Konfirmasi Hapus',
  message,
}: DeleteConfirmModalProps) {
  return (
    <Modal show={show} size="md" onClose={onClose} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="text-center">
          <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{title}</h2>
          <p className="mb-5 text-base font-normal text-gray-500">{message}</p>
          <div className="flex justify-center gap-4">
            <Button color="failure" onClick={onConfirm}>
              Ya, Hapus
            </Button>
            <Button color="gray" onClick={onClose}>
              Batal
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
