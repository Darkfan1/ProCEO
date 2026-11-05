import { useState, useEffect, useCallback, useRef } from 'react';
import { ScheduleItem, SmartTask } from '../types/ceoTypes';
import { getLocalTodayYmd, parseLocalYmd } from '../utils/dateUtils';
import { dialogService } from '../components/common/CustomDialog';

export function isScheduleActiveOnDate(item: ScheduleItem, dateYmd: string): boolean {
  if (item.repeat === 'DAILY') return true;
  if (item.repeat === 'ONCE') return item.date === dateYmd;
  const d = parseLocalYmd(dateYmd);
  const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
  if (item.repeat === 'WEEKDAYS') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (item.repeat === 'WEEKLY') {
    const baseDate = parseLocalYmd(item.date);
    return baseDate.getDay() === dayOfWeek;
  }
  return item.date === dateYmd;
}

export function playExecutiveChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);

      gain.gain.setValueAtTime(0.001, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.11 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.11 + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.6);
    });
  } catch {
    // Trình duyệt chặn autoplay trước khi tương tác
  }
}

export function useDailyReminderEngine(
  schedules: ScheduleItem[],
  smartTasks: SmartTask[],
  soundEnabled = true
) {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [upcomingAlert, setUpcomingAlert] = useState<{
    id: string;
    title: string;
    time: string;
    minutesLeft: number;
  } | null>(null);

  const notifiedIdsRef = useRef<Set<string>>(new Set());

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      dialogService.toast('Trình duyệt hiện tại không hỗ trợ thông báo hệ thống.', 'warning');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        playExecutiveChime();
        dialogService.toast('Đã bật thông báo nhắc lịch & nhắc việc CEO!', 'success');
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayYmd = getLocalTodayYmd(now);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      let nearestUpcoming: { id: string; title: string; time: string; minutesLeft: number } | null = null;

      schedules.forEach((sched) => {
        if (!isScheduleActiveOnDate(sched, todayYmd)) return;
        if (sched.completedDates?.includes(todayYmd)) return;

        const [h, m] = (sched.startTime || '08:00').split(':').map(Number);
        const schedMinutes = (h || 0) * 60 + (m || 0);
        const diff = schedMinutes - currentMinutes;

        if (diff >= 0 && diff <= 30) {
          if (!nearestUpcoming || diff < nearestUpcoming.minutesLeft) {
            nearestUpcoming = {
              id: sched.id,
              title: sched.title,
              time: sched.startTime,
              minutesLeft: diff,
            };
          }
        }

        const remindWindow = sched.remindMinutesBefore ?? 10;
        const notifKey = `${todayYmd}_${sched.id}`;

        if (diff >= 0 && diff <= remindWindow && !notifiedIdsRef.current.has(notifKey)) {
          notifiedIdsRef.current.add(notifKey);
          if (soundEnabled) playExecutiveChime();

          const msg =
            diff === 0
              ? `Đến giờ lịch trình: "${sched.title}" (${sched.startTime})`
              : `Còn ${diff} phút tới lịch: "${sched.title}" (${sched.startTime})`;

          dialogService.toast(msg, 'info');

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('ProCEO • Nhắc Lịch Điều Hành', {
                body: msg,
              });
            } catch {}
          }
        }
      });

      setUpcomingAlert(nearestUpcoming);
    };

    checkReminders();
    const timer = setInterval(checkReminders, 30000);
    return () => clearInterval(timer);
  }, [schedules, smartTasks, soundEnabled]);

  return {
    notifPermission,
    requestNotificationPermission,
    upcomingAlert,
    triggerTestChime: () => {
      playExecutiveChime();
      dialogService.toast('Chuông nhắc lịch & nhắc việc CEO đang hoạt động tốt!', 'success');
    },
  };
}
