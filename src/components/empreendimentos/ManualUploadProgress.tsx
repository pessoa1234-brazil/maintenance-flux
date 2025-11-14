import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type UploadStage = 'idle' | 'uploading' | 'processing' | 'extracting' | 'complete' | 'error';

interface ManualUploadProgressProps {
  stage: UploadStage;
  manualType: string;
  fileName?: string;
}

const stages = [
  { id: 'uploading', label: 'Upload do arquivo' },
  { id: 'processing', label: 'Processamento' },
  { id: 'extracting', label: 'Extração de conteúdo' },
  { id: 'complete', label: 'Concluído' },
];

export const ManualUploadProgress = ({ stage, manualType, fileName }: ManualUploadProgressProps) => {
  if (stage === 'idle') return null;

  const currentStageIndex = stages.findIndex(s => s.id === stage);
  const progress = stage === 'complete' ? 100 : ((currentStageIndex + 1) / stages.length) * 100;

  const getStageIcon = (stageId: string) => {
    const stageIndex = stages.findIndex(s => s.id === stageId);
    
    if (stage === 'error') {
      return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
    
    if (stageIndex < currentStageIndex || stage === 'complete') {
      return <CheckCircle2 className="h-5 w-5 text-primary" />;
    }
    
    if (stageId === stage) {
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }
    
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-sm">
              {stage === 'error' ? 'Erro no processamento' : `Processando ${manualType}`}
            </h4>
            {fileName && (
              <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
            )}
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="space-y-3">
          {stages.map((stageItem) => (
            <div key={stageItem.id} className="flex items-center gap-3">
              {getStageIcon(stageItem.id)}
              <span className={`text-sm ${
                stages.findIndex(s => s.id === stageItem.id) <= currentStageIndex || stage === 'complete'
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              }`}>
                {stageItem.label}
              </span>
            </div>
          ))}
        </div>

        {stage === 'error' && (
          <p className="text-sm text-destructive mt-2">
            Houve um erro ao processar o manual. Por favor, tente novamente.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
