import React, { useRef, useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  Shield,
  Database,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Key,
} from 'lucide-react';
import {
  ScheduleItem,
  SmartTask,
  PdcaCycle,
  Meeting369,
  OkrObjective,
  SwotBoard,
  MaslowEmployeePlan,
  FfcPraiseRecord,
  PrepMessage,
  OperatingMode,
} from '../../types/ceoTypes';
import { ceoStorageService } from '../../services/ceoStorageService';
import { dialogService } from '../common/CustomDialog';
import { getLocalTodayYmd } from '../../utils/dateUtils';

interface ExecutiveSettingsViewProps {
  operatingMode: OperatingMode;
  onToggleMode: (mode: OperatingMode) => void;
  schedules: ScheduleItem[];
  smartTasks: SmartTask[];
  pdcaCycles: PdcaCycle[];
  meetings: Meeting369[];
  okrs: OkrObjective[];
  swotBoards: SwotBoard[];
  maslowPlans: MaslowEmployeePlan[];
  ffcPraises: FfcPraiseRecord[];
  prepMessages: PrepMessage[];
  setSchedules: (v: ScheduleItem[]) => void;
  setSmartTasks: (v: SmartTask[]) => void;
  setPdcaCycles: (v: PdcaCycle[]) => void;
  setMeetings: (v: Meeting369[]) => void;
  setOkrs: (v: OkrObjective[]) => void;
  setSwotBoards: (v: SwotBoard[]) => void;
  setMaslowPlans: (v: MaslowEmployeePlan[]) => void;
  setFfcPraises: (v: FfcPraiseRecord[]) => void;
  setPrepMessages: (v: PrepMessage[]) => void;
}

export const ExecutiveSettingsView: React.FC<ExecutiveSettingsViewProps> = ({
  operatingMode,
  onToggleMode,
  schedules,
  smartTasks,
  pdcaCycles,
  meetings,
  okrs,
  swotBoards,
  maslowPlans,
  ffcPraises,
  prepMessages,
  setSchedules,
  setSmartTasks,
  setPdcaCycles,
  setMeetings,
  setOkrs,
  setSwotBoards,
  setMaslowPlans,
  setFfcPraises,
  setPrepMessages,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);

  // Xuất file backup
  const handleExportBackup = () => {
    const jsonStr = ceoStorageService.exportBackupJson({
      schedules,
      smartTasks,
      pdcaCycles,
      meetings,
      okrs,
      swotBoards,
      maslowPlans,
      ffcPraises,
      prepMessages,
    });

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProCEO_Executive_Backup_${getLocalTodayYmd()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    dialogService.toast('Đã tải xuống file sao lưu dữ liệu toàn diện ProCEO!', 'success');
  };

  // Nhập file backup
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ok = await dialogService.confirm(
      'Phục hồi dữ liệu sẽ ghi đè dữ liệu hiện tại bằng dữ liệu từ file backup. Bạn có chắc chắn muốn tiếp tục?',
      'Xác nhận phục hồi dữ liệu'
    );
    if (!ok) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setRestoring(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const res = await ceoStorageService.restoreBackupJson(content, {
        setSchedules,
        setSmartTasks,
        setPdcaCycles,
        setMeetings,
        setOkrs,
        setSwotBoards,
        setMaslowPlans,
        setFfcPraises,
        setPrepMessages,
      });

      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (res.success) {
        dialogService.alert(
          'Đã phục hồi dữ liệu 8 hệ thống quản trị thành công! Hệ thống đã đồng bộ lại toàn bộ dữ liệu.',
          'Phục hồi hoàn tất'
        );
      } else {
        dialogService.alert(res.message, 'Lỗi phục hồi');
      }
    };
    reader.readAsText(file);
  };

  const hasApiKey = Boolean(
    typeof window !== 'undefined' &&
      ((import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY)
  );

  return (
    <div className="space-y-4">
      {/* 1. CHẾ ĐỘ ĐIỀU HÀNH */}
      <div className="glass-liquid p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700" />
              Chế Độ Vận Hành
            </h3>
            <p className="text-xs text-slate-500">
              Chuyển đổi giữa chế độ cá nhân một CEO và chế độ doanh nghiệp phân quyền nhiều cấp.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div
            onClick={() => onToggleMode('PERSONAL')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              operatingMode === 'PERSONAL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-extrabold text-xs ${operatingMode === 'PERSONAL' ? 'text-white' : 'text-slate-900'}`}>
                Chế Độ Cá Nhân (Khuyên dùng)
              </span>
              {operatingMode === 'PERSONAL' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className={`text-xs leading-relaxed ${operatingMode === 'PERSONAL' ? 'text-slate-300' : 'text-slate-600'}`}>
              Dành cho CEO điều hành trực tiếp toàn bộ dữ liệu cá nhân, không bắt buộc cấu hình phòng ban phức tạp, tốc độ phản hồi tức thì.
            </p>
          </div>

          <div
            onClick={() => onToggleMode('ORGANIZATION')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              operatingMode === 'ORGANIZATION'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-extrabold text-xs ${operatingMode === 'ORGANIZATION' ? 'text-white' : 'text-slate-900'}`}>
                Chế Độ Doanh Nghiệp
              </span>
              {operatingMode === 'ORGANIZATION' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className={`text-xs leading-relaxed ${operatingMode === 'ORGANIZATION' ? 'text-slate-300' : 'text-slate-600'}`}>
              Sẵn sàng phân quyền theo cấp bậc: Owner/CEO, Trợ lý điều hành, Quản đốc, Trưởng phòng và Nhân viên.
            </p>
          </div>
        </div>
      </div>

      {/* 2. SAO LƯU & PHỤC HỒI DỮ LIỆU */}
      <div className="glass-liquid p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              Sao Lưu & Phục Hồi Dữ Liệu Toàn Diện
            </h3>
            <p className="text-xs text-slate-500">
              Đảm bảo 100% dữ liệu 8 hệ thống quản trị không bị mất khi đổi thiết bị hoặc cài đặt lại.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Export Button */}
          <div className="p-4 rounded-xl bg-white/70 border border-slate-200 flex flex-col justify-between gap-3 shadow-2xs">
            <div>
              <span className="font-extrabold text-xs text-slate-900 block mb-1">
                Tải Về Tệp Sao Lưu (.json)
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Đóng gói toàn bộ Mục tiêu SMART, OKR, Chu trình PDCA, Biên bản Họp 3-6-9, Tháp Maslow, Khen thưởng FFC thành file JSON tiêu chuẩn.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tải Bản Sao Lưu Ngay</span>
            </button>
          </div>

          {/* Import Button */}
          <div className="p-4 rounded-xl bg-white/70 border border-slate-200 flex flex-col justify-between gap-3 shadow-2xs">
            <div>
              <span className="font-extrabold text-xs text-slate-900 block mb-1">
                Phục Hồi Từ Tệp Sao Lưu (.json)
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nạp lại dữ liệu đã sao lưu trước đó. Hệ thống sẽ tự động đồng bộ lại vào bộ nhớ và Cloud Firestore.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
                id="backup-file-input"
              />
              <label
                htmlFor="backup-file-input"
                className={`w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer bg-white hover:bg-slate-50 transition-colors shadow-2xs ${
                  restoring ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>{restoring ? 'Đang phục hồi...' : 'Chọn File Phục Hồi'}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 3. THỐNG KÊ CƠ SỞ DỮ LIỆU HIỆN HÀNH */}
      <div className="glass-liquid p-4 sm:p-5 space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-200/60 pb-2">
          Thống Kê Bản Ghi Trong 8 Hệ Thống Quản Trị
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Mục tiêu SMART</span>
            <span className="font-black text-sm text-slate-900">{smartTasks.length} việc</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Chu trình PDCA</span>
            <span className="font-black text-sm text-slate-900">{pdcaCycles.length} chu trình</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Cuộc họp 3-6-9</span>
            <span className="font-black text-sm text-slate-900">{meetings.length} cuộc họp</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Chiến lược OKR</span>
            <span className="font-black text-sm text-slate-900">{okrs.length} mục tiêu</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Bảng SWOT / TOWS</span>
            <span className="font-black text-sm text-slate-900">{swotBoards.length} bảng</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Hồ sơ Maslow</span>
            <span className="font-black text-sm text-slate-900">{maslowPlans.length} nhân sự</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Khen ngợi FFC</span>
            <span className="font-black text-sm text-slate-900">{ffcPraises.length} lượt</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Báo cáo PREP</span>
            <span className="font-black text-sm text-slate-900">{prepMessages.length} văn bản</span>
          </div>
        </div>
      </div>

      {/* 4. AI ENGINE STATUS */}
      <div className="glass-liquid p-4 sm:p-5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Key className="w-4 h-4 text-slate-700" />
          <div>
            <span className="font-extrabold text-slate-900 block">Trạng Thái Kết Nối AI (Gemini 2.5 Flash)</span>
            <span className="text-slate-500 text-[11px]">
              {hasApiKey ? 'Đã cấu hình API Key an toàn trong môi trường máy chủ' : 'Chưa thiết lập VITE_GEMINI_API_KEY (chạy chế độ phân tích cục bộ)'}
            </span>
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
            hasApiKey ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {hasApiKey ? 'ACTIVE' : 'OFFLINE MODE'}
        </span>
      </div>
    </div>
  );
};
