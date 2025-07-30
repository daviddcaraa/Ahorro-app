import React, { useState, useEffect, useMemo } from 'react';
import { Target, TrendingUp, Award, Filter, Palette, RefreshCw } from 'lucide-react';
import { ObjectiveInput } from './components/ObjectiveInput';
import { ProgressStats } from './components/ProgressStats';
import { CentBoxGrid } from './components/CentBoxGrid';
import { FilterControls } from './components/FilterControls';
import { AchievementModal } from './components/AchievementModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ThemeToggle } from './components/ThemeToggle';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useCelebrations } from './hooks/useCelebrations';
import { calculateCentsNeeded, generateCentAmounts } from './utils/calculations';

export type FilterType = 'all' | 'completed' | 'pending' | 'range';
export type RangeType = '0-10' | '10-50' | '50-100' | '100+';

function App() {
  const [objective, setObjective] = useLocalStorage<number>('objective', 0);
  const [markedBoxes, setMarkedBoxes] = useLocalStorage<Set<number>>('markedBoxes', new Set());
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedRange, setSelectedRange] = useState<RangeType>('0-10');
  const [isDark, setIsDark] = useLocalStorage<boolean>('darkMode', false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingObjective, setPendingObjective] = useState(0);

  const { achievement, showCelebration, triggerCelebration, closeCelebration } = useCelebrations();

  const centAmounts = useMemo(() => 
    objective > 0 ? generateCentAmounts(objective) : [], 
    [objective]
  );

  const progress = useMemo(() => {
    const completed = Array.from(markedBoxes).reduce((sum, index) => {
      return sum + (centAmounts[index] || 0);
    }, 0);
    
    return {
      completed,
      total: objective,
      percentage: objective > 0 ? (completed / objective) * 100 : 0,
      completedBoxes: markedBoxes.size,
      totalBoxes: centAmounts.length
    };
  }, [markedBoxes, centAmounts, objective]);

  const filteredBoxes = useMemo(() => {
    const indices = centAmounts.map((_, index) => index);
    
    if (filter === 'completed') {
      return indices.filter(index => markedBoxes.has(index));
    }
    
    if (filter === 'pending') {
      return indices.filter(index => !markedBoxes.has(index));
    }
    
    if (filter === 'range') {
      return indices.filter(index => {
        const amount = centAmounts[index];
        switch (selectedRange) {
          case '0-10': return amount <= 10;
          case '10-50': return amount > 10 && amount <= 50;
          case '50-100': return amount > 50 && amount <= 100;
          case '100+': return amount > 100;
          default: return true;
        }
      });
    }
    
    return indices;
  }, [centAmounts, markedBoxes, filter, selectedRange]);

  const handleObjectiveSubmit = (newObjective: number) => {
    if (markedBoxes.size > 0) {
      setPendingObjective(newObjective);
      setShowConfirm(true);
    } else {
      setObjective(newObjective);
    }
  };

  const handleConfirmObjective = () => {
    setObjective(pendingObjective);
    setMarkedBoxes(new Set());
    setShowConfirm(false);
    setPendingObjective(0);
  };

  const handleBoxToggle = (index: number) => {
    if (markedBoxes.has(index)) return; // No permitir desmarcar
    
    const newMarkedBoxes = new Set(markedBoxes);
    newMarkedBoxes.add(index);
    setMarkedBoxes(newMarkedBoxes);
    
    // Calcular nuevo progreso para celebraciones
    const newCompleted = Array.from(newMarkedBoxes).reduce((sum, idx) => {
      return sum + (centAmounts[idx] || 0);
    }, 0);
    
    const newPercentage = objective > 0 ? (newCompleted / objective) * 100 : 0;
    
    // Trigger celebrations
    if (newPercentage >= 25 && progress.percentage < 25) {
      triggerCelebration('¡25% alcanzado!', 'Has completado un cuarto de tu objetivo. ¡Sigue así!', '🎉');
    } else if (newPercentage >= 50 && progress.percentage < 50) {
      triggerCelebration('¡Mitad del camino!', 'Has alcanzado el 50% de tu objetivo. ¡Increíble progreso!', '🔥');
    } else if (newPercentage >= 75 && progress.percentage < 75) {
      triggerCelebration('¡75% completado!', 'Solo te queda un último empujón. ¡Ya casi lo tienes!', '⭐');
    } else if (newPercentage >= 100 && progress.percentage < 100) {
      triggerCelebration('¡OBJETIVO CUMPLIDO!', '¡Felicidades! Has alcanzado tu meta de ahorro. ¡Eres increíble!', '🏆');
    }
  };

useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  if (objective === 0) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}>
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Target className="h-8 w-8 text-blue-600" />
              <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                AHORRO DEL CÉNTIMO
              </h1>
            </div>
            <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Alcanza tu objetivo de ahorro céntimo a céntimo. Define tu meta y comienza 
              tu viaje hacia el éxito financiero.
            </p>
          </header>
          
          <div className="max-w-md mx-auto">
            <ObjectiveInput onSubmit={handleObjectiveSubmit} isDark={isDark} />
          </div>
          
          <div className="fixed top-4 right-4">
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="container mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="h-6 w-6 text-blue-600" />
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              AHORRO DEL CÉNTIMO
            </h1>
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Objetivo: {objective.toFixed(2)}€
          </p>
        </header>

        <div className="mb-8">
          <ProgressStats progress={progress} isDark={isDark} />
        </div>

        <div className="mb-6">
          <FilterControls
            filter={filter}
            onFilterChange={setFilter}
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            isDark={isDark}
          />
        </div>

        <CentBoxGrid
          centAmounts={centAmounts}
          markedBoxes={markedBoxes}
          filteredIndices={filteredBoxes}
          onBoxToggle={handleBoxToggle}
          isDark={isDark}
        />

        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
          <button
            onClick={() => handleObjectiveSubmit(0)}
            className={`p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-white hover:bg-gray-50 text-gray-700'
            }`}
            title="Cambiar objetivo"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {showCelebration && achievement && (
          <AchievementModal
            title={achievement.title}
            message={achievement.message}
            emoji={achievement.emoji}
            onClose={closeCelebration}
            isDark={isDark}
          />
        )}

        {showConfirm && (
          <ConfirmModal
            title="Cambiar objetivo"
            message={`¿Estás seguro de que quieres cambiar tu objetivo a ${pendingObjective.toFixed(2)}€? Se perderá todo tu progreso actual.`}
            onConfirm={handleConfirmObjective}
            onCancel={() => setShowConfirm(false)}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
}

export default App;