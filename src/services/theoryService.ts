import { FrameworkCode } from '../data/managementFrameworksTheory';

type TheoryNavigationListener = (code: FrameworkCode) => void;

let activeListener: TheoryNavigationListener | null = null;
let currentFrameworkCode: FrameworkCode = 'SMART';

export const theoryService = {
  open: (code: FrameworkCode = 'SMART') => {
    currentFrameworkCode = code;
    if (activeListener) {
      activeListener(code);
    }
  },
  getCurrentCode: () => currentFrameworkCode,
  setCurrentCode: (code: FrameworkCode) => {
    currentFrameworkCode = code;
  },
  subscribe: (listener: TheoryNavigationListener) => {
    activeListener = listener;
    return () => {
      if (activeListener === listener) {
        activeListener = null;
      }
    };
  },
};
