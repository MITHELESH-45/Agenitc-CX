import React from 'react';

const MetricsPanel = ({ metrics }) => {
  const getProgressBarColor = (value) => {
    if (value < 0.6) return 'bg-red-500';
    if (value < 0.8) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const MetricRow = ({ label, value }) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-sm font-bold text-slate-900">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${getProgressBarColor(value)}`}
          style={{ width: `${value * 100}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-slate-800">RAG Evaluation (Ragas)</h3>
        {metrics.evaluated_at && (
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">
            Last Eval: {new Date(metrics.evaluated_at).toLocaleTimeString()}
          </span>
        )}
      </div>
      
      {!metrics.faithfulness && !metrics.answer_relevancy ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-500 font-medium">No evaluation data yet.</p>
          <p className="text-xs text-slate-400 mt-1">Run ragas_eval.py to generate scores.</p>
        </div>
      ) : (
        <>
          <MetricRow label="Faithfulness" value={metrics.faithfulness || 0} />
          <MetricRow label="Answer Relevancy" value={metrics.answer_relevancy || 0} />
          <MetricRow label="Context Precision" value={metrics.context_precision || 0} />
          
          <div className="mt-8 pt-6 border-t border-slate-50">
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              * Ragas metrics help measure the quality of the generative AI response compared to the retrieved context.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MetricsPanel;
