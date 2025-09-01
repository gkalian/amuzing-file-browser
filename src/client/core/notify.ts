// Notification helpers: thin wrappers around Mantine notifications for success/info/error.
import { notifications } from '@mantine/notifications';
import i18next from 'i18next';

export function notifySuccess(message: string, title?: string) {
  const ttl = title ?? i18next.t('notifications.titleSuccess', { defaultValue: 'Успех / Success' });
  notifications.show({
    title: ttl,
    message,
    color: 'green',
    autoClose: 3000,
    withCloseButton: true,
    style: { pointerEvents: 'auto' },
  });
}

export function notifyInfo(message: string, title?: string) {
  const ttl = title ?? i18next.t('notifications.titleInfo', { defaultValue: 'Info' });
  notifications.show({
    title: ttl,
    message,
    color: 'blue',
    autoClose: 3000,
    withCloseButton: true,
    style: { pointerEvents: 'auto' },
  });
}

export function notifyError(message: string, title?: string, persistent = true) {
  notifications.show({
    title: title ?? i18next.t('notifications.titleError', { defaultValue: 'Error' }),
    message,
    color: 'red',
    autoClose: persistent ? false : 5000,
    withCloseButton: true,
    style: { pointerEvents: 'auto' },
  });
}
