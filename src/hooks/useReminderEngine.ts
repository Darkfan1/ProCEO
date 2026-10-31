import { useEffect, useRef, useState, useCallback } from 'react';
import {
  AxisScheduleItem,
  AxisSmartTask,
  AxisPdcaCycle,
  AxisMeeting,
} from '../types/axisTypes';
import { dialogService } from '../components/common/CustomDialog';
import { getLocalTodayYmd, parseLocalYmd } from '../utils/dateUtils';

// Âm chuông nhắc lịch nhẹ nhàng, sang trọng bằng Web Audio API (không cần file mp3 rời)
export function playExecutiveChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99]; // Hợp âm Đô trưởng thanh thoát (C5 - E5 - G5)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + idx * 0.11 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.11 + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.11);
      osc.stop(ctx.currentTime + idx * 0.11 + 0.7);
    });
  } catch {}
}

export function isScheduleActiveOnDate(item: AxisScheduleItem, dateObj: Date): boolean {
  const ymd = getLocalTodayYmd(dateObj);
  const day = dateObj.getDay(); // 0 CN -> 6 T7 (theo giờ địa phương)
  if (item.recurrence === 'ONCE') return item.date === ymd;
  if (item.recurrence === 'DAILY') return ymd >= item.date;
  if (item.recurrence === 'WEEKDAYS') return day >= 1 && day <= 6 && ymd >= item.date;
  if (item.recurrence === 'WEEKLY') {
    const targetDay = item.weekday ?? parseLocalYmd(item.date).getDay();
    return day === targetDay && ymd >= item.date;
  }
  return false;
}

export function useReminderEngine(
  schedules: AxisScheduleItem[],
  smartTasks: AxisSmartTask[],
  pdcaCycles: AxisPdcaCycle[],
  meetings: AxisMeeting[] = []
) {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const firedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem('axis_fired_reminders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          firedKeysRef.current = new Set(parsed.slice(-200));
        }
      }
    } catch {}
  }, []);

  const markFired = (key: string) => {
    firedKeysRef.current.add(key);
    try {
      localStorage.setItem(
        'axis_fired_reminders',
        JSON.stringify(Array.from(firedKeysRef.current).slice(-200))
      );
    } catch {}
  };

  const triggerAlert = useCallback((title: string, body: string) => {
    playExecutiveChime();
    dialogService.toast(`${title}: ${body}`, 'info');

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/axis-icon.svg',
        });
      } catch {}
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      dialogService.toast('Trình duyệt hiện tại không hỗ trợ thông báo hệ thống.', 'warning');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      triggerAlert(
        'AXIS — Chuông nhắc lịch đã sẵn sàng',
        'Hệ thống sẽ nhắc đúng giờ các lịch họp, lịch trình và mốc tiến độ của CEO.'
      );
    }
  };

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayYmd = getLocalTodayYmd(now);
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentHm = `${hh}:${mm}`;

      // 1. Nhắc lịch theo giờ hàng ngày
      schedules.forEach((sch) => {
        if (!isScheduleActiveOnDate(sch, now)) return;
        if ((sch.completedDates || []).includes(todayYmd)) return;
        if (sch.time === currentHm) {
          const key = `sch-${sch.id}-${todayYmd}-${currentHm}`;
          if (!firedKeysRef.current.has(key)) {
            markFired(key);
            triggerAlert(`⏰ Đến giờ lịch trình (${sch.time})`, sch.title);
          }
        }
      });

      // 2. Nhắc đúng giờ cho Cuộc họp điều hành trong ngày
      meetings.forEach((m) => {
        if (m.status === 'COMPLETED') return;
        if (m.date === todayYmd && m.time === currentHm) {
          const key = `meet-${m.id}-${todayYmd}-${currentHm}`;
          if (!firedKeysRef.current.has(key)) {
            markFired(key);
            triggerAlert(`📅 Đến giờ họp (${m.time})`, m.title);
          }
        }
      });

      // 3. Nhắc tổng hợp đầu ngày cho các mốc tiến độ & PDCA đến hạn hôm nay (1 lần trong ngày)
      const dueCheckinsCount = smartTasks
        .filter((t) => t.status !== 'COMPLETED')
        .reduce(
          (acc, t) =>
            acc + t.checkins.filter((c) => !c.completed && c.dueDate === todayYmd).length,
          0
        );

      if (dueCheckinsCount > 0) {
        const morningKey = `milestone-digest-${todayYmd}`;
        if (!firedKeysRef.current.has(morningKey) && now.getHours() >= 8) {
          markFired(morningKey);
          triggerAlert(
            '🧭 Nhắc mốc kiểm tra tiến độ hôm nay',
            `Có ${dueCheckinsCount} mốc kiểm tra tiến độ công việc đến hạn rà soát hôm nay.`
          );
        }
      }

      const duePdcaCount = pdcaCycles.filter(
        (p) => p.currentPhase !== 'STANDARDIZED' && p.checkDate === todayYmd
      ).length;

      if (duePdcaCount > 0) {
        const pdcaKey = `pdca-digest-${todayYmd}`;
        if (!firedKeysRef.current.has(pdcaKey) && now.getHours() >= 8) {
          markFired(pdcaKey);
          triggerAlert(
            '🔄 Đến ngày kiểm tra kết quả PDCA',
            `Có ${duePdcaCount} chu trình cải tiến PDCA đến hẹn đánh giá hiệu quả hôm nay.`
          );
        }
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 25000);
    return () => clearInterval(interval);
  }, [schedules, smartTasks, pdcaCycles, meetings, triggerAlert]);

  return {
    notifPermission,
    requestNotificationPermission,
    testChime: () =>
      triggerAlert(
        'AXIS — Kiểm tra chuông điều hành',
        'Âm báo và thông báo nhắc lịch hoạt động hoàn hảo.'
      ),
  };
}
