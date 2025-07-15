interface TicketTooltipProps {
  hoverInfo: {
    stepName: string;
    date: string;
    author: string;
    status: string;
    x: number;
    y: number;
  } | null;
}

export default function TicketTooltip({ hoverInfo }: TicketTooltipProps) {
  if (!hoverInfo) return null;

  return (
    <div 
      className="fixed z-50 bg-black bg-opacity-30 backdrop-blur-sm border border-gray-600 rounded-lg p-3 pointer-events-none transform -translate-x-1/2 -translate-y-full"
      style={{
        left: hoverInfo.x,
        top: hoverInfo.y
      }}
    >
      <div className="space-y-2">
        <h4 className="text-logoWhite font-semibold text-sm">{hoverInfo.stepName}</h4>
        <div className="space-y-1 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <span>🎯</span>
            <span className="text-white">{hoverInfo.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span className="text-white">{hoverInfo.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👤</span>
            <span className="text-white">{hoverInfo.author}</span>
          </div>
        </div>
      </div>
    </div>
  );
}