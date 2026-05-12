import { X, Ruler, Info, Box, Layers, MoveRight, ReceiptText } from "lucide-react";

export default function ProductDetailsModal({ item, onClose }) {
  if (!item) return null;

  const {
    emoji = "🪵",
    categoryLabel = "Madera",
    id,
    woodName = "Madera",
    measureLabel,
    description,
    ancho_in = 0,
    alto_in = 0,
    largo = 0,
    m3 = 0,
    pricingStrategy = "unidad",
    status
  } = item;

  // Formateo de dimensiones para la visualización
  const inchDimensions = `${ancho_in}" x ${alto_in}"`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        
        {/* Cabecera Estética con fondo dinámico según estado */}
        <div className={`h-40 flex items-center justify-center text-8xl relative bg-linear-to-br ${status === 'disponible' ? 'from-bg-soft to-surface' : 'from-gray-100 to-gray-200'}`}>
          <span className="drop-shadow-md">{emoji}</span>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-xs transition-transform hover:scale-110 text-primary"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="flex justify-between items-start mb-2">
            <span className="badge badge-accent uppercase text-[10px] tracking-widest px-3 py-1">
              {categoryLabel}
            </span>
            <span className="text-[10px] text-text-subtle font-mono uppercase">
              Ref: {id}
            </span>
          </div>

          <h2 className="text-3xl font-display font-black text-primary mb-1">
            {woodName}
          </h2>
          
          <div className="text-accent font-bold text-sm mb-6 flex items-center gap-2">
            <Layers size={14} /> 
            <span>{measureLabel || "Medida personalizada"}</span>
          </div>

          {/* Sección de Descripción */}
          <div className="bg-surface-2 p-5 rounded-2xl mb-6 border border-border/50">
            <h4 className="text-xs font-bold uppercase text-accent mb-2 flex items-center gap-2">
              <Info size={14} /> Propiedades de la Especie
            </h4>
            <p className="text-sm text-text-muted leading-relaxed italic">
              {description || "Información técnica sobre la durabilidad y uso recomendada para esta especie de madera."}
            </p>
          </div>

          {/* Ficha Técnica Cuadriculada */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Columna 1 */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 bg-accent/10 rounded-lg text-accent">
                  <Ruler size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-subtle leading-none mb-1">Sección (in)</p>
                  <p className="text-sm font-bold text-text">{inchDimensions}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 bg-accent/10 rounded-lg text-accent">
                  <MoveRight size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-subtle leading-none mb-1">Largo</p>
                  <p className="text-sm font-bold text-text">{Number(largo).toFixed(2)} m</p>
                </div>
              </div>
            </div>

            {/* Columna 2 */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 bg-accent/10 rounded-lg text-accent">
                  <Box size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-subtle leading-none mb-1">Volumen</p>
                  <p className="text-sm font-bold text-text">{Number(m3).toFixed(4)} m³</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 bg-accent/10 rounded-lg text-accent">
                  <ReceiptText size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-subtle leading-none mb-1">Cobro por</p>
                  <p className="text-sm font-bold text-text capitalize">
                    {pricingStrategy.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="btn btn-primary w-full py-4 font-bold tracking-wide text-lg shadow-lg shadow-primary/20"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}