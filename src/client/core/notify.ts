// Notification helpers: thin wrappers around Mantine notifications for success/info/error.
import { notifications } from '@mantine/notifications';

export function notifySuccess(message: string, title = 'Success') {
  notifications.show({ title, message, color: 'green', autoClose: 3000, withCloseButton: true, style: { pointerEvents: 'auto' } });
}

export function notifyInfo(message: string, title = 'Info') {
  notifications.show({ title, message, color: 'blue', autoClose: 3000, withCloseButton: true, style: { pointerEvents: 'auto' } });
}

export function notifyError(message: string, title = 'Error', persistent = true) {
  notifications.show({
    title,
    message,
    color: 'red',
    autoClose: persistent ? false : 5000,
    withCloseButton: true,
    style: { pointerEvents: 'auto' },
  });
}
