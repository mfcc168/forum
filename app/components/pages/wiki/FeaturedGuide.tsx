'use client';

import { Icon } from '@/app/components/ui/Icon';

interface Step {
  title: string;
  description: string;
}

interface FeaturedGuideProps {
  title: string;
  howToJoin: string;
  description: string;
  steps: Step[];
}

export function FeaturedGuide({ title, howToJoin, description, steps }: FeaturedGuideProps) {
  const stepColors = [
    { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    { bg: 'bg-blue-100', text: 'text-blue-600' },
    { bg: 'bg-purple-100', text: 'text-purple-600' },
    { bg: 'bg-orange-100', text: 'text-orange-600' },
  ];

  return (
    <div className="minecraft-panel p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Icon name="star" className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
      </div>
      
      <div className="minecraft-card p-8">
        <div className="flex items-center space-x-3 mb-4">
          <Icon name="checkCircle" className="w-6 h-6 text-slate-600" />
          <h4 className="text-xl font-bold text-slate-800">{howToJoin}</h4>
        </div>
        <p className="text-slate-600 mb-6 leading-relaxed">
          {description}
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {steps.slice(0, 2).map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${stepColors[index]?.bg} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                  <span className={`${stepColors[index]?.text} font-bold text-sm`}>{index + 1}</span>
                </div>
                <div>
                  <h5 className="font-semibold text-slate-800">{step.title}</h5>
                  <p className="text-slate-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-4">
            {steps.slice(2).map((step, index) => {
              const stepNumber = index + 2;
              const colorIndex = stepNumber;
              return (
                <div key={stepNumber} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 ${stepColors[colorIndex]?.bg} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                    <span className={`${stepColors[colorIndex]?.text} font-bold text-sm`}>{stepNumber + 1}</span>
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-800">{step.title}</h5>
                    <p className="text-slate-600 text-sm">
                      {step.description}
                      {stepNumber === 2 && (
                        <code className="bg-slate-100 px-3 py-2 rounded-lg text-sm font-mono ml-1">play.ourserver.com</code>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}