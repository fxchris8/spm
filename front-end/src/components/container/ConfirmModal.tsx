import { Button, Modal } from 'flowbite-react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

interface ConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'failure' | 'warning' | 'success' | 'info';
}

export function ConfirmModal({
  show,
  onClose,
  onConfirm,
  message,
  confirmText = 'Ya',
  cancelText = 'Batal',
  confirmColor = 'warning',
}: ConfirmModalProps) {
  return (
    <Modal show={show} size="md" onClose={onClose} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="text-center">
          <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400" />
          <h3 className="mb-5 text-lg font-normal text-gray-500">{message}</h3>
          <div className="flex justify-center gap-4">
            <Button color={confirmColor} onClick={onConfirm}>
              {confirmText}
            </Button>
            <Button color="gray" onClick={onClose}>
              {cancelText}
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
