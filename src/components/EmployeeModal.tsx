import { useState, useEffect, type FormEvent } from 'react';
import { Employee } from '../types';
import { X, Check } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Employee, 'id'>, id?: number) => void;
  editingEmployee?: Employee | null;
}

export default function EmployeeModal({
  isOpen,
  onClose,
  onSave,
  editingEmployee,
}: EmployeeModalProps) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (editingEmployee) {
      setName(editingEmployee.name);
      setPosition(editingEmployee.position || '');
      setDepartment(editingEmployee.department || '');
      setPhone(editingEmployee.phone || '');
      setEmail(editingEmployee.email || '');
    } else {
      setName('');
      setPosition('');
      setDepartment('');
      setPhone('');
      setEmail('');
    }
  }, [editingEmployee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(
      {
        name: name.trim(),
        position: position.trim(),
        department: department.trim(),
        phone: phone.trim(),
        email: email.trim(),
      },
      editingEmployee ? editingEmployee.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
            </h2>
            <p className="text-xs text-slate-500">
              Введите личные и контактные данные сотрудника
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label htmlFor="emp-name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              ФИО Сотрудника <span className="text-red-500">*</span>
            </label>
            <input
              id="emp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Иванов Иван Иванович"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="emp-position" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Должность
            </label>
            <input
              id="emp-position"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Инженер-геодезист, Менеджер..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="emp-dept" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Отдел / Подразделение
            </label>
            <input
              id="emp-dept"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Отдел изысканий, IT-отдел..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="emp-phone" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Телефон
            </label>
            <input
              id="emp-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7-999-123-45-67"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="emp-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Электронная почта (Email)
            </label>
            <input
              id="emp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ivanov@company.ru"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              id="btn-save-employee"
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {editingEmployee ? 'Сохранить изменения' : 'Добавить сотрудника'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
