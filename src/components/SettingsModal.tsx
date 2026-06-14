import { X, Moon, Sun, LogOut } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSignOut: () => void; // Добавили проп для функции выхода
}

export function SettingsModal({ isOpen, onClose, isDarkMode, onToggleDarkMode, onSignOut }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Шапка */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Настройки</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        
        {/* Контент настроек */}
        <div className="p-6 flex flex-col gap-6">
          
          {/* Блок: Смена темы */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600" />
              )}
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Темы</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Изменить тему</div>
              </div>
            </div>
            <button
              onClick={onToggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isDarkMode ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              aria-label="Переключить темную тему"
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Блок: Выйти из аккаунта (в том же стиле) */}
          <button
            onClick={onSignOut}
            className="flex items-center justify-between w-full text-left group"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-500 dark:text-red-400 transition-transform group-hover:translate-x-0.5" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Аккаунт</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Выйти из аккаунта</div>
              </div>
            </div>
          </button>

        </div>
        
        {/* Подвал */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}