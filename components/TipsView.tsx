
import React from 'react';
import { Lightbulb, Sun, ScanLine, Type, ArrowLeft } from 'lucide-react';
import { Button } from './Button';

interface TipsViewProps {
  onClose: () => void;
}

export const TipsView: React.FC<TipsViewProps> = ({ onClose }) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-0 pb-40 animate-spring-up" key="tips">
         <div className="max-w-2xl mx-auto mt-6">
             <div className="flex items-center gap-4 mb-8">
                 <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    <ArrowLeft size={24} className="text-black dark:text-white" />
                 </button>
                 <h2 className="text-3xl font-bold text-black dark:text-white tracking-tight">Советы</h2>
             </div>

             <div className="space-y-6">
                 {/* Tip 1 */}
                 <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[32px] shadow-sm flex gap-5 items-start">
                     <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                         <Sun size={24} />
                     </div>
                     <div>
                         <h3 className="text-lg font-bold text-black dark:text-white mb-2">Освещение — это главное</h3>
                         <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                             Избегайте резких теней. Естественный дневной свет работает лучше всего. Если используете лампу, старайтесь осветить документ равномерно.
                         </p>
                     </div>
                 </div>

                 {/* Tip 2 */}
                 <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[32px] shadow-sm flex gap-5 items-start">
                     <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                         <ScanLine size={24} />
                     </div>
                     <div>
                         <h3 className="text-lg font-bold text-black dark:text-white mb-2">Угол съемки</h3>
                         <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                             Держите телефон строго параллельно документу. Наклон может исказить текст. Наш AI умеет исправлять перспективу, но лучший результат — на прямом фото.
                         </p>
                     </div>
                 </div>

                  {/* Tip 3 */}
                 <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[32px] shadow-sm flex gap-5 items-start">
                     <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shrink-0">
                         <Type size={24} />
                     </div>
                     <div>
                         <h3 className="text-lg font-bold text-black dark:text-white mb-2">Сложные шрифты</h3>
                         <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                             Рукописный текст распознается сложнее. Если почерк неразборчив, попробуйте использовать функцию "Ask AI" в чате, чтобы восстановить контекст по смыслу.
                         </p>
                     </div>
                 </div>
             </div>
         </div>
    </div>
  );
};
