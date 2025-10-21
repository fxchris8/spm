import { Alert } from 'flowbite-react';
import { HiInformationCircle, HiCheckCircle, HiXCircle } from 'react-icons/hi';

interface AlertComponentProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose?: () => void;
}

export function AlertComponent({
  type,
  message,
  onClose,
}: AlertComponentProps) {
  const colorMap = {
    success: 'success',
    error: 'failure',
    info: 'info',
    warning: 'warning',
  };

  const IconComponent = {
    success: HiCheckCircle,
    error: HiXCircle,
    info: HiInformationCircle,
    warning: HiInformationCircle,
  };

  return (
    <Alert
      color={colorMap[type]}
      icon={IconComponent[type]}
      onDismiss={onClose}
      className="mb-4"
    >
      <span className="font-medium">
        {type === 'success' && 'Berhasil! '}
        {type === 'error' && 'Error! '}
        {type === 'info' && 'Info: '}
        {type === 'warning' && 'Peringatan: '}
      </span>
      {message}
    </Alert>
  );
}
